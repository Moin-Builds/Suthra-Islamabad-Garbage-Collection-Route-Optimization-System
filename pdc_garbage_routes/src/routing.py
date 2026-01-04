from __future__ import annotations
from typing import List, Sequence, Tuple
from .models import Bin, Truck
from .math_utils import dist

def route_length(truck: Truck, route: Sequence[Bin], return_to_depot: bool = True) -> float:
    if not route:
        return 0.0
    d = dist(truck.x, truck.y, route[0].x, route[0].y)
    for a, b in zip(route, route[1:]):
        d += dist(a.x, a.y, b.x, b.y)
    if return_to_depot:
        d += dist(route[-1].x, route[-1].y, truck.x, truck.y)
    return d

def greedy_priority_route(truck: Truck, bins_with_pr: Sequence[Tuple[Bin, float]]) -> List[Bin]:
    remaining = [(b, pr) for (b, pr) in bins_with_pr]
    route: List[Bin] = []
    cx, cy = truck.x, truck.y
    while remaining:
        best_idx = 0
        best_score = -1e18
        for i, (b, pr) in enumerate(remaining):
            d = dist(cx, cy, b.x, b.y)
            score = pr / (d + 1.0)
            if score > best_score:
                best_score = score
                best_idx = i
        b, _pr = remaining.pop(best_idx)
        route.append(b)
        cx, cy = b.x, b.y
    return route

def two_opt_improve(truck: Truck, route: List[Bin], max_iter: int = 200) -> List[Bin]:
    if len(route) < 4:
        return route
    best = route[:]
    best_len = route_length(truck, best)
    improved = True
    it = 0
    while improved and it < max_iter:
        improved = False
        it += 1
        n = len(best)
        for i in range(1, n - 2):
            for k in range(i + 1, n - 1):
                new = best[:i] + best[i:k + 1][::-1] + best[k + 1:]
                new_len = route_length(truck, new)
                if new_len + 1e-9 < best_len:
                    best = new
                    best_len = new_len
                    improved = True
    return best
