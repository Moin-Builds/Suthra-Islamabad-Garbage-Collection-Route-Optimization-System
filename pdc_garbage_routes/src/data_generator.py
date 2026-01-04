from __future__ import annotations
import random
from typing import List
from .models import Bin, Truck

def generate_bins(n: int, grid: float, seed: int) -> List[Bin]:
    rng = random.Random(seed)
    return [
        Bin(
            id=i + 1,
            x=rng.uniform(0, grid),
            y=rng.uniform(0, grid),
            fill=rng.uniform(0, 100),
        )
        for i in range(n)
    ]

def generate_trucks(k: int, grid: float, seed: int) -> List[Truck]:
    rng = random.Random(seed + 999)
    return [
        Truck(
            id=i + 1,
            x=rng.uniform(0, grid),
            y=rng.uniform(0, grid),
        )
        for i in range(k)
    ]
