# Parallel Garbage Collection Route Optimization System (PDC Semester Project)

This project follows the proposal flow:
Generate Garbage Bin Data → Filter Bins → Parallel Processing Module → Route Assignment → Generate Optimized Routes → Visualization & Analysis

Parallelized components:
- Compute bin priorities (fill + proximity)
- Calculate distances (bin→truck) and nearest-truck assignment
- Evaluate possible routes (candidate route evaluation in parallel)

## Run (Windows / Linux / Mac)
Install:
```bash
pip install -r requirements.txt
```

Run both serial+parallel:
```bash
python main.py
```

Bigger demo workload:
```bash
python main.py --bins 20000 --trucks 6 --candidates 40 --mode both
```

Outputs:
- output/serial/route_map.png
- output/parallel/route_map.png
