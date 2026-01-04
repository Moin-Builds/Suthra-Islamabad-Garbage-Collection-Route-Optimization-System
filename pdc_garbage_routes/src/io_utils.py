from __future__ import annotations
import csv
from pathlib import Path
from typing import Iterable, List
from .models import Bin, Truck

def write_bins_csv(path: str | Path, bins: Iterable[Bin]) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "x", "y", "fill"])
        for b in bins:
            w.writerow([b.id, f"{b.x:.6f}", f"{b.y:.6f}", f"{b.fill:.2f}"])

def write_trucks_csv(path: str | Path, trucks: Iterable[Truck]) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "x", "y"])
        for t in trucks:
            w.writerow([t.id, f"{t.x:.6f}", f"{t.y:.6f}"])

def read_bins_csv(path: str | Path) -> List[Bin]:
    path = Path(path)
    bins: List[Bin] = []
    with path.open("r", newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            bins.append(Bin(
                id=int(row["id"]),
                x=float(row["x"]),
                y=float(row["y"]),
                fill=float(row["fill"]),
            ))
    return bins

def read_trucks_csv(path: str | Path) -> List[Truck]:
    path = Path(path)
    trucks: List[Truck] = []
    with path.open("r", newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            trucks.append(Truck(
                id=int(row["id"]),
                x=float(row["x"]),
                y=float(row["y"]),
            ))
    return trucks
