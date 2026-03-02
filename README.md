# PDC Garbage Collection Route Optimization System

A **Parallel Computing** project that optimizes garbage collection routes using both serial and parallel processing techniques. Features a stunning React frontend with real-time visualization and performance comparison.

![Status](https://img.shields.io/badge/status-active-success.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-18+-61DAFB.svg)

## 🌟 Features

- **Parallel Route Optimization**: Compare serial vs parallel execution times
- **Real-time Visualization**: Interactive map showing bins, trucks, and routes
- **Performance Metrics**: Detailed timing breakdown for each optimization phase
- **Modern React UI**: Dark-themed, responsive interface with smooth animations
- **Configurable Parameters**: Adjust bins, trucks, workers, and more from the UI

## 📁 Project Structure

```
pdc_garbage_routes_project_PRO/
├── pdc_garbage_routes/          # Python Backend
│   ├── main.py                  # CLI entry point
│   ├── api_server.py            # Flask API server (for frontend)
│   ├── requirements.txt         # Python dependencies
│   ├── src/                     # Core modules
│   │   ├── benchmark.py         # Optimization runner
│   │   ├── data_generator.py    # Generate bin/truck data
│   │   ├── parallel_module.py   # Parallel processing logic
│   │   ├── routing.py           # Route optimization algorithms
│   │   ├── visualizer.py        # Map visualization
│   │   └── models.py            # Data models (Bin, Truck)
│   └── output/                  # Generated route maps
│
└── frontend/                    # React Frontend
    ├── src/
    │   ├── App.jsx              # Main application
    │   ├── components/          # UI components
    │   │   ├── Dashboard.jsx    # Main dashboard
    │   │   ├── MapView.jsx      # Route visualization
    │   │   ├── Configuration.jsx # Settings panel
    │   │   └── Results.jsx      # Performance results
    │   └── index.css            # Design system
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Installation

#### 1. Install Python Dependencies
```bash
cd pdc_garbage_routes
pip install -r requirements.txt
```

#### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

---

## ▶️ Running the Project

### Option 1: Full Stack (Frontend + Backend API) - RECOMMENDED

**Step 1: Start the Python API Server** (Terminal 1)
```bash
cd pdc_garbage_routes
python api_server.py
```
The API will start at: `http://localhost:5000`

**Step 2: Start the React Frontend** (Terminal 2)
```bash
cd frontend
npm run dev
```
The frontend will start at: `http://localhost:5173`

**Step 3: Open in Browser**
Navigate to `http://localhost:5173` and click **"Run Optimization"**!

---

### Option 2: CLI Only (No Frontend)

Run optimization directly from command line:

```bash
cd pdc_garbage_routes
python main.py
```

**With Custom Parameters:**
```bash
python main.py --bins 5000 --trucks 6 --workers 8 --mode both
```

---

## ⚙️ Configuration Options

| Parameter | CLI Flag | Default | Description |
|-----------|----------|---------|-------------|
| Bins | `--bins` | 2000 | Number of garbage bins to simulate |
| Trucks | `--trucks` | 4 | Number of collection trucks |
| Threshold | `--threshold` | 70.0 | Fill % above which bins are collected |
| Grid | `--grid` | 100.0 | Size of the simulation grid |
| Alpha | `--alpha` | 1.0 | Weight for fill priority |
| Beta | `--beta` | 25.0 | Weight for proximity scoring |
| Candidates | `--candidates` | 24 | Number of route candidates to evaluate |
| Workers | `--workers` | Auto | Parallel worker threads |
| Mode | `--mode` | both | `serial`, `parallel`, or `both` |

---

## 🎮 Frontend Usage

### Dashboard
- View key metrics: Total Bins, Active Trucks, Distance, Speedup
- Click **"Run Optimization"** to start the process
- Real-time progress shown in loading overlay

### Configuration Page
- Adjust all parameters using sliders and inputs
- Changes apply immediately to the next run

### Results Page
- View detailed timing breakdown
- Compare serial vs parallel performance
- Visual speedup indicator

### Map View
- Interactive visualization of bins and trucks
- Color-coded by truck assignment
- Zoom and pan controls

---

## 📊 Example Commands

### Quick Demo (Default Settings)
```bash
python main.py
```

### Large Scale Test
```bash
python main.py --bins 20000 --trucks 6 --candidates 40 --mode both
```

### Parallel Only (Fast)
```bash
python main.py --bins 5000 --trucks 4 --mode parallel --workers 8
```

### Serial Only (Baseline)
```bash
python main.py --bins 5000 --trucks 4 --mode serial
```

---

## 🔌 API Endpoints

When running `api_server.py`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check API status |
| `/api/config/defaults` | GET | Get default configuration |
| `/api/system/info` | GET | Get CPU info |
| `/api/optimize` | POST | Run optimization with parameters |
| `/api/progress` | GET | Get current progress |
| `/api/results` | GET | Get latest results |

---

## 📈 Output Files

After running optimization:

```
output/
├── serial/
│   └── route_map.png    # Serial execution route map
├── parallel/
│   └── route_map.png    # Parallel execution route map
└── comparison.html      # Side-by-side comparison report
```

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
