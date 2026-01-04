from __future__ import annotations
import threading
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from pathlib import Path
from .benchmark import run_once, format_report
try:
    from PIL import Image, ImageTk
except Exception:
    Image = None
    ImageTk = None
import webbrowser

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("PDC Garbage Routes — GUI")
        self.geometry("980x680")
        # keep last-run state
        self.last_serial_path = None
        self.last_parallel_path = None
        self.last_serial_results = None
        self.last_parallel_results = None
        self.create_widgets()
        # Try to auto-load outputs that may already exist
        try:
            self.after(100, self.auto_load_outputs)
        except Exception:
            pass

    def create_widgets(self):
        frm = ttk.Frame(self, padding=10)
        frm.pack(fill=tk.BOTH, expand=True)

        # Parameter inputs
        left = ttk.Frame(frm)
        left.grid(row=0, column=0, sticky="nw", padx=(0, 10))

        self.entries = {}
        params = [
            ("bins", "2000"),
            ("trucks", "4"),
            ("threshold", "70.0"),
            ("grid", "100.0"),
            ("alpha", "1.0"),
            ("beta", "25.0"),
            ("candidates", "24"),
            ("max_2opt", "120"),
            ("workers", "1"),
            ("seed", "42"),
        ]
        for i, (k, v) in enumerate(params):
            ttk.Label(left, text=k).grid(row=i, column=0, sticky="w")
            e = ttk.Entry(left, width=12)
            e.insert(0, v)
            e.grid(row=i, column=1, sticky="w")
            self.entries[k] = e

        ttk.Button(left, text="Run (both)", command=self.run_both).grid(row=len(params), column=0, pady=8)
        ttk.Button(left, text="Run (serial)", command=self.run_serial).grid(row=len(params), column=1, pady=8)
        ttk.Button(left, text="Run (parallel)", command=self.run_parallel).grid(row=len(params), column=2, pady=8)

        # Presets
        presets = ttk.Combobox(left, values=["Quick (30)", "Demo (200)", "Default (2000)"], state="readonly", width=15)
        presets.set("Default (2000)")
        presets.grid(row=len(params)+1, column=0, columnspan=2, pady=6)
        presets.bind("<<ComboboxSelected>>", lambda e: self.apply_preset(presets.get()))

        ttk.Button(left, text="Load serial image", command=self.load_serial_image).grid(row=len(params)+2, column=0, pady=2)
        ttk.Button(left, text="Load parallel image", command=self.load_parallel_image).grid(row=len(params)+2, column=1, pady=2)
        ttk.Button(left, text="Open comparison report", command=self.open_comparison).grid(row=len(params)+3, column=0, columnspan=2, pady=4)

        # Progress and outputs
        right = ttk.Frame(frm)
        right.grid(row=0, column=1, sticky="nsew")
        frm.columnconfigure(1, weight=1)

        self.progress_label = ttk.Label(right, text="Idle")
        self.progress_label.pack(anchor="w")

        self.recommend_label = ttk.Label(right, text="Recommendation: -", font=(None, 11, "bold"))
        self.recommend_label.pack(anchor="w", pady=(4, 2))

        self.report_text = tk.Text(right, height=12, wrap=tk.NONE)
        self.report_text.pack(fill=tk.X, pady=(6, 6))

        imgs = ttk.Frame(right)
        imgs.pack(fill=tk.BOTH, expand=True)
        self.img_serial = ttk.Label(imgs, text="Serial image not generated", anchor="center")
        self.img_serial.grid(row=0, column=0, sticky="nsew", padx=5)
        self.img_parallel = ttk.Label(imgs, text="Parallel image not generated", anchor="center")
        self.img_parallel.grid(row=0, column=1, sticky="nsew", padx=5)
        imgs.columnconfigure(0, weight=1)
        imgs.columnconfigure(1, weight=1)

    def _update_progress(self, stage: str, pct: float):
        self.progress_label.config(text=f"Stage: {stage} ({pct*100:.0f}%)")
        self.update_idletasks()

    def _run(self, mode: str):
        try:
            kwargs = {k: type_cast(v.get()) for k, v in self.entries.items()}
        except Exception as e:
            messagebox.showerror("Invalid input", str(e))
            return

        out_dir = Path("output") / mode
        out_dir.mkdir(parents=True, exist_ok=True)

        def cb(stage, pct):
            self.after(0, lambda: self._update_progress(stage, pct))

        results = run_once(
            bins_n=kwargs["bins"],
            trucks_k=kwargs["trucks"],
            threshold=kwargs["threshold"],
            grid=kwargs["grid"],
            alpha=kwargs["alpha"],
            beta=kwargs["beta"],
            candidates=kwargs["candidates"],
            max_2opt=kwargs["max_2opt"],
            mode=mode,
            workers=kwargs["workers"],
            seed=kwargs["seed"],
            out_dir=str(out_dir),
            progress_callback=cb,
        )

        # Display report and image
        self.report_text.delete("1.0", tk.END)
        self.report_text.insert(tk.END, format_report(mode.upper() + " RUN", results))

        img_path = Path(results["out_png"]) if isinstance(results.get("out_png"), str) else None
        if img_path and img_path.exists():
            # Use Pillow if available to load and scale image for preview
            try:
                if Image is not None and ImageTk is not None:
                    im = Image.open(str(img_path))
                    # scale to fit half the right pane (approx)
                    w, h = im.size
                    max_w = int(self.winfo_width() * 0.45) or 380
                    max_h = int(self.winfo_height() * 0.45) or 260
                    scale = min(max_w / w, max_h / h, 1.0)
                    new_size = (int(w * scale), int(h * scale))
                    im = im.resize(new_size, Image.LANCZOS)
                    photo = ImageTk.PhotoImage(im)
                else:
                    photo = tk.PhotoImage(file=str(img_path))

                if mode == "serial":
                    self.img_serial.config(image=photo, text="")
                    self.img_serial.image = photo
                else:
                    self.img_parallel.config(image=photo, text="")
                    self.img_parallel.image = photo
            except Exception:
                # fallback: show path
                if mode == "serial":
                    self.img_serial.config(text=str(img_path))
                else:
                    self.img_parallel.config(text=str(img_path))

            # Keep path and results for user convenience
            if mode == "serial":
                self.last_serial_path = img_path
                self.last_serial_results = results
            else:
                self.last_parallel_path = img_path
                self.last_parallel_results = results

        # refresh recommendation/comparison if possible
        try:
            self.update_recommendation()
        except Exception:
            pass


    def load_image_to_widget(self, path: Path, widget: ttk.Label):
        if not path or not path.exists():
            messagebox.showwarning("Not found", f"Image not found: {path}")
            return
        try:
            if Image is not None and ImageTk is not None:
                im = Image.open(str(path))
                w, h = im.size
                max_w = int(self.winfo_width() * 0.45) or 380
                max_h = int(self.winfo_height() * 0.45) or 260
                scale = min(max_w / w, max_h / h, 1.0)
                im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
                photo = ImageTk.PhotoImage(im)
            else:
                photo = tk.PhotoImage(file=str(path))
            widget.config(image=photo, text="")
            widget.image = photo
        except Exception as e:
            widget.config(text=str(path))

    def load_serial_image(self):
        p = filedialog.askopenfilename(title="Select serial image", filetypes=[("PNG","*.png"), ("All","*.*")])
        if p:
            self.last_serial_path = Path(p)
            self.load_image_to_widget(self.last_serial_path, self.img_serial)

    def load_parallel_image(self):
        p = filedialog.askopenfilename(title="Select parallel image", filetypes=[("PNG","*.png"), ("All","*.*")])
        if p:
            self.last_parallel_path = Path(p)
            self.load_image_to_widget(self.last_parallel_path, self.img_parallel)

    def auto_load_outputs(self):
        # Look for previously saved images and load them automatically
        s = Path("output") / "serial" / "route_map.png"
        p = Path("output") / "parallel" / "route_map.png"
        if s.exists():
            self.last_serial_path = s
            self.load_image_to_widget(s, self.img_serial)
        if p.exists():
            self.last_parallel_path = p
            self.load_image_to_widget(p, self.img_parallel)
        # If comparison report exists, user can open it with button
        # Try to update recommendation only if we have in-memory results
        try:
            self.update_recommendation()
        except Exception:
            pass

    def update_recommendation(self):
        sres = self.last_serial_results
        pres = self.last_parallel_results
        if not sres or not pres:
            if self.last_serial_path and self.last_parallel_path:
                self.recommend_label.config(text="Recommendation: Both runs available — run to compute metrics", background="SystemButtonFace")
            else:
                self.recommend_label.config(text="Recommendation: Run both to compare", background="SystemButtonFace")
            return

        s_time = float(sres.get("t_total", 0.0))
        p_time = float(pres.get("t_total", 0.0))
        s_dist = float(sres.get("distance_total", 0.0))
        p_dist = float(pres.get("distance_total", 0.0))

        recommended = None
        reason = ""
        if s_time <= 0 or p_time <= 0:
            recommended = "parallel" if p_time < s_time else "serial"
        else:
            rel = (s_time - p_time) / max(s_time, 1e-9)
            if rel > 0.05:
                recommended = "parallel"
                reason = f"Parallel faster: {s_time:.2f}s → {p_time:.2f}s"
            elif rel < -0.05:
                recommended = "serial"
                reason = f"Serial faster: {s_time:.2f}s → {p_time:.2f}s"
            else:
                if p_dist < s_dist:
                    recommended = "parallel"
                    reason = f"Similar time; parallel shorter distance ({p_dist:.2f} < {s_dist:.2f})"
                else:
                    recommended = "serial"
                    reason = f"Similar time; serial shorter distance ({s_dist:.2f} < {p_dist:.2f})"

        rec_text = f"Recommendation: {recommended.upper()} — {reason}" if reason else f"Recommendation: {recommended.upper()}"
        bg = "#d4f8d4" if recommended == "parallel" else "#d4e0ff"
        self.recommend_label.config(text=rec_text, background=bg)

        combined = []
        combined.append("=== SERIAL ===")
        combined.append(format_report("SERIAL RUN", sres))
        combined.append("\n=== PARALLEL ===")
        combined.append(format_report("PARALLEL RUN", pres))
        combined.append("\n" + rec_text)
        self.report_text.delete("1.0", tk.END)
        self.report_text.insert(tk.END, "\n\n".join(combined))

    def open_comparison(self):
        comp = Path("output") / "comparison.html"
        if comp.exists():
            try:
                webbrowser.open_new_tab(comp.resolve().as_uri())
            except Exception:
                webbrowser.open_new_tab(str(comp.resolve()))
        else:
            messagebox.showinfo("Not found", f"Comparison report not found: {comp}")

    def run_serial(self):
        threading.Thread(target=self._run, args=("serial",), daemon=True).start()

    def run_parallel(self):
        threading.Thread(target=self._run, args=("parallel",), daemon=True).start()

    def run_both(self):
        def both():
            self._run("serial")
            self._run("parallel")
        threading.Thread(target=both, daemon=True).start()

    def apply_preset(self, name: str):
        if name.startswith("Quick"):
            self.entries["bins"].delete(0, tk.END); self.entries["bins"].insert(0, "30")
            self.entries["workers"].delete(0, tk.END); self.entries["workers"].insert(0, "1")
        elif name.startswith("Demo"):
            self.entries["bins"].delete(0, tk.END); self.entries["bins"].insert(0, "200")
            self.entries["workers"].delete(0, tk.END); self.entries["workers"].insert(0, "2")
        else:
            self.entries["bins"].delete(0, tk.END); self.entries["bins"].insert(0, "2000")
            self.entries["workers"].delete(0, tk.END); self.entries["workers"].insert(0, "4")


def type_cast(s: str):
    # smartly convert strings to int or float
    try:
        if "." in s:
            return float(s)
        return int(s)
    except Exception:
        raise ValueError(f"Invalid numeric value: {s}")

if __name__ == "__main__":
    app = App()
    app.mainloop()
