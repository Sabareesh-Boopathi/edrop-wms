import React, { useEffect, useState } from 'react';
import { Rack } from 'types';
import './RackCard.css';
import { ChevronsRight } from 'lucide-react';
import { getBinsByRack } from 'services/rackService';
import { utilizationLevel, utilizationColors } from 'utils/utilization';

interface RackCardProps {
  rack: Rack;
  warehouseName: string;
  warehouseShortCode?: string;
  accentColor?: string; // hex or css var
  onDetails: () => void;
  scale?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'classic' | 'pro';
}

const RackCardComponent: React.FC<RackCardProps> = ({ rack, warehouseName, warehouseShortCode, accentColor, onDetails, scale='md', variant='classic' }) => {
  const utilization = rack.total_bins > 0 ? (rack.occupied_bins / rack.total_bins) * 100 : 0;
    const stacks = rack.stacks;
    const perStack = rack.bins_per_stack;
  const utilLevel = utilizationLevel(utilization);
  const utilTheme = utilizationColors(utilLevel);
  const nameBoardStyle: React.CSSProperties = { background: utilTheme.bg, border:`1px solid ${utilTheme.border}`, color: utilTheme.text };
    // Rack status classes control rail coloring
    const statusClass = rack.status ? `status-${rack.status}` : 'status-active';
  const variantClass = variant === 'pro' ? 'pro' : 'classic';
    // Per-bin statuses (lazy loaded once)
    const [binMatrix, setBinMatrix] = useState<string[][] | null>(null);
    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          const bins = await getBinsByRack(rack.id);
          if (cancelled) return;
            // Match RackDetailModal order: rows = stacks, cols = bins per stack
            const matrix: string[][] = Array.from({ length: stacks }, () => Array.from({ length: perStack }, () => 'empty'));
            bins.forEach(b => {
              if (b.stack_index < stacks && b.bin_index < perStack) {
                matrix[b.stack_index][b.bin_index] = b.status || 'empty';
              }
            });
            setBinMatrix(matrix);
        } catch {
          // fallback approximate representation
          const filled = rack.occupied_bins;
          const approx: string[][] = Array.from({ length: stacks }, (_, r) => Array.from({ length: perStack }, (_, c) => (r*perStack + c) < filled ? 'occupied' : 'empty'));
          if (!cancelled) setBinMatrix(approx);
        }
      })();
      return () => { cancelled = true; };
    }, [rack.id, stacks, perStack, rack.occupied_bins]);

    return (
        <div
          className={`rack-card minimal util-${utilLevel} ${variantClass}`}
          role="group"
          title={`${rack.name} — ${utilization.toFixed(0)}% full`}
        >
  <div className="rack-card-body">
              <div className="rack-visual-wrapper">
  <div className={`rack-visual ${variantClass} scale-${scale} rack-visual-util-${utilization <= 50 ? 'low' : utilization <= 80 ? 'med' : 'high'} ${statusClass} clickable`}
       onClick={onDetails}
       onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); onDetails(); } }}
       tabIndex={0}
       role="button"
       aria-pressed="false"
       aria-label={`Open rack ${rack.name} details. Utilization ${utilization.toFixed(0)} percent.`}>
      <div className="rack-name-board" style={nameBoardStyle}>
          <span className="rack-name-text">{rack.name}</span>
                  </div>
                  <div className="rack-rail" aria-hidden></div>
                  <div className="rack-grid physical-grid" style={{ gridTemplateRows: `repeat(${stacks}, 1fr)`, gridTemplateColumns: `repeat(${perStack}, 1fr)` }}>
                    {(binMatrix || []).map((row, rIdx) => row.map((state, cIdx) => {
                      const cls = state === 'occupied'
                        ? 'state-occupied'
                        : state === 'reserved'
                          ? 'state-reserved'
                          : state === 'maintenance'
                            ? 'state-maintenance'
                            : state === 'blocked'
                              ? 'state-blocked'
                              : 'state-empty';
                      return <div key={rIdx+"-"+cIdx} className={`rack-slot ${cls}`} aria-hidden />;
                    }))}
                  </div>
                  {variant === 'pro' && (
                    <>
                      <div className="rack-axis left-axis" aria-hidden>
                        {Array.from({ length: stacks }, (_, i) => <span key={i}>{i + 1}</span>)}
                      </div>
                      <div className="rack-axis bottom-axis" aria-hidden>
                        {Array.from({ length: perStack }, (_, i) => <span key={i}>{i + 1}</span>)}
                      </div>
                    </>
                  )}
                  <div className="rack-rail" aria-hidden></div>
                </div>
              </div>
  <div className="rack-bin-count subtext">{`${rack.total_bins} bin${rack.total_bins === 1 ? '' : 's'}`}</div>
            </div>
        </div>
    );
};

const RackCard = React.memo(RackCardComponent, (prev, next) => (
  prev.rack.id === next.rack.id &&
  prev.rack.occupied_bins === next.rack.occupied_bins &&
  prev.rack.total_bins === next.rack.total_bins &&
  prev.rack.status === next.rack.status &&
  prev.scale === next.scale
));

export default RackCard;
