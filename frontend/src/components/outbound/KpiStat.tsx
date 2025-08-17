import React from 'react';

export type KpiStatProps = {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: 'slate' | 'indigo' | 'emerald' | 'rose' | 'amber';
};

const toneToStyle: Record<NonNullable<KpiStatProps['tone']>, React.CSSProperties> = {
  slate:   { background: 'linear-gradient(135deg, var(--kpi-1-start), var(--kpi-1-end))', color: 'var(--color-white)' },
  indigo:  { background: 'linear-gradient(135deg, var(--kpi-2-start), var(--kpi-2-end))', color: 'var(--color-white)' },
  emerald: { background: 'linear-gradient(135deg, var(--kpi-3-start), var(--kpi-3-end))', color: 'var(--color-white)' },
  rose:    { background: 'linear-gradient(135deg, #f43f5e, #be123c)', color: 'var(--color-white)' },
  amber:   { background: 'linear-gradient(135deg, #f59e0b, #b45309)', color: 'var(--color-white)' },
};

export default function KpiStat({ icon, label, value, tone = 'slate' }: KpiStatProps) {
  return (
    <div className="kpi-card" style={{ ...toneToStyle[tone], display:'flex', flexDirection:'column', gap:10 }}>
      <div className="kpi-card-header">
        <div className="kpi-card-title">{label}</div>
        <div className="kpi-card-icon">{icon}</div>
      </div>
      <div className="kpi-card-content">
        <div className="kpi-card-value">{value}</div>
      </div>
    </div>
  );
}
