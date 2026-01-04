from __future__ import annotations
from typing import Dict, Sequence, List
import os
from .models import Bin, Truck
import math

try:
    import matplotlib.pyplot as plt  # type: ignore
except Exception:
    plt = None

def plot_routes(
    all_bins: Sequence[Bin],
    selected_bins: Sequence[Bin],
    trucks: Sequence[Truck],
    routes: Dict[int, List[Bin]],
    out_png: str,
    grid: float,
) -> None:
    if plt is None:
        print("[!] matplotlib not installed; skipping map image.")
        return

    os.makedirs(os.path.dirname(out_png), exist_ok=True)

    fig, ax = plt.subplots(figsize=(9, 9))

    # Draw all bins faintly
    ax.scatter([b.x for b in all_bins], [b.y for b in all_bins], s=12, alpha=0.2, color="#444444", label="All bins")

    # Draw selected bins more prominently
    ax.scatter([b.x for b in selected_bins], [b.y for b in selected_bins], s=36, alpha=0.9, color="#2b83ba", edgecolor="#0b3b59", linewidth=0.5, label="Selected bins")

    # Draw trucks (depots) as squares with labels
    for t in trucks:
        ax.scatter([t.x], [t.y], s=220, marker="s", color="#fdae61", edgecolor="#8b4513", linewidth=1.2)
        ax.text(t.x, t.y, f"T{t.id}", ha="center", va="center", fontsize=9, fontweight="bold", color="#2b2b2b")

    # Draw each truck route with colored line and small arrows
    cmap = plt.get_cmap("tab10")
    for idx, (tid, route) in enumerate(routes.items()):
        truck = next((t for t in trucks if t.id == tid), None)
        if truck is None or not route:
            continue
        rx = [truck.x] + [b.x for b in route] + [truck.x]
        ry = [truck.y] + [b.y for b in route] + [truck.y]
        color = cmap(idx % 10)
        ax.plot(rx, ry, linewidth=2.2, color=color, alpha=0.9, label=f"Truck {tid}")

        # draw arrows along the path
        for i in range(len(rx) - 1):
            x0, y0 = rx[i], ry[i]
            x1, y1 = rx[i + 1], ry[i + 1]
            dx, dy = x1 - x0, y1 - y0
            dist = math.hypot(dx, dy)
            if dist <= 0:
                continue
            ax.arrow(x0 + dx * 0.15, y0 + dy * 0.15, dx * 0.2, dy * 0.2, head_width=grid * 0.0075, head_length=grid * 0.0075, fc=color, ec=color, length_includes_head=True, alpha=0.9)

    ax.set_xlim(0, grid)
    ax.set_ylim(0, grid)
    ax.set_title("Parallel Garbage Collection Route Optimization")
    ax.set_xlabel("X")
    ax.set_ylabel("Y")
    ax.legend(loc="upper right", fontsize=8)
    ax.set_aspect('equal', adjustable='box')

    fig.tight_layout()
    # Save at higher DPI for professional-looking images
    plt.savefig(out_png, dpi=220)
    plt.close(fig)
