#!/usr/bin/env python3
"""
Generate data -> Filter -> Parallel Processing Module (priorities + distances + route evaluation)
-> Route Assignment -> Optimized Routes -> Visualization & Analysis (distance + serial vs parallel time)
"""

from __future__ import annotations
import argparse
import os
import sys
import pathlib

# Ensure the script can import the local `src` package regardless of CWD
HERE = pathlib.Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from src.benchmark import run_once, format_report

def main():
    ap = argparse.ArgumentParser(description="Parallel Garbage Collection Route Optimization (Simulation)")
    ap.add_argument("--bins", type=int, default=2000)
    ap.add_argument("--trucks", type=int, default=4)
    ap.add_argument("--threshold", type=float, default=70.0)
    ap.add_argument("--grid", type=float, default=100.0)
    ap.add_argument("--alpha", type=float, default=1.0)
    ap.add_argument("--beta", type=float, default=25.0)
    ap.add_argument("--candidates", type=int, default=24)
    ap.add_argument("--max-2opt", type=int, default=120)
    ap.add_argument("--workers", type=int, default=max(2, os.cpu_count() or 2))
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", type=str, default="output")
    ap.add_argument("--mode", choices=["serial", "parallel", "both"], default="both")
    ap.add_argument("--gui", action="store_true", help="Launch a simple GUI instead of CLI")
    ap.add_argument("--interactive", action="store_true", help="Prompt for parameters interactively")
    args = ap.parse_args()

    # Immediate feedback so the user knows the program started
    print(f"Starting run with args: {args}", flush=True)

    if args.gui:
        try:
            from src.gui import App
        except Exception as e:
            print("[!] GUI dependencies missing or failed to import:", e)
            return
        App().mainloop()
        return

    if args.interactive:
        # Simple interactive prompt to update a few params
        def ask(name, current):
            val = input(f"{name} [{current}]: ").strip()
            return type_cast_cli(val) if val else current

        args.bins = int(ask("bins", args.bins))
        args.trucks = int(ask("trucks", args.trucks))
        args.workers = int(ask("workers", args.workers))
        print("Launching run with updated parameters...", flush=True)

    serial = None
    parallel = None

    if args.mode in ("serial", "both"):
        serial = run_once(
            bins_n=args.bins,
            trucks_k=args.trucks,
            threshold=args.threshold,
            grid=args.grid,
            alpha=args.alpha,
            beta=args.beta,
            candidates=args.candidates,
            max_2opt=args.max_2opt,
            mode="serial",
            workers=1,
            seed=args.seed,
            out_dir=os.path.join(args.out, "serial"),
            progress_callback=lambda s, p: print(f"[serial] {s} {p:.2f}", flush=True),
        )
        print(format_report("SERIAL RUN", serial))

    if args.mode in ("parallel", "both"):
        parallel = run_once(
            bins_n=args.bins,
            trucks_k=args.trucks,
            threshold=args.threshold,
            grid=args.grid,
            alpha=args.alpha,
            beta=args.beta,
            candidates=args.candidates,
            max_2opt=args.max_2opt,
            mode="parallel",
            workers=args.workers,
            seed=args.seed,
            out_dir=os.path.join(args.out, "parallel"),
            progress_callback=lambda s, p: print(f"[parallel] {s} {p:.2f}", flush=True),
        )
        print(format_report("PARALLEL RUN", parallel))

    if serial and parallel:
        s = float(serial["t_total"])
        p = float(parallel["t_total"])
        speedup = (s / p) if p > 0 else float("inf")
        print("\n" + "-" * 72)
        print(f"Speedup (serial / parallel): {speedup:.2f}x")
        print("-" * 72)
        # Create an HTML comparison report saved in output/comparison.html
        try:
            comp_dir = os.path.join(args.out)
            os.makedirs(comp_dir, exist_ok=True)
            html_path = os.path.join(comp_dir, "comparison.html")
            with open(html_path, "w", encoding="utf-8") as fh:
                fh.write("""
<html><head><meta charset='utf-8'><title>Serial vs Parallel Comparison</title>
<style>body{{font-family:Arial;margin:20px}} .col{{display:inline-block;vertical-align:top;width:48%;margin:1%}} img{{max-width:100%;height:auto;border:1px solid #ccc}}</style>
</head><body>
<h1>Serial vs Parallel Comparison</h1>
<div>
  <div class='col'>
    <h2>Serial</h2>
    <pre>{serial_report}</pre>
    <img src='{serial_img}' alt='serial map'>
  </div>
  <div class='col'>
    <h2>Parallel</h2>
    <pre>{parallel_report}</pre>
    <img src='{parallel_img}' alt='parallel map'>
  </div>
</div>
</body></html>
""".format(
                    serial_report=format_report("SERIAL RUN", serial).replace("&", "&amp;").replace("<", "&lt;"),
                    parallel_report=format_report("PARALLEL RUN", parallel).replace("&", "&amp;").replace("<", "&lt;"),
                    serial_img=os.path.relpath(serial["out_png"], comp_dir).replace("\\", "/"),
                    parallel_img=os.path.relpath(parallel["out_png"], comp_dir).replace("\\", "/"),
                ) )
            print(f"Comparison report saved: {html_path}")
        except Exception as e:
            print("[!] Failed to write comparison HTML:", e)

def type_cast_cli(s: str):
    try:
        if "." in s:
            return float(s)
        return int(s)
    except Exception:
        return s

if __name__ == "__main__":
    main()
