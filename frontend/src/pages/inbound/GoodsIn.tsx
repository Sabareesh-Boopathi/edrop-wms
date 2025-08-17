import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle, Package, Clock, CheckCircle2, AlertTriangle, Layers, Box, Grid3x3, Search, ChevronRight, Circle, XCircle, CheckCircle, ArrowRight, RotateCw, ChevronLeft } from 'lucide-react';
import { useInboundData } from '../../hooks/useInboundData';
import KpiCard from '../../components/KpiCard';
import EmptyState from '../../components/EmptyState';
import { StatusChip } from '../../components/inbound/StatusChip';
import { Receipt, ReceiptStatus } from '../../types/inbound';
import { progressReceipt, receiptStatusFlow, updateReceiptStatus, createReceipt } from '../../services/inboundService';
import DeltaTime from '../../components/inbound/DeltaTime';
import '../../pages/inbound/Inbound.css';
import { useWarehouseSelection } from '../../hooks/useWarehouseSelection';
import * as vendorService from '../../services/vendorService';
import * as configService from '../../services/configService';
import * as customerService from '../../services/customerService';
import * as flatService from '../../services/flatService';
import * as notify from '../../lib/notify';
import TableCard from '../../components/table/TableCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

function GoodsIn(): JSX.Element {
  const { receipts, kpis, loading, error, reload, setFilter, filter } = useInboundData();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Receipt | null>(null);
  const [search, setSearch] = useState(filter.search || '');
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | ''>('');
  const [vendorFilter, setVendorFilter] = useState<string>('');
  const [sort, setSort] = useState<'planned' | 'created'>('planned');
  const uniqueVendors = React.useMemo(() => receipts.reduce<string[]>((acc, r) => { if (!acc.includes(r.vendor_name)) acc.push(r.vendor_name); return acc; }, []), [receipts]);
  const { warehouses, warehouseId, setWarehouseId } = useWarehouseSelection();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [vendorQuery, setVendorQuery] = useState('');
  const [vendorSuggestions, setVendorSuggestions] = useState<Array<{ id: string; business_name: string; vendor_type: 'SKU'|'FLAT' }>>([]);
  const [selectedVendor, setSelectedVendor] = useState<{ id: string; business_name: string; vendor_type: 'SKU'|'FLAT' } | null>(null);
  const [whConfig, setWhConfig] = useState<configService.WarehouseConfig | null>(null);
  // UI lines include a transient customerText for the combobox input
  const [lines, setLines] = useState<Array<{ product_sku?: string; product_name?: string; customer_name?: string; apartment?: string; quantity: number; customerText?: string }>>([]);
  // Customers & flats for suggestions
  const [customers, setCustomers] = useState<Array<customerService.Customer>>([]);
  const [flatsById, setFlatsById] = useState<Record<string, flatService.Flat>>({});
  const [activeSuggestIdx, setActiveSuggestIdx] = useState<number | null>(null);
  const [filteredCustomers, setFilteredCustomers] = useState<Array<{ id: string; label: string; flatLabel?: string }>>([]);

  function applyFilters() {
    setFilter({ search, status: statusFilter || undefined, vendorType: undefined, warehouseId: warehouseId || undefined });
  }

  async function handleProgress(r: Receipt) {
    await progressReceipt(r.id);
    await reload();
    const updated = receipts.find(x => x.id === r.id);
    if (updated) setSelected(updated);
  }

  async function handleCancel(r: Receipt) {
    await updateReceiptStatus(r.id, 'CANCELLED');
    await reload();
    const updated = receipts.find(x => x.id === r.id);
    if (updated) setSelected(updated);
  }

  // notify on network error
  useEffect(() => {
    if (error) notify.error(error);
  }, [error]);

  // Load warehouse config and vendor suggestions
  useEffect(() => {
    (async () => {
      try {
        if (warehouseId) {
          const cfg = await configService.getWarehouseConfig(warehouseId);
          setWhConfig(cfg);
        }
      } catch (e: any) {
        notify.error(e?.response?.data?.detail || 'Failed to load warehouse config');
      }
    })();
  }, [warehouseId]);

  // When modal opens, load customers and flats to power dropdown
  useEffect(() => {
  (async () => {
      if (!showModal) return;
      try {
    const [cust, flats]: [customerService.Customer[], flatService.Flat[]] = await Promise.all([
          customerService.getCustomers().catch(()=>[]),
          flatService.getFlats().catch(()=>[]),
        ]);
        setCustomers(cust);
    const map: Record<string, flatService.Flat> = {};
    flats.forEach((f: flatService.Flat) => { map[f.id] = f; });
        setFlatsById(map);
      } catch (e) {
        // swallow silently but keep block non-empty for eslint
        console.debug('Prefetch customers/flats failed', e);
      }
    })();
  }, [showModal]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (vendorQuery.trim().length < 3) { setVendorSuggestions([]); return; }
      try {
        const all = await vendorService.getVendors();
        const term = vendorQuery.toLowerCase();
        const matches = all.filter(v => v.business_name.toLowerCase().includes(term)).slice(0, 8).map(v => ({ id: v.id, business_name: v.business_name, vendor_type: v.vendor_type as any }));
        if (!cancelled) setVendorSuggestions(matches);
      } catch (e) {
        console.debug('Vendor suggestions fetch failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, [vendorQuery]);

  // Debounce search apply
  useEffect(() => {
    const t = setTimeout(() => {
      applyFilters();
    }, 400);
    return () => clearTimeout(t);
  }, [search, warehouseId]);

  const filteredSorted = useMemo(() => {
    const base = receipts.filter(r => !vendorFilter || r.vendor_name === vendorFilter);
    const sorted = base.sort((a,b)=>{
      if (sort==='planned') return (a.planned_arrival||'').localeCompare(b.planned_arrival||'');
      return a.created_at.localeCompare(b.created_at);
    });
    return sorted;
  }, [receipts, vendorFilter, sort]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page, pageSize]);

  useEffect(() => { setPage(1); }, [search, warehouseId, vendorFilter, sort, filteredSorted.length]);

  const addEmptyLine = () => setLines(prev => [...prev, { quantity: 1, customerText: '' }]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, patch: any) => setLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));

  // Compute filtered customer list for the active line based on its customerText
  useEffect(() => {
    if (activeSuggestIdx === null) { setFilteredCustomers([]); return; }
    const q = (lines[activeSuggestIdx]?.customerText || '').trim().toLowerCase();
    if (!q) { setFilteredCustomers([]); return; }
    const items = customers
      .map(c => {
        const flat = flatsById[c.flat_id];
        const flatLabel = flat?.flat_number || flat?.id?.slice(0,8);
        const label = `${c.email || ''}${c.email && c.phone_number ? ' · ' : ''}${c.phone_number || ''}`.trim() || (c.id?.slice(0,8));
        return { id: c.id, label, flatLabel };
      })
      .filter(x => x.label.toLowerCase().includes(q) || (x.flatLabel||'').toLowerCase().includes(q))
      .slice(0, 8);
    setFilteredCustomers(items);
  }, [activeSuggestIdx, lines, customers, flatsById]);

  return (
    <div className="inbound-page">
      <div className="inbound-header">
        <div>
          <h1>Goods In</h1>
          <p>Manage inbound receipts and arrival workflows.</p>
        </div>
        <button className="btn-primary-token" onClick={() => setShowModal(true)}>
          <PlusCircle className="icon" /> New Receipt
        </button>
      </div>
      <div className="inbound-kpis">
        {kpis && !loading && (
          <>
            <KpiCard icon={<Package className="icon" />} title="Total Receipts" value={kpis.totalReceipts} variant="slate" />
            <KpiCard icon={<Package className="icon" />} title="Open" value={kpis.openReceipts} variant="indigo" />
            <KpiCard icon={<CheckCircle2 className="icon" />} title="Completed Today" value={kpis.completedToday} variant="emerald" />
            <KpiCard icon={<Clock className="icon" />} title="Pending" value={kpis.pending} variant="orange" />
            <KpiCard icon={<AlertTriangle className="icon" />} title="Late" value={kpis.lateArrivals} variant="pink" />
            <KpiCard icon={<Layers className="icon" />} title="SKU" value={kpis.skuReceipts} variant="cyan" />
            <KpiCard icon={<Box className="icon" />} title="FLAT" value={kpis.flatReceipts} variant="indigo" />
            <KpiCard icon={<Grid3x3 className="icon" />} title="Bins Alloc" value={kpis.binsAllocated} variant="emerald" />
          </>
        )}
        {loading && !kpis && (
          <div className="empty-hint" style={{gridColumn:'1 / -1'}}>Loading KPIs…</div>
        )}
      </div>

      <TableCard
        variant="inbound"
        controlsAlign="center"
        title={<>
          Inbound Receipts {loading && <span style={{fontSize:12, marginLeft:8}}>Loading…</span>}
        </>}
        warehouse={
          <div className="form-field" style={{minWidth:220}}>
            <label>Warehouse</label>
            <select value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        }
        search={
          <div style={{flex:'1 1 300px', maxWidth:420}}>
            <div className="form-field" style={{margin:0}}>
              <label>Search</label>
              <div style={{position:'relative'}}>
                <Search size={16} style={{position:'absolute', left:8, top:9, color:'var(--color-text-subtle)'}} />
                <input style={{paddingLeft:30}} value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&applyFilters()} placeholder="ID / Vendor / SKU / Customer" />
              </div>
            </div>
          </div>
        }
        actions={
          <div className="inline-actions">
            <button
              className="icon-btn"
              title={loading ? 'Refreshing…' : 'Refresh'}
              aria-label="Refresh"
              onClick={reload}
              disabled={loading}
            >
              <RotateCw size={18} />
            </button>
          </div>
        }
        footer={receipts.length > 0 ? (
          <>
            <div className="empty-hint">
              {`Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, filteredSorted.length)} of ${filteredSorted.length}`}
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <button
                className="icon-btn"
                aria-label="Previous page"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="page-indicator">{page}</div>
              <button
                className="icon-btn"
                aria-label="Next page"
                onClick={() => setPage(p => (p * pageSize < filteredSorted.length ? p + 1 : p))}
                disabled={page * pageSize >= filteredSorted.length}
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
              <select
                className="page-size"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </>
        ) : undefined}
      >
        {receipts.length === 0 && !loading ? (
          <EmptyState title="No Receipts" message="Create a receipt to start inbound processing." actionLabel="New Receipt" onAction={() => setShowModal(true)} />
        ) : null}
        {receipts.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Planned</TableHead>
                <TableHead>Δ Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(r => (
                  <TableRow key={r.id} onClick={() => setSelected(r)} style={{cursor:'pointer'}} className="appearing">
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.vendor_name}</TableCell>
                    <TableCell>{r.vendor_type}</TableCell>
                    <TableCell><StatusChip status={r.status} /></TableCell>
                    <TableCell>{r.lines.length}</TableCell>
                    <TableCell>{r.planned_arrival ? new Date(r.planned_arrival).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</TableCell>
                    <TableCell><DeltaTime receipt={r} refreshMs={30000} /></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
  {null}
      </TableCard>

      {showModal && (
        <div className="inbound-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="inbound-modal" onClick={e => e.stopPropagation()}>
            <div className="inbound-modal-header">
              <h2 className="inbound-modal-title">Create Inbound Receipt</h2>
              <button className="btn-outline-token" onClick={()=>setShowModal(false)}>Close</button>
            </div>
            <div className="inbound-modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label>Vendor</label>
      <input value={vendorQuery} onChange={e=>{ setVendorQuery(e.target.value); setSelectedVendor(null); }} placeholder="Type vendor name (min 3 chars)" />
                  {vendorSuggestions.length > 0 && (
                    <div className="suggestions">
                      {vendorSuggestions.map(v => (
        <div key={v.id} className="suggestion-item" onClick={()=>{ setVendorQuery(v.business_name); setSelectedVendor(v); setVendorSuggestions([]); }}>
                          {v.business_name} <span className="subtle">({v.vendor_type})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <label>Planned Arrival</label>
                  <input id="plannedArrival" type="datetime-local" />
                </div>
                <div className="form-field">
                  <label>Reference #</label>
                  <input id="reference" placeholder="PO / ASN" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Receipt ID</label>
                  {(() => {
                    // Requested order: SHORTCODE - PREFIX - SEQ
                    const prefix = (whConfig?.receiptPrefix || 'RCPT').toUpperCase();
                    const short = (whConfig?.shortCode || '').toUpperCase();
                    const seq = String(whConfig?.nextReceiptSeq || 1).padStart(6, '0');
                    const preview = short ? `${short}-${prefix}-${seq}` : `${prefix}-${seq}`;
                    return <input value={preview} readOnly />;
                  })()}
                </div>
              </div>
              <div className="form-field" style={{flex:'1 1 100%'}}>
                <label>Notes</label>
                <textarea id="notes" placeholder="Special handling notes..." />
              </div>
              <div style={{marginTop:12}}>
                <h4 style={{margin:'0 0 8px'}}>Add Lines</h4>
                <button className="btn-outline-token" onClick={addEmptyLine}>+ Add Line</button>
                {lines.length > 0 && (
                  <table className="inbound-table" style={{marginTop:8}}>
                    <thead>
                      <tr>
                        <th>Product SKU</th>
                        <th>Customer (Phone/Flat)</th>
                        <th>Qty</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((l, idx) => (
                        <tr key={idx}>
                          <td><input className="line-input line-input--sku" value={l.product_sku||''} onChange={e=>updateLine(idx,{ product_sku:e.target.value })} placeholder="SKU" /></td>
                          <td>
                            <div style={{position:'relative'}}
                              onFocus={()=>setActiveSuggestIdx(idx)}
                              onBlur={()=> setTimeout(()=>{ setActiveSuggestIdx(current => current===idx ? null : current); }, 150)}
                            >
                              <input
                                className="line-input line-input--customer"
                                value={l.customerText ?? ''}
                                onChange={e=> updateLine(idx, { customerText: e.target.value })}
                                placeholder="Customer (type to search)"
                              />
                              {activeSuggestIdx === idx && filteredCustomers.length > 0 && (
                                <div className="line-suggest-menu">
                                  {filteredCustomers.map(opt => (
                                    <div key={opt.id} className="line-suggest-item" onMouseDown={()=>{
                                      // Persist selection: set customer_name as label, apartment as flat label
                                      updateLine(idx, { customer_name: opt.label, apartment: opt.flatLabel, customerText: `${opt.label}${opt.flatLabel?` · ${opt.flatLabel}`:''}` });
                                    }}>
                                      <div className="line-suggest-primary">{opt.label}</div>
                                      {opt.flatLabel && <div className="line-suggest-secondary">{opt.flatLabel}</div>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{width:100}}><input className="line-input line-input--qty" type="number" min={1} value={l.quantity} onChange={e=>updateLine(idx,{ quantity: Math.max(1, Number(e.target.value||1)) })} /></td>
                          <td style={{width:48}}>
                            <button className="icon-btn" title="Delete line" onClick={()=>removeLine(idx)}>
                              <XCircle size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="inbound-modal-footer">
              <button className="btn-outline-token" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn-primary-token" disabled={!selectedVendor || lines.length === 0} title={!selectedVendor ? 'Select a vendor' : (lines.length===0 ? 'Add at least one line' : '')} onClick={async ()=>{
                try {
                  if (!warehouseId) { notify.error('Select a warehouse'); return; }
                  const vendor = selectedVendor;
                  if (!vendor) { notify.error('Select a vendor from suggestions'); return; }
                  if (lines.length === 0) { notify.error('Add at least one line'); return; }
                  const planned = (document.getElementById('plannedArrival') as HTMLInputElement)?.value || undefined;
                  const reference = (document.getElementById('reference') as HTMLInputElement)?.value || undefined;
                  const notes = (document.getElementById('notes') as HTMLTextAreaElement)?.value || undefined;
                  const payload: any = {
                    vendor_id: vendor.id,
                    vendor_type: vendor.vendor_type,
                    warehouse_id: warehouseId,
                    planned_arrival: planned ? new Date(planned).toISOString() : undefined,
                    reference,
                    notes,
                    lines: lines
                      .map(l=>({ product_sku:(l.product_sku||'').trim()||undefined, product_name:(l.product_name||'').trim()||undefined, customer_name:(l.customer_name||'').trim()||undefined, apartment:(l.apartment||'').trim()||undefined, quantity: Number(l.quantity||1) }))
                      .filter(l => (l.product_sku || l.product_name || l.customer_name))
                  };
                  const rec = await createReceipt(payload);
                  notify.success('Receipt created');
                  setShowModal(false);
                  setVendorQuery(''); setVendorSuggestions([]); setLines([]);
                  await reload();
                  setSelected(rec);
                } catch (e: any) {
                  notify.error(e?.response?.data?.detail || 'Failed to create receipt');
                }
              }}>Create Receipt</button>
            </div>
          </div>
        </div>
      )}
      {selected && (
        <div className="inbound-modal-overlay" onClick={() => setSelected(null)}>
          <div className="inbound-modal" onClick={e => e.stopPropagation()}>
            <div className="inbound-modal-header">
              <h2 className="inbound-modal-title">{selected.id}</h2>
              <button className="btn-outline-token" onClick={()=>setSelected(null)}>Close</button>
            </div>
            <div className="inbound-modal-body" style={{gap:24}}>
              <div style={{display:'flex', flexWrap:'wrap', gap:24}}>
                <div style={{flex:'1 1 260px'}}>
                  <h4 style={{margin:'0 0 8px'}}>Overview</h4>
                  <p style={{margin:'4px 0'}}><strong>Vendor:</strong> {selected.vendor_name} ({selected.vendor_type})</p>
                  <p style={{margin:'4px 0'}}><strong>Status:</strong> <StatusChip status={selected.status} /></p>
                  <p style={{margin:'4px 0'}}><strong>Planned:</strong> {selected.planned_arrival ? new Date(selected.planned_arrival).toLocaleString() : '—'}</p>
                  <p style={{margin:'4px 0'}}><strong>Actual:</strong> {selected.actual_arrival ? new Date(selected.actual_arrival).toLocaleString() : '—'}</p>
                  {selected.lines.some(l=>l.damaged||l.missing) && (
                    <p style={{margin:'8px 0', color:'var(--color-error)'}}><strong>Exceptions:</strong> {selected.lines.filter(l=>l.damaged||l.missing).length} lines</p>
                  )}
                </div>
                <div style={{flex:'2 1 320px'}}>
                  <h4 style={{margin:'0 0 8px'}}>Lifecycle</h4>
                  <div style={{display:'flex', flexWrap:'wrap', gap:8, alignItems:'center'}}>
                    {receiptStatusFlow.map((s,i) => {
                      const reached = receiptStatusFlow.indexOf(selected.status) >= i;
                      return (
                        <React.Fragment key={s}>
                          <span style={{display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:16, background: reached ? 'var(--color-primary-soft)' : 'var(--color-surface-alt)', color: reached ? 'var(--color-primary-deep)' : 'var(--color-text-soft)'}}>
                            {reached ? <CheckCircle size={14} /> : <Circle size={14} />}{s.replace(/_/g,' ')}
                          </span>
                          {i < receiptStatusFlow.length -1 && <ChevronRight size={16} style={{opacity:.4}} />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={{flex:'1 1 100%'}}>
                <h4 style={{margin:'16px 0 8px'}}>Lines</h4>
                <table className="inbound-table" style={{marginTop:4}}>
                  <thead>
                    <tr>
                      <th>Item / Customer</th>
                      <th>Qty</th>
                      <th>Damaged</th>
                      <th>Missing</th>
                      <th>Bin</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map(l => {
                      const exception = (l.damaged||0) > 0 || (l.missing||0) > 0;
                      return (
                        <tr key={l.id} style={exception?{background:'color-mix(in srgb, var(--color-error) 8%, transparent)'}:undefined}>
                          <td>{l.product_name || l.customer_name || l.product_sku}</td>
                          <td>{l.quantity}</td>
                          <td>{l.damaged || 0}</td>
                          <td>{l.missing || 0}</td>
                          <td>{l.bin_id || '-'}</td>
                          <td>{l.notes || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="inbound-modal-footer" style={{justifyContent:'space-between'}}>
              <div style={{display:'flex', gap:8}}>
                {selected.status !== 'CANCELLED' && selected.status !== 'COMPLETED' && (
                  <button className="btn-outline-token" onClick={()=>handleCancel(selected)}>Cancel</button>
                )}
              </div>
              <div style={{display:'flex', gap:8}}>
                {selected.status !== 'CANCELLED' && selected.status !== 'COMPLETED' && (
                  <button className="btn-primary-token" onClick={()=>handleProgress(selected)}>
                    Advance <ArrowRight size={16} style={{marginLeft:4}} />
                  </button>
                )}
                <button className="btn-outline-token" onClick={()=>setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoodsIn;
