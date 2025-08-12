import React, { useEffect, useMemo, useState } from 'react';
import { Rack, Bin, BinStatus } from 'types';
import { Package as PackageIcon, PackageOpen, Wrench, Ban, Bookmark } from 'lucide-react';
import './RackDetailModal.css';
import { getBinsByRack } from 'services/rackService';
import BinFormModal from 'components/BinFormModal';

interface RackDetailPanelProps {
  rack: Rack;
  onClose: () => void;
  hideLegend?: boolean;
}

const statusConfig: Record<BinStatus, { className: string; icon: React.ReactNode; label: string }> = {
  empty: { className: 'status-empty', icon: <PackageOpen className="bin-icon" aria-hidden />, label: 'Empty' },
  occupied: { className: 'status-occupied', icon: <PackageIcon className="bin-icon" aria-hidden />, label: 'Occupied' },
  reserved: { className: 'status-reserved', icon: <Bookmark className="bin-icon" aria-hidden />, label: 'Reserved' },
  blocked: { className: 'status-blocked', icon: <Ban className="bin-icon" aria-hidden />, label: 'Blocked' },
  maintenance: { className: 'status-maintenance', icon: <Wrench className="bin-icon" aria-hidden />, label: 'Maintenance' },
};

const RackDetailPanel: React.FC<RackDetailPanelProps> = ({ rack, onClose, hideLegend }) => {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [binEditing, setBinEditing] = useState<Bin | null>(null);

  useEffect(() => {
    const load = async () => {
      try { setLoading(true); const data = await getBinsByRack(rack.id); setBins(data); }
      catch { setError('Failed to load bins'); } finally { setLoading(false); }
    };
    load();
  }, [rack.id]);

  const grid = useMemo(() => Array.from({ length: rack.stacks }, (_, row) =>
    Array.from({ length: rack.bins_per_stack }, (_, col) => ({ row, col }))
  ), [rack.stacks, rack.bins_per_stack]);

  const findBin = (row: number, col: number) => bins.find(b => b.stack_index === row && b.bin_index === col);
  const getStatus = (row: number, col: number): BinStatus => findBin(row, col)?.status ?? 'empty';

  const utilPct = rack.total_bins ? (rack.occupied_bins / rack.total_bins) * 100 : 0;

  return (
    <div className="inline-rack-detail">
      <div className="inline-panel-header">
        <div>
          <h2 className="inline-title">{rack.name}</h2>
          <div className="rack-meta">
            <span className="rack-chip">{rack.stacks} stacks</span>
            <span className="rack-chip">{rack.bins_per_stack} bins/stack</span>
            <span className="rack-chip">{rack.total_bins} total</span>
            <span className="rack-chip">{rack.occupied_bins} occupied</span>
          </div>
          <div className="rack-util-row">
            <div className="util-bar" role="progressbar" aria-valuenow={utilPct} aria-valuemin={0} aria-valuemax={100}>
              <div className="util-fill" style={{ width: `${utilPct}%` }} />
            </div>
            <span className="util-text">{utilPct.toFixed(1)}% full</span>
          </div>
        </div>
        <button className="close-button" onClick={onClose} aria-label="Close panel">×</button>
      </div>
      <div className="inline-panel-body">
        {!hideLegend && (
          <div className="legend" style={{ marginBottom: 16 }}>
            {(['occupied','reserved','blocked','maintenance','empty'] as BinStatus[]).map(s => (
              <div key={s} className={`legend-item ${statusConfig[s].className}`}>{statusConfig[s].icon}<span>{statusConfig[s].label}</span></div>
            ))}
          </div>
        )}
        {loading && <p>Loading bins...</p>}
        {error && <p className="error-message">{error}</p>}
        <div className="bin-grid" aria-label="Bin grid">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="bin-row">
              {row.map(({ row: r, col: c }) => {
                const bin = findBin(r,c); const status = getStatus(r,c); const cfg = statusConfig[status];
                const fullCode = bin?.code || `${rack.name}-S${String(r+1).padStart(3,'0')}-B${String(c+1).padStart(3,'0')}`;
                const shortCode = `S${String(r+1).padStart(3,'0')}-B${String(c+1).padStart(3,'0')}`;
                const title = `${cfg.label} • ${fullCode}`;
                return (
                  <button key={`${r}-${c}`} type="button" className={`bin-cell ${cfg.className}`} title={title} aria-label={title}
                          onClick={() => setBinEditing(bin || { id: `${rack.id}:${r}:${c}`, rack_id: rack.id, stack_index: r, bin_index: c, status: 'empty' })}>
                    {cfg.icon}
                    <span className="bin-name">{shortCode}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {binEditing && (
        <BinFormModal
          rack={rack}
          bin={binEditing}
          onClose={() => setBinEditing(null)}
          onChanged={(updated: Bin) => {
            setBins(prev => {
              const idx = prev.findIndex(b => b.id === updated.id);
              if (idx >= 0) { const cp = [...prev]; cp[idx] = updated; return cp; }
              return [...prev, updated];
            });
            setBinEditing(null);
          }}
          onDeleted={(binId: string) => { setBins(prev => prev.filter(b => b.id !== binId)); setBinEditing(null); }}
        />
      )}
    </div>
  );
};

export default RackDetailPanel;
