import React, { useEffect, useMemo, useState } from 'react';
import TableCard from '../../../components/table/TableCard';
import KpiCard from '../../../components/KpiCard';
import EmptyState from '../../../components/EmptyState';
import { PlusCircle, Edit, Trash2, IdCard, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import * as notify from '../../../lib/notify';
import * as driverService from '../../../services/driverService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useWarehouseSelection } from '../../../hooks/useWarehouseSelection';
import LoadingOverlay from '../../../components/LoadingOverlay';

const STATUSES = ['ACTIVE','INACTIVE'] as const;
const schema = z.object({
  name: z.string().min(3),
  phone: z.string().min(10),
  license_no: z.string().min(5),
  license_expiry: z.string().optional().nullable(),
  status: z.enum(STATUSES),
  carrier: z.string().optional().nullable(),
});

type Schema = z.infer<typeof schema>;

type Driver = driverService.Driver;

const Drivers: React.FC = () => {
  const [rows, setRows] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | 'ACTIVE' | 'INACTIVE'>('');
  const [sortBy, setSortBy] = useState<'name'|'license_expiry'|'created_at'>('name');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { warehouses, warehouseId, setWarehouseId, allowSelection } = useWarehouseSelection();
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await driverService.listDrivers(warehouseId ? { warehouse_id: warehouseId } : undefined);
        if (mounted) setRows(data);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [warehouseId]);

  const filtered = useMemo(()=>{
    const t = q.trim().toLowerCase();
    const arr = rows.filter(r=>{
      const matches = !t || r.name.toLowerCase().includes(t) || r.phone.toLowerCase().includes(t) || r.license_no.toLowerCase().includes(t) || (r.carrier||'').toLowerCase().includes(t);
      const s = !status || r.status===status;
      return matches && s;
    });
    const dir = sortDir==='asc'?1:-1;
    return arr.sort((a,b)=>{
      const av = String(sortBy==='name'?a.name: sortBy==='license_expiry'?(a.license_expiry||''):(a.created_at||''));
      const bv = String(sortBy==='name'?b.name: sortBy==='license_expiry'?(b.license_expiry||''):(b.created_at||''));
      return av.localeCompare(bv)*dir;
    });
  },[rows,q,status,sortBy,sortDir]);

  const total = filtered.length;
  const activeCount = filtered.filter(f => f.status === 'ACTIVE').length;
  const inactiveCount = filtered.filter(f => f.status === 'INACTIVE').length;
  const paged = useMemo(()=>{ const s=(page-1)*pageSize; return filtered.slice(s,s+pageSize); },[filtered,page,pageSize]);

  const onAdd = () => { setEditing(null); setShowModal(true); };
  const onEdit = (r: Driver) => { setEditing(r); setShowModal(true); };
  const onDelete = (id: string) => {
    notify.show('Delete this Driver?', { action: { label: 'Delete', onClick: async()=>{ await driverService.deleteDriver(id); setRows(prev=>prev.filter(x=>x.id!==id)); notify.success('Deleted'); }}, cancel:{label:'Cancel', onClick: notify.dismiss} });
  };

  return (
    <div className="page-content">
      {loading && <LoadingOverlay fullscreen label="Loading drivers" />}
      <header className="header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div className="header-text">
          <h1>Drivers</h1>
          <p>Manage fleet drivers and credentials.</p>
        </div>
      </header>

      <div style={{display:'flex',flexWrap:'wrap',gap:12,marginBottom:12}}>
        <KpiCard icon={<IdCard/>} title="Total Drivers" value={total} variant="indigo" />
        <KpiCard icon={<IdCard/>} title="Active" value={activeCount} variant="emerald" />
        <KpiCard icon={<IdCard/>} title="Inactive" value={inactiveCount} variant="orange" />
      </div>

      <TableCard
        variant="inbound"
        controlsWrap="wrap"
        title={<div style={{display:'flex',alignItems:'center',gap:8}}><IdCard size={18}/> Driver Directory</div>}
        warehouse={allowSelection ? (
          <div className="form-field" style={{minWidth:220}}>
            <label>Warehouse</label>
            <select value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        ) : undefined}
        search={
          <div className="form-field" style={{maxWidth:360}}>
            <label>Search</label>
            <div style={{position:'relative'}}>
              <Search size={16} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'var(--color-text-subtle)'}}/>
              <input style={{paddingLeft:30}} placeholder="Name / Phone / License / Carrier" value={q} onChange={e=>{setQ(e.target.value); setPage(1);}}/>
            </div>
          </div>
  }
  actions={<button className="btn-primary-token" onClick={onAdd}><PlusCircle className="icon"/> Add Driver</button>}
        filters={
          <>
            <div className="form-field" style={{minWidth:160}}>
              <label>Status</label>
              <select value={status} onChange={e=>{setStatus(e.target.value as any); setPage(1);}}>
                <option value="">All</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </>
        }
    footer={
          <>
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{!loading && total ? `Showing ${Math.min(total, (page-1)*pageSize+1)}-${Math.min(page*pageSize, total)} of ${total}` : '\u2014'}</span>
            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <button type="button" className="pager-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page<=1} aria-label="Previous page" title="Previous"><ChevronLeft size={16}/></button>
              <span style={{ minWidth: 32, textAlign: 'center', fontSize: 12 }}>{page}</span>
              <button type="button" className="pager-btn" onClick={() => setPage(p => (p*pageSize<total ? p + 1 : p))} disabled={page*pageSize>=total} aria-label="Next page" title="Next"><ChevronRight size={16}/></button>
            </div>
          </>
        }
      >
        <table className="inbound-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>License</th>
              <th>Expiry</th>
              <th>Carrier</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && paged.length===0 ? (
              <tr><td colSpan={7}><EmptyState icon={<IdCard/>} title="No Drivers" message="Add your first driver." actionLabel="Add Driver" onAction={onAdd}/></td></tr>
            ) : paged.map(r=> (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td style={{fontFamily:'ui-monospace,Menlo,monospace'}}>{r.phone}</td>
                <td style={{fontFamily:'ui-monospace,Menlo,monospace'}}>{r.license_no}</td>
                <td>{r.license_expiry ? new Date(r.license_expiry).toLocaleDateString() : '—'}</td>
                <td>{r.carrier || '—'}</td>
                <td><span className={`status-badge status-${(r.status||'ACTIVE').toLowerCase()}`}><span className="status-dot"/> {r.status}</span></td>
                <td className="text-right">
                  <button className="action-link" onClick={()=>onEdit(r)}><Edit size={16}/> Edit</button>
                  <button className="action-link danger" onClick={()=>onDelete(r.id)}><Trash2 size={16}/> Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {showModal && (
        <DriverModal
          key={editing?.id||'new'}
          initial={editing}
          onClose={()=>setShowModal(false)}
          onSave={async (data)=>{
            try {
              if (editing) {
                const updated = await driverService.updateDriver(editing.id, data);
                setRows(prev=> prev.map(x=> x.id===editing.id ? updated : x));
                notify.success('Driver updated');
              } else {
                const created = await driverService.createDriver(data as any);
                setRows(prev=> [...prev, created]);
                notify.success('Driver created');
              }
              setShowModal(false);
            } catch (e:any) {
              notify.error(e?.response?.data?.detail || 'Failed to save');
            }
          }}
        />
      )}
    </div>
  );
};

