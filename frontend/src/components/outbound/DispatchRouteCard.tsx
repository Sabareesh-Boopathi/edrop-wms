import React from 'react';
import { Truck, User, Flag, TriangleAlert } from 'lucide-react';
import type { DispatchRoute } from '../../services/outboundService';
import '../../pages/inbound/Inbound.css';

type Props = {
  route: DispatchRoute;
  onAssignDriver: (routeId: string) => void;
  onDispatch: (routeId: string) => void;
};

const DispatchRouteCard: React.FC<Props> = ({ route, onAssignDriver, onDispatch }) => {
  const shortage = Math.max(0, route.totes_expected - route.totes_loaded);
  return (
    <div className="inbound-card">
      <div className="inbound-card-header">
        <div className="inbound-card-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Truck size={16}/> {route.name}
        </div>
        <div className="inbound-card-header-controls">
          <button className="action-link primary" onClick={() => onAssignDriver(route.route_id)}><User size={16}/> Assign Driver</button>
          <button className="action-link success" onClick={() => onDispatch(route.route_id)} disabled={route.status !== 'ready'}><Flag size={16}/> Dispatch</button>
        </div>
      </div>
      <div className="inbound-card-content">
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
          <div className="chip chip-neutral">ID: {route.route_id}</div>
          <div className="chip chip-neutral">Vehicle: {route.vehicle || 'Unassigned'}</div>
          <div className="chip chip-neutral">Driver: {route.driver || 'Unassigned'}</div>
          <div className="chip chip-neutral">Load: {route.totes_loaded} / {route.totes_expected}</div>
          <div className="chip" style={{ background:'var(--color-surface-alt)', border:'1px solid var(--color-border)', textTransform:'capitalize' }}>Status: {route.status}</div>
          {shortage > 0 ? (
            <div className="chip" style={{ background:'color-mix(in srgb, var(--color-error) 10%, transparent)', border:'1px solid var(--color-error)', color:'var(--color-error)' }}><TriangleAlert size={12}/> Short by {shortage}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DispatchRouteCard;
