/**
 * Numeric input helpers to:
 * - Block non-numeric keys (including e/E/+/- often allowed by number inputs)
 * - Sanitize pasted text
 * - Parse to number (int/float) while allowing empty string
 */

export function sanitizeNumericText(raw, { allowDecimal = false } = {}) {
  if (raw === '' || raw === null || raw === undefined) return '';
  const text = String(raw);

  if (!allowDecimal) {
    return text.replace(/[^0-9]/g, '');
  }

  // allow digits and a single dot
  let out = '';
  let sawDot = false;
  for (const ch of text) {
    if (ch >= '0' && ch <= '9') {
      out += ch;
      continue;
    }
    if (ch === '.' && !sawDot) {
      out += ch;
      sawDot = true;
    }
  }
  return out;
}

export function parseNumericOrEmpty(raw, { allowDecimal = false } = {}) {
  const sanitized = sanitizeNumericText(raw, { allowDecimal });
  if (sanitized === '') return '';

  const parsed = allowDecimal ? Number.parseFloat(sanitized) : Number.parseInt(sanitized, 10);
  return Number.isNaN(parsed) ? '' : parsed;
}

export function clampToLimits(value, { min, max }) {
  if (value === '' || value === null || value === undefined) return '';
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  return Math.min(max, Math.max(min, value));
}

export function blockNonNumericKeyDown(event, { allowDecimal = false } = {}) {
  // Allow navigation/editing keys
  const allowedKeys = [
    'Backspace',
    'Delete',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Tab',
    'Home',
    'End',
    'Enter',
  ];

  if (allowedKeys.includes(event.key)) return;

  // Allow common shortcuts: copy/paste/cut/select-all
  if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) return;

  const isDigit = /^[0-9]$/.test(event.key);
  if (isDigit) return;

  if (allowDecimal && event.key === '.') {
    const current = event.currentTarget?.value ?? '';
    if (String(current).includes('.')) {
      event.preventDefault();
    }
    return;
  }

  // Block everything else: e/E/+/-/, etc.
  event.preventDefault();
}
