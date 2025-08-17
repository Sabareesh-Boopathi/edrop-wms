import React from 'react';
import { MapPin, Lock, Unlock, AlertTriangle, Shuffle } from 'lucide-react';
import type { RouteSummary } from '../../services/outboundService';
import '../../pages/inbound/Inbound.css';

type Props = {
  route: RouteSummary;
  onForceReassign: (fromBinId: string, toteId: string) => void;
  onToggleLock: (routeId: string, lock: boolean) => void;
};

const RouteBinsCard: React.FC<Props> = ({ route, onForceReassign, onToggleLock }) => {
  return (
    <div className="inbound-card">
      <div className="inbound-card-header">
        <div className="inbound-card-title">{route.name}</div>
        <div className="inbound-card-header-controls">
          <button className="action-link primary" onClick={() => onToggleLock(route.route_id, true)}><Lock size={16}/> Lock</button>
          <button className="action-link muted" onClick={() => onToggleLock(route.route_id, false)}><Unlock size={16}/> Unlock</button>
        </div>
      </div>
      <div className="inbound-card-content">
        <div style={{ display:'grid', gap:12 }}>
          {route.bins.map(b => {
            const overfilled = b.totes.length > b.capacity;
            return (
              <div key={b.bin_id} style={{ border:'1px solid var(--color-border)', borderRadius:8, padding:8 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <MapPin size={16}/>
                    <strong>{b.bin_id}</strong>
                    <span style={{ fontSize:12, color:'var(--color-text-muted)' }}>{b.totes.length} / {b.capacity}</span>
                    {overfilled ? (
                      <span className="chip" style={{ background:'color-mix(in srgb, var(--color-error) 10%, transparent)', border:'1px solid var(--color-error)', color:'var(--color-error)' }}>
                        <AlertTriangle size={12}/> Overfilled
                      </span>
                    ) : null}
                  </div>
                  <div style={{ display:'inline-flex', gap:8 }}>
                    <button className="action-link primary" onClick={() => onForceReassign(b.bin_id, b.totes[0])} disabled={!b.totes.length}><Shuffle size={16}/> Reassign</button>
                  </div>
                </div>
                {b.totes.length ? (
                  <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:8 }}>
                    {b.totes.map(tote => (
                      <span key={tote} className="chip" style={{ background:'var(--color-surface-alt)', border:'1px solid var(--color-border)' }}>{tote}</span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:4 }}>No totes assigned</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RouteBinsCard;
