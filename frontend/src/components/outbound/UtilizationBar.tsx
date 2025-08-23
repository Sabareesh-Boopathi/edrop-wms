import React from 'react';
import './UtilizationBar.css';

type Props = {
  value: number; // 0-100
};

const UtilizationBar: React.FC<Props> = ({ value }) => {
  const pct = Math.max(0, Math.min(100, value));
  // New tiers:
  // <50 red, 50-75 orange, 75-80 yellow, 80-90 light green, 90-100 green
  let colorClass = 'tier-red';
  if (pct >= 90) colorClass = 'tier-green';
  else if (pct >= 80) colorClass = 'tier-green-lite';
  else if (pct >= 75) colorClass = 'tier-yellow';
  else if (pct >= 50) colorClass = 'tier-orange';

  return (
    <div className="util-bar-container">
      <div className={`util-bar-track ${colorClass}`} style={{ width: `${pct}%` }} />
      <div className="util-bar-text">{pct.toFixed(0)}%</div>
    </div>
  );
};

export default UtilizationBar;