const DriverModal: React.FC<{ initial: Driver | null; onClose: ()=>void; onSave: (d: Schema)=>void }> = ({ initial, onClose, onSave }) => {
  const isEdit = !!initial;
  const { register, handleSubmit, formState:{errors} } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: initial ? {
      name: initial.name,
      phone: initial.phone,
      license_no: initial.license_no,
      license_expiry: initial.license_expiry || '',
      status: initial.status || 'ACTIVE',
      carrier: initial.carrier || '',
    } : { name:'', phone:'', license_no:'', license_expiry:'', status:'ACTIVE', carrier:'' }
  });
  return (
    <div className="inbound-modal-overlay" onClick={onClose}>
      <div className="inbound-modal" onClick={e=>e.stopPropagation()}>
        <div className="inbound-modal-header">
          <h2 className="inbound-modal-title">{isEdit? 'Edit Driver' : 'Add Driver'}</h2>
          <button className="btn-outline-token" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={handleSubmit(onSave)}>
          <div className="inbound-modal-body">
            <div className="form-row">
              <div className="form-field"><label>Name</label><input {...register('name')} className={errors.name?'error':''}/>{errors.name && <div className="error-text">{String(errors.name.message)}</div>}</div>
              <div className="form-field"><label>Phone</label><input {...register('phone')} className={errors.phone?'error':''}/>{errors.phone && <div className="error-text">{String(errors.phone.message)}</div>}</div>
              <div className="form-field"><label>License No</label><input {...register('license_no')} className={errors.license_no?'error':''}/>{errors.license_no && <div className="error-text">{String(errors.license_no.message)}</div>}</div>
              <div className="form-field"><label>Expiry</label><input type="date" {...register('license_expiry' as any)} /></div>
              <div className="form-field"><label>Status</label><select {...register('status')}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select></div>
              <div className="form-field"><label>Carrier</label><input {...register('carrier')} /></div>
            </div>
          </div>
          <div className="inbound-modal-footer" style={{justifyContent:'space-between'}}>
            <div />
            <div style={{display:'flex',gap:8}}>
              <button type="button" className="btn-outline-token" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary-token">{isEdit?'Save':'Create'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Drivers;
