// Shared configuration limits used across Dashboard + Configuration.
// Keep this as the single source of truth for min/max/steps.

export const CONFIG_LIMITS = {
  bins: { min: 10, max: 1000, label: 'Bins', integer: true },
  trucks: { min: 1, max: 10, label: 'Trucks', integer: true },
  threshold: { min: 30, max: 90, label: 'Fill Threshold (%)', integer: true, default: 60 },
  workers: { min: 1, max: 16, label: 'Workers', integer: true },
  candidates: { min: 1, max: 20, label: 'Route Candidates', integer: true },
  max_2opt: { min: 10, max: 200, label: '2-Opt Iterations', integer: true },
  alpha: { min: 0.1, max: 5.0, label: 'Alpha (α)', integer: false, step: 0.1 },
  beta: { min: 1, max: 100, label: 'Beta (β)', integer: false, step: 1 },
};
