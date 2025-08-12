export type UtilizationLevel = 'low' | 'med' | 'high';

export function utilizationLevel(pct: number): UtilizationLevel {
  if (pct <= 50) return 'low';
  if (pct <= 80) return 'med';
  return 'high';
}

export function utilizationColors(level: UtilizationLevel) {
  switch (level) {
    case 'low':
  return { bg: 'var(--util-low-bg)', border: 'var(--util-low-border)', text: 'var(--util-low-text)' };
    case 'med':
  return { bg: 'var(--util-med-bg)', border: 'var(--util-med-border)', text: 'var(--util-med-text)' };
    case 'high':
    default:
  return { bg: 'var(--util-high-bg)', border: 'var(--util-high-border)', text: 'var(--util-high-text)' };
  }
}
