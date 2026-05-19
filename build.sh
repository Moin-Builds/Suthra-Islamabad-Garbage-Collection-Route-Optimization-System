#!/usr/bin/env bash
# Render Build Script - builds both frontend and backend

set -o errexit  # Exit on error

echo "=========================================="
echo "Suthra Islamabad - Render Build"
echo "=========================================="

# 1. Install Python dependencies
echo ">> Installing Python dependencies..."
pip install --upgrade pip
pip install -r pdc_garbage_routes/requirements.txt

# 2. Install Node.js dependencies and build React frontend
echo ">> Installing frontend dependencies..."
cd frontend
npm install

echo ">> Building React frontend..."
npm run build

cd ..

echo "=========================================="
echo "Build complete!"
echo "Frontend build: frontend/dist/"
echo "=========================================="
