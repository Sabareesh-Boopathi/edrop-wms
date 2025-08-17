import React, { useEffect, useState } from 'react';
import { Receipt } from '../../types/inbound';

interface Props {
  receipt: Receipt;
  refreshMs?: number; // default 30s
}

// Self-updating time delta component to avoid re-rendering the whole table.
const DeltaTime: React.FC<Props> = ({ receipt, refreshMs = 30000 }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);

  const planned = receipt.planned_arrival ? new Date(receipt.planned_arrival).getTime() : undefined;
  let label = '-';
  let color: string | undefined;
  if (planned) {
    if (!receipt.actual_arrival && receipt.status !== 'COMPLETED' && receipt.status !== 'CANCELLED') {
      const diffMs = planned - now;
      const sign = diffMs < 0 ? '-' : '';
      const abs = Math.abs(diffMs);
      const h = Math.floor(abs / 3600000);
      const m = Math.floor((abs % 3600000) / 60000);
      label = `${sign}${h}h${m}m`;
      color = diffMs < 0 ? 'var(--color-error)' : 'var(--color-text-soft)';
    } else if (receipt.actual_arrival) {
      const arr = new Date(receipt.actual_arrival).getTime();
      const diffMs = now - arr;
      const h = Math.floor(diffMs / 3600000);
      const m = Math.floor((diffMs % 3600000) / 60000);
      label = `${h}h${m}m in DC`;
      color = 'var(--color-success-deep, var(--color-success))';
    }
  }
  return <span style={{ color }}>{label}</span>;
};

export default DeltaTime;
