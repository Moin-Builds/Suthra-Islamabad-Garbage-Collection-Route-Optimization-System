from __future__ import annotations
from dataclasses import dataclass

@dataclass(frozen=True)
class Bin:
    """Garbage bin with (x,y) coordinates and fill level in 0..100."""
    id: int
    x: float
    y: float
    fill: float

@dataclass(frozen=True)
class Truck:
    """Truck depot/start location."""
    id: int
    x: float
    y: float
