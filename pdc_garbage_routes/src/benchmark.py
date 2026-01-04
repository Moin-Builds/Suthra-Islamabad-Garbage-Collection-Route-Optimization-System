from __future__ import annotations
import os
import time
from typing import Dict, List
from .models import Bin, Truck
from .data_generator import generate_bins, generate_trucks
from .parallel_module import compute_metrics, assign_bins_to_trucks, choose_best_route
from .visualizer import plot_routes

def filter_bins(bins: List[Bin], threshold: float) -> List[Bin]:
    return [b for b in bins if b.fill >= threshold]

def run_once(
    bins_n: int,
    trucks_k: int,
    threshold: float,
    grid: float,
    alpha: float,
    beta: float,
    candidates: int,
    max_2opt: int,
    mode: str,
    workers: int,
    seed: int,
    out_dir: str,
    progress_callback=None,
) -> Dict[str, float | str]:
    os.makedirs(out_dir, exist_ok=True)
    out_png = os.path.join(out_dir, "route_map.png")

    if progress_callback:
        progress_callback("start", 0.0)

    t0 = time.perf_counter()
    bins = generate_bins(bins_n, grid, seed)
    trucks = generate_trucks(trucks_k, grid, seed)
    t_gen = time.perf_counter() - t0
    if progress_callback:
        progress_callback("generated", 0.1)

    t1 = time.perf_counter()
    selected = filter_bins(bins, threshold)
    t_filter = time.perf_counter() - t1
    if progress_callback:
        progress_callback("filtered", 0.2)

    parallel = (mode.lower() == "parallel")

    t2 = time.perf_counter()
    metrics = compute_metrics(
        selected_bins=selected,
        trucks=trucks,
        alpha=alpha,
        beta=beta,
        parallel=parallel,
        workers=workers,
    )
    t_metrics = time.perf_counter() - t2
    if progress_callback:
        progress_callback("metrics", 0.5)

    t3 = time.perf_counter()
    buckets = assign_bins_to_trucks(selected, metrics)
    t_assign = time.perf_counter() - t3
    if progress_callback:
        progress_callback("assigned", 0.6)

    t4 = time.perf_counter()
    routes = {}
    route_dists = {}
    for truck in trucks:
        bins_with_pr = buckets.get(truck.id, [])
        r, d = choose_best_route(
            truck=truck,
            bins_with_pr=bins_with_pr,
            candidates=candidates,
            parallel=parallel,
            workers=workers,
            max_2opt=max_2opt,
        )
        routes[truck.id] = r
        route_dists[truck.id] = d
    t_routes = time.perf_counter() - t4
    if progress_callback:
        progress_callback("routed", 0.8)

    t5 = time.perf_counter()
    plot_routes(bins, selected, trucks, routes, out_png, grid)
    t_plot = time.perf_counter() - t5
    if progress_callback:
        progress_callback("plotted", 1.0)

    total_dist = float(sum(route_dists.values()))
    t_total = float(t_gen + t_filter + t_metrics + t_assign + t_routes + t_plot)

    return {
        "bins_total": float(bins_n),
        "bins_selected": float(len(selected)),
        "trucks": float(trucks_k),
        "distance_total": total_dist,
        "t_generate": float(t_gen),
        "t_filter": float(t_filter),
        "t_metrics": float(t_metrics),
        "t_assign": float(t_assign),
        "t_routes": float(t_routes),
        "t_plot": float(t_plot),
        "t_total": t_total,
        "out_png": out_png,
        "mode": mode,
    }

def format_report(title: str, m: Dict[str, float | str]) -> str:
    return "\n".join([
        "=" * 72,
        title,
        "=" * 72,
        f"Bins: {int(m['bins_total'])} | Selected (>=threshold): {int(m['bins_selected'])} | Trucks: {int(m['trucks'])}",
        f"Total distance (all trucks): {float(m['distance_total']):.2f}",
        "-" * 72,
        "Timing (seconds):",
        f"  t_generate : {float(m['t_generate']):.4f}",
        f"  t_filter   : {float(m['t_filter']):.4f}",
        f"  t_metrics  : {float(m['t_metrics']):.4f}",
        f"  t_assign   : {float(m['t_assign']):.4f}",
        f"  t_routes   : {float(m['t_routes']):.4f}",
        f"  t_plot     : {float(m['t_plot']):.4f}",
        f"  t_total    : {float(m['t_total']):.4f}",
        f"Route map saved: {m['out_png']}",
    ])
