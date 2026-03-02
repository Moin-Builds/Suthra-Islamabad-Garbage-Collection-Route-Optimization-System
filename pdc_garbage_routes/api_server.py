"""
Flask API Server for PDC Garbage Routes Optimization
Islamabad, Pakistan - Real Route Optimization
Supports Serial, Parallel, and Both modes for comparison
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import sys
import pathlib
import time

# Add src to path
HERE = pathlib.Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

# Path to React production build (built by build.sh)
FRONTEND_BUILD = HERE.parent / 'frontend' / 'dist'

from src.islamabad_data import (
    generate_islamabad_bins, 
    generate_islamabad_trucks,
    get_islamabad_center,
    get_islamabad_bounds,
    ISLAMABAD_SECTORS,
    TRUCK_DEPOTS
)
from src.parallel_module import compute_metrics, assign_bins_to_trucks, choose_best_route
from src.routing import route_length

app = Flask(__name__, static_folder=str(FRONTEND_BUILD), static_url_path='')
CORS(app)  # Enable CORS for React frontend

# Store latest results
latest_results = {
    "serial": None,
    "parallel": None,
    "speedup": None,
    "completed": False,
    "routes": {},
    "bins": [],
    "trucks": [],
    "mode": None,
}

# Progress tracking
progress_state = {
    "stage": "idle",
    "percent": 0,
    "current_mode": None,
    "message": ""
}


def update_progress(stage, percent, mode=None):
    """Update progress state"""
    global progress_state
    progress_state = {
        "stage": stage,
        "percent": percent,
        "current_mode": mode,
        "message": f"[{mode}] {stage}" if mode else stage
    }


def filter_bins(bins, threshold):
    """Filter bins by fill level threshold"""
    return [b for b in bins if b.fill >= threshold]


def run_single_optimization(bins, trucks, selected, config, mode_name, workers):
    """Run optimization for a single mode (serial or parallel)"""
    parallel = (mode_name == "parallel")
    
    t2 = time.perf_counter()
    metrics = compute_metrics(
        selected_bins=selected,
        trucks=trucks,
        alpha=config['alpha'],
        beta=config['beta'],
        parallel=parallel,
        workers=workers if parallel else 1,
    )
    t_metrics = time.perf_counter() - t2
    
    t3 = time.perf_counter()
    buckets = assign_bins_to_trucks(selected, metrics)
    t_assign = time.perf_counter() - t3
    
    t4 = time.perf_counter()
    routes = {}
    route_dists = {}
    route_data = {}
    
    for truck in trucks:
        bins_with_pr = buckets.get(truck.id, [])
        r, d = choose_best_route(
            truck=truck,
            bins_with_pr=bins_with_pr,
            candidates=config['candidates'],
            parallel=parallel,
            workers=workers if parallel else 1,
            max_2opt=config['max_2opt'],
        )
        routes[truck.id] = r
        route_dists[truck.id] = d
        
        route_data[str(truck.id)] = {
            "truck_id": truck.id,
            "truck_lat": truck.y,
            "truck_lng": truck.x,
            "distance": d,
            "bins_count": len(r),
            "waypoints": [
                {"id": b.id, "lat": b.y, "lng": b.x, "fill": b.fill, "order": idx + 1}
                for idx, b in enumerate(r)
            ]
        }
    
    t_routes = time.perf_counter() - t4
    total_dist = float(sum(route_dists.values()))
    
    return {
        "t_metrics": t_metrics,
        "t_assign": t_assign,
        "t_routes": t_routes,
        "distance_total": total_dist,
        "route_data": route_data,
    }


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Truck Routes API is running - Islamabad, Pakistan"})


@app.route('/api/config/defaults', methods=['GET'])
def get_defaults():
    """Get default configuration values"""
    return jsonify({
        "bins": 100,
        "trucks": 4,
        "threshold": 60.0,
        "alpha": 1.0,
        "beta": 25.0,
        "candidates": 5,
        "max_2opt": 50,
        "workers": max(2, os.cpu_count() or 2),
        "mode": "both",
        "city": "Islamabad, Pakistan"
    })


@app.route('/api/system/info', methods=['GET'])
def get_system_info():
    """Get system information"""
    return jsonify({
        "cpu_count": os.cpu_count() or 4,
        "recommended_workers": max(2, os.cpu_count() or 2),
        "city": "Islamabad, Pakistan",
        "center": get_islamabad_center(),
        "bounds": get_islamabad_bounds()
    })


@app.route('/api/city/info', methods=['GET'])
def get_city_info():
    """Get Islamabad city information for the map"""
    return jsonify({
        "name": "Islamabad",
        "country": "Pakistan",
        "center": get_islamabad_center(),
        "bounds": get_islamabad_bounds(),
        "sectors": ISLAMABAD_SECTORS,
        "depots": TRUCK_DEPOTS,
        "zoom": 12
    })


@app.route('/api/optimize', methods=['POST'])
def run_optimization():
    """Run the route optimization with given parameters - Supports Serial, Parallel, or Both"""
    global latest_results, progress_state
    
    try:
        # Get parameters from request
        data = request.get_json() or {}
        
        # Debug: Print received data
        print("\n" + "=" * 50)
        print("RECEIVED CONFIGURATION FROM FRONTEND:")
        print("=" * 50)
        for key, value in data.items():
            print(f"  {key}: {value} (type: {type(value).__name__})")
        print("=" * 50 + "\n")
        
        config = {
            'bins_n': int(data.get('bins', 100)),
            'trucks_k': int(data.get('trucks', 4)),
            'threshold': float(data.get('threshold', 60.0)),
            'alpha': float(data.get('alpha', 1.0)),
            'beta': float(data.get('beta', 25.0)),
            'candidates': int(data.get('candidates', 5)),
            'max_2opt': int(data.get('max_2opt', 50)),
            'workers': int(data.get('workers', max(2, os.cpu_count() or 2))),
            'mode': data.get('mode', 'both'),  # 'serial', 'parallel', or 'both'
        }
        
        # Auto-calculate seed based on user inputs for reproducible but varied results
        # Seed is derived from bins, trucks, threshold, candidates to create unique scenarios
        config['seed'] = (
            config['bins_n'] * 7 + 
            config['trucks_k'] * 13 + 
            int(config['threshold']) * 3 + 
            config['candidates'] * 11
        ) % 99999 + 1
        
        # Debug: Print parsed config
        print("PARSED CONFIGURATION:")
        for key, value in config.items():
            print(f"  {key}: {value}")
        print("=" * 50 + "\n")
        
        mode = config['mode']
        
        # Reset results
        latest_results = {
            "serial": None,
            "parallel": None,
            "speedup": None,
            "completed": False,
            "routes": {},
            "bins": [],
            "trucks": [],
            "mode": mode,
        }
        
        update_progress("start", 0, mode)
        
        # Generate Islamabad data
        t0 = time.perf_counter()
        bins = generate_islamabad_bins(config['bins_n'], config['seed'])
        trucks = generate_islamabad_trucks(config['trucks_k'], config['seed'])
        t_gen = time.perf_counter() - t0
        update_progress("generated", 10, mode)
        
        # Store bins and trucks data for frontend
        latest_results["bins"] = [
            {"id": b.id, "lat": b.y, "lng": b.x, "fill": b.fill}
            for b in bins
        ]
        latest_results["trucks"] = [
            {"id": t.id, "lat": t.y, "lng": t.x, "name": f"Truck {t.id}"}
            for t in trucks
        ]
        
        # Filter bins by threshold
        t1 = time.perf_counter()
        selected = filter_bins(bins, config['threshold'])
        t_filter = time.perf_counter() - t1
        update_progress("filtered", 15, mode)
        
        # Run Serial if requested
        if mode in ('serial', 'both'):
            update_progress("computing", 20, "serial")
            
            serial_t0 = time.perf_counter()
            serial_result = run_single_optimization(
                bins, trucks, selected, config, "serial", 1
            )
            serial_t_total = time.perf_counter() - serial_t0 + t_gen + t_filter
            
            latest_results["serial"] = {
                "bins_total": config['bins_n'],
                "bins_selected": len(selected),
                "trucks": config['trucks_k'],
                "distance_total": serial_result["distance_total"],
                "t_generate": t_gen,
                "t_filter": t_filter,
                "t_metrics": serial_result["t_metrics"],
                "t_assign": serial_result["t_assign"],
                "t_routes": serial_result["t_routes"],
                "t_total": serial_t_total,
            }
            
            # If only serial mode, use serial routes
            if mode == 'serial':
                latest_results["routes"] = serial_result["route_data"]
            
            update_progress("serial_done", 50 if mode == 'both' else 90, "serial")
        
        # Run Parallel if requested
        if mode in ('parallel', 'both'):
            update_progress("computing", 55 if mode == 'both' else 20, "parallel")
            
            parallel_t0 = time.perf_counter()
            parallel_result = run_single_optimization(
                bins, trucks, selected, config, "parallel", config['workers']
            )
            parallel_t_total = time.perf_counter() - parallel_t0 + t_gen + t_filter
            
            latest_results["parallel"] = {
                "bins_total": config['bins_n'],
                "bins_selected": len(selected),
                "trucks": config['trucks_k'],
                "distance_total": parallel_result["distance_total"],
                "t_generate": t_gen,
                "t_filter": t_filter,
                "t_metrics": parallel_result["t_metrics"],
                "t_assign": parallel_result["t_assign"],
                "t_routes": parallel_result["t_routes"],
                "t_total": parallel_t_total,
                "workers": config['workers'],
            }
            
            # Use parallel routes for display (they're the same quality but faster)
            latest_results["routes"] = parallel_result["route_data"]
            
            update_progress("parallel_done", 90, "parallel")
        
        # Calculate speedup if both modes were run
        if mode == 'both' and latest_results["serial"] and latest_results["parallel"]:
            s = float(latest_results["serial"]["t_total"])
            p = float(latest_results["parallel"]["t_total"])
            latest_results["speedup"] = s / p if p > 0 else float("inf")
        
        latest_results["completed"] = True
        update_progress("completed", 100, None)
        
        return jsonify({
            "success": True,
            "results": latest_results,
            "message": f"Optimization completed successfully ({mode} mode) for Islamabad, Pakistan"
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e),
            "message": f"Optimization failed: {str(e)}"
        }), 500


@app.route('/api/progress', methods=['GET'])
def get_progress():
    """Get current optimization progress"""
    return jsonify(progress_state)


@app.route('/api/results', methods=['GET'])
def get_results():
    """Get latest optimization results"""
    return jsonify(latest_results)


@app.route('/api/routes', methods=['GET'])
def get_routes():
    """Get computed routes for all trucks"""
    if not latest_results.get("completed"):
        return jsonify({"routes": {}, "message": "No routes computed yet"})
    
    return jsonify({
        "routes": latest_results.get("routes", {}),
        "bins": latest_results.get("bins", []),
        "trucks": latest_results.get("trucks", []),
    })


@app.route('/api/routes/<int:truck_id>', methods=['GET'])
def get_truck_route(truck_id):
    """Get route for a specific truck"""
    routes = latest_results.get("routes", {})
    route = routes.get(str(truck_id))
    
    if route is None:
        return jsonify({"error": f"Route for truck {truck_id} not found"}), 404
    
    return jsonify(route)


# Serve React frontend - catch-all route (must be LAST)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve the React frontend build. Falls back to index.html for SPA routing."""
    if path and (FRONTEND_BUILD / path).is_file():
        return send_from_directory(str(FRONTEND_BUILD), path)
    index = FRONTEND_BUILD / 'index.html'
    if index.is_file():
        return send_from_directory(str(FRONTEND_BUILD), 'index.html')
    return jsonify({"message": "API is running. Frontend not built yet."}), 200


if __name__ == '__main__':
    print("=" * 60)
    print("PDC Garbage Routes API Server - Islamabad, Pakistan")
    print("=" * 60)
    print(f"CPU Cores Available: {os.cpu_count()}")
    print(f"City: Islamabad, Pakistan")
    print(f"Center: {get_islamabad_center()}")
    print("Modes Supported: serial, parallel, both (comparison)")
    print("API running at: http://localhost:5000")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
