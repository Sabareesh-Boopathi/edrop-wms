import React from 'react';
import './KpiCard.css';

export type KpiVariant = 'indigo' | 'emerald' | 'orange' | 'cyan' | 'pink' | 'slate';

interface KpiCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  caption?: string;
  trendPct?: number; // positive/negative renders up/down
  variant?: KpiVariant;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, title, value, caption, trendPct, variant = 'indigo' }) => {
  const trend = typeof trendPct === 'number' ? trendPct : undefined;
  const trendClass = trend !== undefined ? (trend >= 0 ? 'kpi2-trend-up' : 'kpi2-trend-down') : '';
  const variantClass = `kpi2--${variant}`;

  return (
    <div className={`kpi2-card ${variantClass}`}>
      <div className="kpi2-bg-blob" />
      <div className="kpi2-header">
        <div className="kpi2-title">{title}</div>
        <div className="kpi2-icon">{icon}</div>
      </div>
      <div className="kpi2-body">
        <div className="kpi2-value">{value}</div>
        {caption && <div className="kpi2-caption">{caption}</div>}
      </div>
      {trend !== undefined && (
        <div className={`kpi2-trend ${trendClass}`}>
          <span>{trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
};

export default KpiCard;
