from __future__ import annotations
import random
from typing import Dict, List, Sequence, Tuple
from concurrent.futures import ProcessPoolExecutor
from .models import Bin, Truck
from .math_utils import dist
from .routing import greedy_priority_route, two_opt_improve, route_length

def _bin_metrics_task(args: Tuple[Bin, Tuple[Truck, ...], float, float]) -> Tuple[int, int, float, float]:
    b, trucks, alpha, beta = args
    best_tid = trucks[0].id
    best_d = float("inf")
    for t in trucks:
        d = dist(b.x, b.y, t.x, t.y)
        if d < best_d:
            best_d = d
            best_tid = t.id
    priority = alpha * (b.fill / 100.0) + beta * (1.0 / (best_d + 1.0))
    return (b.id, best_tid, best_d, priority)

def compute_metrics(
    selected_bins: Sequence[Bin],
    trucks: Sequence[Truck],
    alpha: float,
    beta: float,
    parallel: bool,
    workers: int,
) -> Dict[int, Tuple[int, float, float]]:
    tasks = [(b, tuple(trucks), alpha, beta) for b in selected_bins]
    metrics: Dict[int, Tuple[int, float, float]] = {}
    if parallel and workers != 1 and len(tasks) > 0:
        with ProcessPoolExecutor(max_workers=workers) as ex:
            for bid, tid, nd, pr in ex.map(_bin_metrics_task, tasks, chunksize=50):
                metrics[bid] = (tid, nd, pr)
    else:
        for t in tasks:
            bid, tid, nd, pr = _bin_metrics_task(t)
            metrics[bid] = (tid, nd, pr)
    return metrics

def assign_bins_to_trucks(
    selected_bins: Sequence[Bin],
    metrics: Dict[int, Tuple[int, float, float]],
) -> Dict[int, List[Tuple[Bin, float]]]:
    buckets: Dict[int, List[Tuple[Bin, float]]] = {}
    for b in selected_bins:
        tid, _d, pr = metrics[b.id]
        buckets.setdefault(tid, []).append((b, pr))
    for tid in list(buckets.keys()):
        buckets[tid].sort(key=lambda bp: (-bp[1], bp[0].id))
    return buckets

def _candidate_route_task(args: Tuple[Truck, Tuple[Tuple[Bin, float], ...], int, int]) -> Tuple[float, Tuple[int, ...]]:
    truck, bins_with_pr, seed, max_2opt = args
    rng = random.Random(seed)
    bins = [b for (b, _pr) in bins_with_pr]
    for _ in range(max(1, len(bins) // 5)):
        i, j = rng.randrange(len(bins)), rng.randrange(len(bins))
        bins[i], bins[j] = bins[j], bins[i]
    improved = two_opt_improve(truck, bins, max_iter=max_2opt)
    length = route_length(truck, improved)
    return (length, tuple(b.id for b in improved))

def choose_best_route(
    truck: Truck,
    bins_with_pr: Sequence[Tuple[Bin, float]],
    candidates: int,
    parallel: bool,
    workers: int,
    max_2opt: int,
) -> Tuple[List[Bin], float]:
    if not bins_with_pr:
        return [], 0.0

    greedy = greedy_priority_route(truck, bins_with_pr)
    greedy = two_opt_improve(truck, greedy, max_iter=max_2opt)
    best_route = greedy
    best_len = route_length(truck, best_route)

    if candidates <= 1:
        return best_route, best_len

    tasks: List[Tuple[Truck, Tuple[Tuple[Bin, float], ...], int, int]] = []
    bins_t = tuple(bins_with_pr)
    base_seed = 10_000 + truck.id * 1000
    for c in range(candidates - 1):
        tasks.append((truck, bins_t, base_seed + c, max_2opt))

    id_to_bin = {b.id: b for (b, _pr) in bins_with_pr}

    if parallel and workers != 1 and len(tasks) > 0:
        with ProcessPoolExecutor(max_workers=workers) as ex:
            for length, route_ids in ex.map(_candidate_route_task, tasks, chunksize=1):
                if length < best_len:
                    best_len = length
                    best_route = [id_to_bin[i] for i in route_ids]
    else:
        for t in tasks:
            length, route_ids = _candidate_route_task(t)
            if length < best_len:
                best_len = length
                best_route = [id_to_bin[i] for i in route_ids]

    return best_route, best_len
