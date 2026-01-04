# PDC Garbage Routes Dashboard (React + Vite)

This is the React dashboard for the **PDC Garbage Collection Route Optimization** project.

It connects to the Python Flask API (`pdc_garbage_routes/api_server.py`) to run the optimization, show progress, and visualize routes.

## Requirements

- Node.js 18+

## Install

```bash
npm install
```

## Run (Development)

1) Start the backend API (from repo root):

```bash
cd pdc_garbage_routes
python api_server.py
```

2) Start the frontend dev server (in this folder):

```bash
npm run dev
```

Open: http://localhost:5173

## Build

```bash
npm run build
```

## Troubleshooting

- If the UI shows API errors, confirm the backend is running on http://localhost:5000.
