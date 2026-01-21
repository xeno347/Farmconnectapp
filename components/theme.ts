export type AccentKey =
  | 'green'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'teal'
  | 'cyan'
  | 'orange'
  | 'rose'
  | 'pink'
  | 'amber'
  | 'lime'
  | 'neutral';

export type Accent = {
  a: string;
  b: string;
};

export const SURFACE = {
  bg: '#f4f2ea',
  card: '#ffffff',
  text: '#111827',
  muted: '#7b845f',
};

export const ACCENTS: Record<AccentKey, Accent> = {
  green: { a: '#22c55e', b: '#16a34a' },
  blue: { a: '#3b82f6', b: '#2563eb' },
  indigo: { a: '#6366f1', b: '#4f46e5' },
  violet: { a: '#8b5cf6', b: '#7c3aed' },
  teal: { a: '#14b8a6', b: '#0d9488' },
  cyan: { a: '#06b6d4', b: '#0891b2' },
  orange: { a: '#f97316', b: '#ea580c' },
  rose: { a: '#f43f5e', b: '#e11d48' },
  pink: { a: '#ec4899', b: '#db2777' },
  amber: { a: '#f59e0b', b: '#d97706' },
  lime: { a: '#84cc16', b: '#65a30d' },
  neutral: { a: '#4b7a55', b: '#2f5f3b' },
};

export function pickAccent(key?: AccentKey): Accent {
  if (!key) return ACCENTS.neutral;
  return ACCENTS[key] ?? ACCENTS.neutral;
}

export function hexToRgba(hex: string, a: number) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${a})`;
}
