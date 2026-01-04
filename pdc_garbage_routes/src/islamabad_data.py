"""
Islamabad, Pakistan - Real Garbage Bin Location Generator
Generates bins and truck depots within Islamabad's actual coordinates
"""
from __future__ import annotations
import random
from typing import List, Tuple
from .models import Bin, Truck

# Islamabad city boundaries (approximate)
# Latitude: 33.5651° N to 33.7651° N
# Longitude: 72.8800° E to 73.1800° E
ISLAMABAD_BOUNDS = {
    "lat_min": 33.5651,
    "lat_max": 33.7651,
    "lng_min": 72.8800,
    "lng_max": 73.1800,
}

# Major sectors/areas in Islamabad with their approximate centers
ISLAMABAD_SECTORS = [
    {"name": "F-6 Supermarket", "lat": 33.7294, "lng": 73.0931},
    {"name": "F-7 Markaz", "lat": 33.7200, "lng": 73.0579},
    {"name": "F-8 Markaz", "lat": 33.7044, "lng": 73.0353},
    {"name": "F-10 Markaz", "lat": 33.6923, "lng": 73.0144},
    {"name": "G-6 Sector", "lat": 33.7256, "lng": 73.0800},
    {"name": "G-7 Sector", "lat": 33.7156, "lng": 73.0700},
    {"name": "G-8 Markaz", "lat": 33.7000, "lng": 73.0500},
    {"name": "G-9 Markaz", "lat": 33.6900, "lng": 73.0400},
    {"name": "G-10 Markaz", "lat": 33.6756, "lng": 73.0200},
    {"name": "G-11 Markaz", "lat": 33.6656, "lng": 73.0100},
    {"name": "I-8 Markaz", "lat": 33.6700, "lng": 73.0800},
    {"name": "I-9 Industrial", "lat": 33.6600, "lng": 73.0600},
    {"name": "I-10 Markaz", "lat": 33.6450, "lng": 73.0400},
    {"name": "Blue Area", "lat": 33.7100, "lng": 73.0600},
    {"name": "Jinnah Super", "lat": 33.7300, "lng": 73.0800},
]

# Truck depot locations (waste management facilities)
TRUCK_DEPOTS = [
    {"name": "CDA Waste Depot F-9", "lat": 33.6950, "lng": 73.0250},
    {"name": "CDA Waste Depot I-9", "lat": 33.6600, "lng": 73.0550},
    {"name": "CDA Waste Depot G-11", "lat": 33.6650, "lng": 73.0050},
    {"name": "CDA Waste Depot H-8", "lat": 33.6800, "lng": 73.0700},
]


def generate_islamabad_bins(n: int, seed: int) -> List[Bin]:
    """
    Generate garbage bins distributed across Islamabad sectors.
    Uses clustering around major market areas where bins are typically placed.
    """
    rng = random.Random(seed)
    bins: List[Bin] = []
    
    for i in range(n):
        # Pick a random sector center or random location
        if rng.random() < 0.7:  # 70% bins near sector centers
            sector = rng.choice(ISLAMABAD_SECTORS)
            # Add some variance around sector center (about 500m radius)
            lat = sector["lat"] + rng.gauss(0, 0.003)
            lng = sector["lng"] + rng.gauss(0, 0.003)
        else:  # 30% random throughout Islamabad
            lat = rng.uniform(ISLAMABAD_BOUNDS["lat_min"], ISLAMABAD_BOUNDS["lat_max"])
            lng = rng.uniform(ISLAMABAD_BOUNDS["lng_min"], ISLAMABAD_BOUNDS["lng_max"])
        
        # Clamp to bounds
        lat = max(ISLAMABAD_BOUNDS["lat_min"], min(lat, ISLAMABAD_BOUNDS["lat_max"]))
        lng = max(ISLAMABAD_BOUNDS["lng_min"], min(lng, ISLAMABAD_BOUNDS["lng_max"]))
        
        # Fill level - typically follows a distribution
        # More bins at medium-high fill levels (realistic scenario)
        fill = rng.betavariate(3, 2) * 100  # Skewed towards higher fill
        
        bins.append(Bin(id=i + 1, x=lng, y=lat, fill=fill))
    
    return bins


def generate_islamabad_trucks(k: int, seed: int) -> List[Truck]:
    """
    Generate truck depots in Islamabad.
    Uses predefined depot locations or generates near them.
    """
    rng = random.Random(seed + 999)
    trucks: List[Truck] = []
    
    for i in range(k):
        if i < len(TRUCK_DEPOTS):
            depot = TRUCK_DEPOTS[i]
            lat = depot["lat"] + rng.gauss(0, 0.001)
            lng = depot["lng"] + rng.gauss(0, 0.001)
        else:
            # Generate additional depots near existing ones
            depot = rng.choice(TRUCK_DEPOTS)
            lat = depot["lat"] + rng.gauss(0, 0.005)
            lng = depot["lng"] + rng.gauss(0, 0.005)
        
        trucks.append(Truck(id=i + 1, x=lng, y=lat))
    
    return trucks


def get_islamabad_center() -> Tuple[float, float]:
    """Returns the center coordinates of Islamabad for map centering."""
    return (33.6844, 73.0479)


def get_islamabad_bounds() -> dict:
    """Returns the bounding box for Islamabad."""
    return ISLAMABAD_BOUNDS
