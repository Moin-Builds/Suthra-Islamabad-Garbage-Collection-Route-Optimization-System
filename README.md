# PDC Garbage Collection Route Optimization

Parallel Computing (PDC) semester project that optimizes garbage collection routes and compares **serial vs parallel** execution. Includes a Python backend (CLI + Flask API) and a React dashboard for configuration, live progress, and route visualization.

![Status](https://img.shields.io/badge/status-active-success.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/flask-api-black.svg)
![React](https://img.shields.io/badge/react-18+-61DAFB.svg)
![Vite](https://img.shields.io/badge/vite-5+-646CFF.svg)

## Highlights

- Serial vs parallel benchmarking with timing breakdown
- Parallelized stages (priority scoring, distance/assignment, candidate route evaluation)
- Interactive route visualization + side-by-side comparison report
- Configurable workload (bins, trucks, threshold, candidates, workers)

## Project Structure

```
pdc_garbage_routes_project/
├── pdc_garbage_routes/                 # Python backend
│   ├── main.py                         # CLI entry point
│   ├── api_server.py                   # Flask API for the React frontend
│   ├── requirements.txt                # Python dependencies
│   ├── scripts/
│   │   └── run_demo_windows.bat
│   ├── src/                            # Core modules
│   │   ├── benchmark.py
│   │   ├── data_generator.py
│   │   ├── parallel_module.py
│   │   ├── routing.py
│   │   ├── visualizer.py
│   │   └── models.py
│   └── output/                         # Generated outputs (maps + reports)
└── frontend/                            # React (Vite) dashboard
    ├── src/
    └── package.json
```

## Requirements

- Python 3.8+
- Node.js 18+

## Quick Start (Recommended: Full Stack)

### 1) Backend setup

```bash
cd pdc_garbage_routes
pip install -r requirements.txt
```

### 2) Frontend setup

```bash
cd frontend
npm install
```

### 3) Run API + UI

Terminal 1 (API):

```bash
cd pdc_garbage_routes
python api_server.py
```

Terminal 2 (UI):

```bash
cd frontend
npm run dev
```

Open:
- UI: http://localhost:5173
- API: http://localhost:5000

## CLI Usage (Backend Only)

```bash
cd pdc_garbage_routes
python main.py
```

Custom workload example:

```bash
python main.py --bins 5000 --trucks 6 --workers 8 --mode both
```

## Configuration Options (CLI)

| Parameter | Flag | Default | Description |
|---|---|---:|---|
| Bins | `--bins` | 2000 | Number of garbage bins |
| Trucks | `--trucks` | 4 | Number of collection trucks |
| Threshold | `--threshold` | 70.0 | Collect bins with fill % ≥ threshold |
| Grid | `--grid` | 100.0 | Simulation grid size |
| Alpha | `--alpha` | 1.0 | Weight for fill priority |
| Beta | `--beta` | 25.0 | Weight for proximity scoring |
| Candidates | `--candidates` | 24 | Route candidates to evaluate |
| Workers | `--workers` | Auto | Parallel worker threads |
| Mode | `--mode` | both | `serial`, `parallel`, or `both` |

## API Endpoints

When running `api_server.py`:

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/config/defaults` | GET | Default configuration |
| `/api/system/info` | GET | CPU / system info |
| `/api/optimize` | POST | Run optimization |
| `/api/progress` | GET | Progress updates |
| `/api/results` | GET | Latest results |

## Outputs

After running an optimization (CLI or API), outputs are written under:

```
output/
├── serial/
│   └── route_map.png
├── parallel/
│   └── route_map.png
└── comparison.html
```

Note: You may also see outputs in the repository-level `output/` folder, depending on how you run the project.

## Suggested GitHub Description

"Parallel garbage route optimization (PDC): serial vs parallel benchmarking with Python (Flask/CLI) + React dashboard, route visualization, and performance reports."

---

## 🛠️ Troubleshooting

### API Not Connecting
- Make sure Python API is running on port 5000
- Check for CORS errors in browser console
- Verify Flask and Flask-CORS are installed

### Frontend Not Loading
- Run `npm install` in the frontend directory
- Check if port 5173 is available
- Try `npm run dev -- --port 3000` for different port

### Slow Performance
- Reduce number of bins
- Increase number of workers (up to CPU cores)
- Decrease candidates for faster (but less optimal) routes

---

## 👥 Team

PDC Semester Project - Parallel & Distributed Computing

---

## 📄 License

MIT License
