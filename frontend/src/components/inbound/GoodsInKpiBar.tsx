import React from 'react';
import { GoodsInKpis } from '../../types/inbound';
import '../../pages/inbound/Inbound.css';

interface Props { kpis: GoodsInKpis | null; loading?: boolean; onRefresh?: () => void; }

const placeholders = [ 'Total Receipts', 'Open', 'Completed Today', 'Pending', 'Late', 'SKU Receipts', 'FLAT Receipts', 'Bins Allocated'];

export const GoodsInKpiBar: React.FC<Props> = ({ kpis, loading, onRefresh }) => {
  return (
    <div className="inbound-kpis">
      {kpis ? (
        <>
          <div className="kpi-card"><div className="kpi-value">{kpis.totalReceipts}</div><div className="kpi-label">Total</div></div>
          <div className="kpi-card"><div className="kpi-value">{kpis.openReceipts}</div><div className="kpi-label">Open</div></div>
            <div className="kpi-card"><div className="kpi-value">{kpis.completedToday}</div><div className="kpi-label">Done Today</div></div>
            <div className="kpi-card"><div className="kpi-value">{kpis.pending}</div><div className="kpi-label">Pending</div></div>
            <div className="kpi-card"><div className="kpi-value">{kpis.lateArrivals}</div><div className="kpi-label">Late</div></div>
            <div className="kpi-card"><div className="kpi-value">{kpis.skuReceipts}</div><div className="kpi-label">SKU</div></div>
            <div className="kpi-card"><div className="kpi-value">{kpis.flatReceipts}</div><div className="kpi-label">FLAT</div></div>
            <div className="kpi-card"><div className="kpi-value">{kpis.binsAllocated}</div><div className="kpi-label">Bins Alloc</div></div>
        </>
      ) : loading ? (
        placeholders.map(p => <div key={p} className="kpi-card kpi-skeleton"><div className="kpi-value">--</div><div className="kpi-label">{p}</div></div>)
      ) : (
        <div className="kpi-card">No KPI data</div>
      )}
      <div style={{ display:'flex', alignItems:'center'}}>
        <button className="btn btn-secondary" onClick={onRefresh} disabled={loading}>{loading ? '…' : 'Refresh'}</button>
      </div>
    </div>
  );
};
