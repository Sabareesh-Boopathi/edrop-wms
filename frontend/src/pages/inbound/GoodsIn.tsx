import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle, Package, Clock, CheckCircle2, AlertTriangle, Layers, Box, Grid3x3, Search, ChevronRight, Circle, XCircle, CheckCircle, ArrowRight, RotateCw, ChevronLeft } from 'lucide-react';
import { useInboundData } from '../../hooks/useInboundData';
import KpiCard from '../../components/KpiCard';
import EmptyState from '../../components/EmptyState';
import { StatusChip } from '../../components/inbound/StatusChip';
import { Receipt, ReceiptStatus } from '../../types/inbound';
import { progressReceipt, receiptStatusFlow, updateReceiptStatus, createReceipt, autoCreateReceiptsBatch } from '../../services/inboundService';
import DeltaTime from '../../components/inbound/DeltaTime';
import '../../pages/inbound/Inbound.css';
import { useWarehouseSelection } from '../../hooks/useWarehouseSelection';
import * as vendorService from '../../services/vendorService';
import * as storeService from '../../services/storeService';
import * as productService from '../../services/productService';
import * as configService from '../../services/configService';
import * as customerService from '../../services/customerService';
import * as notify from '../../lib/notify';
import TableCard from '../../components/table/TableCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import LoadingOverlay from '../../components/LoadingOverlay';

function GoodsIn(): JSX.Element {
  const { receipts, kpis, loading, error, reload, setFilter, filter } = useInboundData();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Receipt | null>(null);
  const [search, setSearch] = useState(filter.search || '');
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | ''>('');
  const [vendorFilter, setVendorFilter] = useState<string>('');
  const [sort, setSort] = useState<'planned' | 'created'>('planned');
  const uniqueVendors = React.useMemo(() => receipts.reduce<string[]>((acc, r) => { if (!acc.includes(r.vendor_name)) acc.push(r.vendor_name); return acc; }, []), [receipts]);
  const { warehouses, warehouseId, setWarehouseId, allowSelection } = useWarehouseSelection();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [vendorQuery, setVendorQuery] = useState('');
  const [vendorSuggestions, setVendorSuggestions] = useState<Array<{ id: string; business_name: string; vendor_type: 'SKU'|'FLAT' }>>([]);
  const [selectedVendor, setSelectedVendor] = useState<{ id: string; business_name: string; vendor_type: 'SKU'|'FLAT' } | null>(null);
  const [whConfig, setWhConfig] = useState<configService.WarehouseConfig | null>(null);
  // UI lines include a transient customerText for the combobox input
  const [lines, setLines] = useState<Array<{ product_sku?: string; product_name?: string; customer_name?: string; apartment?: string; quantity: number; customerText?: string }>>([]);
  const fixedFlatProductName = 'Packed Consignment';
  // Customers for suggestions
  const [customers, setCustomers] = useState<Array<customerService.Customer>>([]);
  const [activeSuggestIdx, setActiveSuggestIdx] = useState<number | null>(null);
  const [filteredCustomers, setFilteredCustomers] = useState<Array<{ id: string; label: string; primaryName: string; address?: string }>>([]);
  // Product suggest state (per active line)
  const [filteredProducts, setFilteredProducts] = useState<Array<{ id: string; sku: string; name: string }>>([]);
  const [vendorStoreProducts, setVendorStoreProducts] = useState<Record<string, Array<{ id: string; sku: string; name: string }>>>({});
  const [showCsv, setShowCsv] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);
  const [csvPreview, setCsvPreview] = useState<null | {
    vendor: { id: string; business_name: string; vendor_type: 'SKU'|'FLAT' };
    vendor_type: 'SKU'|'FLAT';
    storeName?: string;
    reference?: string;
    planned_iso?: string;
    header: string[];
    lines: Array<{
      idx: number;
      customer_name?: string;
      customer_phone?: string;
      apartment?: string;
      product_sku?: string;
      product_name?: string;
      quantity?: number;
      notes?: string;
      errors: string[];
    }>;
    errors: string[];
  }>(null);
  
  // Loading states
  const [createReceiptLoading, setCreateReceiptLoading] = useState(false);
  
  // Customer management - select once, add multiple lines
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; address?: string } | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');

  // GDPR-compliant masking utility
  const maskSensitiveData = (value: string, type: 'email' | 'phone' = 'email') => {
    if (!value) return '';
    if (type === 'email') {
      const [local, domain] = value.split('@');
      if (!domain) return value.slice(0, 2) + '*'.repeat(Math.max(0, value.length - 4)) + value.slice(-2);
      return local.slice(0, 2) + '*'.repeat(Math.max(0, local.length - 2)) + '@' + domain;
    } else { // phone
      return value.slice(0, 3) + '*'.repeat(Math.max(0, value.length - 6)) + value.slice(-3);
    }
  };

  function applyFilters() {
    setFilter({ search, status: statusFilter || undefined, vendorType: undefined, warehouseId: warehouseId || undefined });
  }

  async function handleProgress(r: Receipt) {
    try {
      const updated = await progressReceipt(r.id);
      setSelected(updated); // Update modal immediately with latest data
      await reload(); // Then refresh the list
    } catch (e: any) {
      notify.error(e?.response?.data?.detail || 'Failed to progress receipt');
    }
  }

  async function handleCancel(r: Receipt) {
    try {
      const updated = await updateReceiptStatus(r.id, 'CANCELLED');
      setSelected(updated); // Update modal immediately with latest data
      await reload(); // Then refresh the list
    } catch (e: any) {
      notify.error(e?.response?.data?.detail || 'Failed to cancel receipt');
    }
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

  // When modal opens, load customers to power dropdown
  useEffect(() => {
  (async () => {
      if (!showModal) return;
      try {
        const cust: customerService.Customer[] = await customerService.getCustomers().catch(()=>[]);
        setCustomers(cust);
      } catch (e) {
        // swallow silently but keep block non-empty for eslint
        console.debug('Prefetch customers failed', e);
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

  // When a vendor is selected, load products available via their stores (dedup by product_id)
  useEffect(() => {
    (async () => {
      const v = selectedVendor?.id;
      if (!v) { setVendorStoreProducts({}); return; }
      try {
        const stores = await storeService.listStoresByVendor(v);
        const productMap: Record<string, { id: string; sku: string; name: string }> = {};
        for (const st of stores) {
          try {
            const sps = await storeService.listStoreProducts(st.id);
            for (const sp of sps) {
              // We need product details; fallback to id mapping if productService is costly
              if (!productMap[sp.product_id]) {
                // Instead of per-product GETs, assume API includes catalog elsewhere; here, capture product_id as key and a placeholder
                productMap[sp.product_id] = { id: sp.product_id, sku: (sp as any).product_sku || '', name: (sp as any).product_name || '' };
              }
            }
          } catch (e) { console.debug('Store product fetch failed', st.id, e); }
        }
        // If names/skus missing, attempt a single fetch of all products and enrich
        try {
          const catalog = await productService.listProducts();
          const byId: Record<string, typeof catalog[number]> = {};
          catalog.forEach(p => { byId[p.id] = p as any; });
          Object.keys(productMap).forEach(pid => {
            const p = byId[pid];
            if (p) productMap[pid] = { id: pid, sku: (p as any).sku || '', name: (p as any).name || '' };
          });
        } catch (e) { console.debug('Product catalog fetch failed', e); }
        // Store under vendor id for quick use
        setVendorStoreProducts(prev => ({ ...prev, [v]: Object.values(productMap) }));
  } catch (e) { console.debug('Vendor store fetch failed', e); }
    })();
  }, [selectedVendor?.id]);

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

  const addEmptyLine = () => {
    if (selectedCustomer) {
      setLines(prev => [...prev, { 
        quantity: 1, 
        customer_name: selectedCustomer.name,
        apartment: selectedCustomer.address,
        customerText: `${selectedCustomer.name}${selectedCustomer.address ? ` · ${selectedCustomer.address}` : ''}`
      }]);
    } else {
      setLines(prev => [...prev, { quantity: 1, customerText: '' }]);
    }
  };
  
  const addLineForNewCustomer = () => setLines(prev => [...prev, { quantity: 1, customerText: '' }]);
  
  const updateLine = (idx: number, patch: any) => setLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));
  
  const resetModal = () => {
    setShowModal(false);
    setVendorQuery(''); 
    setVendorSuggestions([]); 
    setSelectedVendor(null); 
    setLines([]);
    setSelectedCustomer(null);
    setCustomerQuery('');
    setCreateReceiptLoading(false);
  };

  const closeCsvModal = () => {
    setShowCsv(false);
    setCsvPreview(null);
    setCsvBusy(false);
  };
  const fmtErr = (e: any) => {
    const d = e?.response?.data?.detail;
    if (Array.isArray(d)) return d.map((x:any)=> x?.msg || x?.message || (typeof x === 'string' ? x : JSON.stringify(x))).join('; ');
    return d || e?.message || 'CSV import failed';
  };

  // Compute filtered customer list for customer selection (not per-line)
  useEffect(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) { setFilteredCustomers([]); return; }
    const filteredCusts = customers
      .filter(customer => 
        (customer.name && customer.name.toLowerCase().includes(q)) || 
        (customer.email && customer.email.toLowerCase().includes(q)) ||
        (customer.phone_number && customer.phone_number.includes(q)) ||
        (customer.block && customer.block.toLowerCase().includes(q)) ||
        (customer.flat_number && customer.flat_number.toLowerCase().includes(q))
      );
      
    const items = filteredCusts
      .map(c => {
        // Primary label should be customer name with address details
        const primaryLabel = c.name || 'Unknown Customer';
        const addressInfo = [c.block, c.flat_number].filter(Boolean).join(' - ');
        const contactInfo = c.email ? maskSensitiveData(c.email, 'email') : 
                           c.phone_number ? maskSensitiveData(c.phone_number, 'phone') : 
                           c.id?.slice(0,8);
        
        let displayLabel = primaryLabel;
        if (addressInfo) {
          displayLabel += ` (${addressInfo})`;
        } else if (!c.name) {
          displayLabel += ` (${contactInfo})`;
        }
        
        return { id: c.id, label: displayLabel, primaryName: primaryLabel, address: addressInfo };
      })
      .slice(0, 8);
    setFilteredCustomers(items);
  }, [customerQuery, customers, maskSensitiveData]);

  // Compute filtered product list for active line from vendorStoreProducts
  useEffect(() => {
    if (activeSuggestIdx === null) { setFilteredProducts([]); return; }
    const vId = selectedVendor?.id;
    if (!vId) { setFilteredProducts([]); return; }
    const q = (lines[activeSuggestIdx]?.product_sku || '').trim().toLowerCase();
    if (!q) { setFilteredProducts([]); return; }
    const pool = vendorStoreProducts[vId] || [];
    const items = pool
      .filter(p => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
      .slice(0, 8);
    setFilteredProducts(items);
  }, [activeSuggestIdx, lines, vendorStoreProducts, selectedVendor?.id]);

  return (
    <div className="inbound-page">
      <div className="inbound-header">
        <div>
          <h1>Goods In</h1>
          <p>Manage inbound receipts and arrival workflows.</p>
        </div>
        <div style={{display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap'}}>
          {allowSelection && (
            <div className="form-field" style={{minWidth:220}}>
              <label>Warehouse</label>
              <select value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          )}
          <button className="btn-outline-token" onClick={async ()=>{
            try {
              if (!warehouseId) { notify.error('Select a warehouse'); return; }
              const list = await autoCreateReceiptsBatch(warehouseId);
              notify.success(`Auto-generated ${list.length} receipt(s) from warehouse demand`);
              await reload();
              if (list.length > 0) setSelected(list[0]);
            } catch (e: any) {
              notify.error(e?.response?.data?.detail || 'No pending demands found for this warehouse');
            }
          }}>
            <Package className="icon" /> Auto Generate from Demand
          </button>
          <button className="btn-outline-token" onClick={()=>setShowCsv(true)}>
            <Grid3x3 className="icon" /> CSV Import
          </button>
        </div>
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
          <div className="empty-hint" style={{gridColumn:'1 / -1'}}>
            <LoadingOverlay label="Loading KPIs" />
          </div>
        )}
      </div>

  <TableCard
        variant="inbound"
        controlsAlign="center"
        title={<> 
          Inbound Receipts
        </>}
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
          <div className="inline-actions" style={{marginLeft:'auto'}}>
            <button className="btn-primary-token" onClick={() => setShowModal(true)}>
              <PlusCircle size={16} style={{marginRight:4}} /> Create Receipt
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
        {loading && (
          <LoadingOverlay label="Loading receipts" />
        )}
        {receipts.length === 0 && !loading ? (
          <EmptyState title="No Receipts" message="Create a receipt to start inbound processing." actionLabel="New Receipt" onAction={() => setShowModal(true)} />
        ) : null}
        {receipts.length > 0 && (
          <Table>
      <TableHeader>
              <TableRow>
        <TableHead>Receipt</TableHead>
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
          <TableCell>{r.code || r.reference || r.id}</TableCell>
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
              <h2 className="inbound-modal-title">Create New Inbound Receipt</h2>
              <button className="btn-outline-token" onClick={()=>setShowModal(false)}>Close</button>
            </div>
            <div className="inbound-modal-body">
              <div className="empty-hint" style={{marginBottom:16, padding:12, background:'var(--color-surface-alt)', borderRadius:6}}>
                <strong>Receipt Creation Guide:</strong><br/>
                1. Select a vendor from the suggestions (minimum 3 characters)<br/>
                2. Add receipt details (planned arrival, reference number)<br/>
                3. Add line items for products/customers<br/>
                4. Review and create your receipt
              </div>
              <div className="form-row">
                <div className="form-field" style={{ position: 'relative', flex: '0 1 360px', maxWidth: 360 }}>
                  <label>Vendor <span style={{color:'var(--color-error)'}}>*</span></label>
                  <input 
                    value={vendorQuery} 
                    onChange={e=>{ 
                      setVendorQuery(e.target.value); 
                      setSelectedVendor(null);
                      if (!e.target.value) setVendorSuggestions([]);
                    }} 
                    placeholder="Start typing vendor name (min 3 chars)" 
                    style={selectedVendor ? {background:'var(--color-success-soft)', borderColor:'var(--color-success)'} : undefined}
                  />
                  {selectedVendor && (
                    <div style={{fontSize:12, color:'var(--color-success)', marginTop:2}}>
                      ✓ Selected: {selectedVendor.business_name} ({selectedVendor.vendor_type})
                    </div>
                  )}
                  {vendorSuggestions.length > 0 && !selectedVendor && (
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
                  <label>Planned Arrival Date & Time</label>
                  <input id="plannedArrival" type="datetime-local" />
                  <div style={{fontSize:11, color:'var(--color-text-subtle)', marginTop:4}}>
                    ⏰ Time stored in current system time zone.
                  </div>
                </div>
                <div className="form-field">
                  <label>Reference Number</label>
                  <input id="reference" placeholder="PO Number / ASN Reference / Invoice Number" />
                  <div style={{fontSize:11, color:'var(--color-text-subtle)', marginTop:4}}>
                    📄 Optional: Purchase Order, ASN, or vendor reference for tracking and reconciliation
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Receipt Code (Auto-generated)</label>
                  {(() => {
                    const prefix = (whConfig?.receiptPrefix || 'RCPT').toUpperCase();
                    const short = (whConfig?.shortCode || '').toUpperCase();
                    const seq = String(whConfig?.nextReceiptSeq || 1).padStart(6, '0');
                    const preview = short ? `${short}-${prefix}-${seq}` : `${prefix}-${seq}`;
                    return <input value={preview} readOnly style={{background:'var(--color-surface-alt)', cursor:'not-allowed'}} />;
                  })()}
                </div>
                <div className="form-field" style={{flex:'1 1 100%'}}>
                  <label>Special Handling Notes</label>
                  <textarea id="notes" placeholder="Add any special instructions or handling requirements..." rows={2} />
                </div>
              </div>
              <div style={{marginTop:20, borderTop:'1px solid var(--color-border)', paddingTop:16}}>
                {/* Customer Selection Section */}
                <div style={{marginBottom:20, padding:16, background:'var(--color-surface-alt)', borderRadius:6}}>
                  <h4 style={{margin:'0 0 12px 0'}}>Customer Selection</h4>
                  <div style={{display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap'}}>
                    <div className="form-field" style={{flex:'1 1 300px', position:'relative'}}>
                      <label>Search Customer</label>
                      <input 
                        value={customerQuery} 
                        onChange={e => {
                          setCustomerQuery(e.target.value);
                          setSelectedCustomer(null);
                        }}
                        placeholder="Type customer name, phone, or apartment number" 
                        style={selectedCustomer ? {background:'var(--color-success-soft)', borderColor:'var(--color-success)'} : undefined}
                      />
                      {selectedCustomer && (
                        <div style={{fontSize:12, color:'var(--color-success)', marginTop:2}}>
                          ✓ Selected: {selectedCustomer.name}{selectedCustomer.address ? ` · ${selectedCustomer.address}` : ''}
                        </div>
                      )}
                      {filteredCustomers.length > 0 && !selectedCustomer && (
                        <div className="suggestions">
                          {filteredCustomers.map(c => (
                            <div key={c.id} className="suggestion-item" onClick={() => {
                              setSelectedCustomer({ 
                                name: c.primaryName, 
                                address: c.address 
                              });
                              setCustomerQuery(c.primaryName);
                              setFilteredCustomers([]);
                            }}>
                              {c.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      className="btn-outline-token" 
                      onClick={() => { setSelectedCustomer(null); setCustomerQuery(''); }}
                      disabled={!selectedCustomer}
                    >
                      Clear Customer
                    </button>
                  </div>
                </div>

                {/* Line Items Section */}
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
                  <h4 style={{margin:0}}>Products for {selectedCustomer ? selectedCustomer.name : 'Selected Customer'}</h4>
                  <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                    <button 
                      className="btn-outline-token" 
                      onClick={() => {
                        if (!selectedVendor) {
                          notify.error('Please select a vendor first before adding products');
                          return;
                        }
                        if (!selectedCustomer) {
                          notify.error('Please select a customer first before adding products');
                          return;
                        }
                        if (selectedVendor?.vendor_type === 'FLAT') {
                          addEmptyLine();
                        } else {
                          addEmptyLine();
                        }
                      }} 
                      disabled={!selectedVendor || !selectedCustomer}
                      title={!selectedVendor ? 'Select a vendor first' : (!selectedCustomer ? 'Select a customer first' : 'Add product for this customer')}
                    >
                      <PlusCircle size={16} style={{marginRight:4}} />
                      Add Product
                    </button>
                    <button 
                      className="btn-outline-token" 
                      onClick={() => {
                        if (!selectedVendor) {
                          notify.error('Please select a vendor first before adding products');
                          return;
                        }
                        addLineForNewCustomer();
                      }}
                      disabled={!selectedVendor}
                      title={!selectedVendor ? 'Select a vendor first' : 'Add product for a different customer'}
                    >
                      <PlusCircle size={16} style={{marginRight:4}} />
                      Add for Different Customer
                    </button>
                    {lines.length > 0 && (
                      <span style={{fontSize:12, color:'var(--color-text-subtle)', alignSelf:'center'}}>
                        {lines.length} item(s) added
                      </span>
                    )}
                  </div>
                </div>
                {lines.length > 0 ? (
                  <table className="inbound-table" style={{marginTop:8}}>
                    <thead>
                      <tr>
                        <th style={{width:40}}>#</th>
                        <th>{selectedVendor?.vendor_type === 'FLAT' ? 'Consignment Type' : 'Product (SKU recommended)'}</th>
                        <th>Customer Details</th>
                        <th style={{width:80}}>Qty</th>
                        <th style={{width:48}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((l, idx) => (
                        <tr key={idx}>
                          <td style={{textAlign:'center', color:'var(--color-text-subtle)'}}>{idx + 1}</td>
                          <td>
                            {selectedVendor?.vendor_type === 'FLAT' ? (
                              <input className="line-input line-input--sku" value={fixedFlatProductName} readOnly style={{background:'var(--color-surface-alt)'}} />
                            ) : (
                              <div style={{position:'relative'}}>
                                <input 
                                  className="line-input line-input--sku" 
                                  value={l.product_sku||''} 
                                  onChange={e => {
                                    updateLine(idx, { product_sku: e.target.value });
                                    setActiveSuggestIdx(idx);
                                  }}
                                  onFocus={() => setActiveSuggestIdx(idx)}
                                  onBlur={() => setTimeout(() => setActiveSuggestIdx(null), 150)}
                                  placeholder="Enter product SKU (recommended) or name" 
                                />
                                {activeSuggestIdx === idx && filteredProducts.length > 0 && (
                                  <div className="line-suggest-menu">
                                    {filteredProducts.map(p => (
                                      <div key={p.id} className="line-suggest-item" onMouseDown={() => {
                                        updateLine(idx, { product_sku: p.sku, product_name: p.name });
                                        setActiveSuggestIdx(null);
                                      }}>
                                        <div className="line-suggest-primary">SKU: {p.sku}</div>
                                        <div className="line-suggest-secondary">{p.name}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {l.customer_name ? (
                              <div style={{color:'var(--color-success)', fontSize:12}}>
                                {l.customerText || `${l.customer_name}${l.apartment ? ` · ${l.apartment}` : ''}`}
                              </div>
                            ) : (
                              <div style={{position:'relative'}}>
                                <input
                                  className="line-input line-input--customer"
                                  value={l.customerText ?? ''}
                                  onChange={e => updateLine(idx, { customerText: e.target.value })}
                                  placeholder="Enter customer name, phone, or flat"
                                  style={{fontSize:12}}
                                />
                              </div>
                            )}
                          </td>
                          <td style={{width:80}}>
                            {selectedVendor?.vendor_type === 'FLAT' ? (
                              <input className="line-input line-input--qty" type="number" min={1} value={1} readOnly style={{background:'var(--color-surface-alt)'}} />
                            ) : (
                              <input 
                                className="line-input line-input--qty" 
                                type="number" 
                                min={1} 
                                value={l.quantity} 
                                onChange={e=>updateLine(idx,{ quantity: Math.max(1, Number(e.target.value||1)) })} 
                              />
                            )}
                          </td>
                          <td style={{width:48}}>
                            <button className="icon-btn" title="Remove this line" onClick={()=>removeLine(idx)} style={{color:'var(--color-error)'}}>
                              <XCircle size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-hint" style={{textAlign:'center', padding:20, border:'1px dashed var(--color-border)', borderRadius:6, marginTop:8}}>
                    {!selectedVendor ? 'Select a vendor first, then select a customer and add products' : (!selectedCustomer ? 'Select a customer first, then add products' : 'No products added yet. Click "Add Product" to get started.')}
                  </div>
                )}
              </div>
            </div>
            <div className="inbound-modal-footer" style={{borderTop:'1px solid var(--color-border)', paddingTop:16}}>
              <button className="btn-outline-token" onClick={resetModal} disabled={createReceiptLoading}>
                Cancel
              </button>
              <button 
                className="btn-primary-token" 
                disabled={!selectedVendor || lines.length === 0 || createReceiptLoading} 
                title={!selectedVendor ? 'Please select a vendor first' : (lines.length===0 ? 'Add at least one line item' : 'Create your receipt')} 
                onClick={async ()=>{
                  try {
                    setCreateReceiptLoading(true);
                    if (!warehouseId) { notify.error('Please select a warehouse first'); return; }
                    const vendor = selectedVendor;
                    if (!vendor) { notify.error('Please select a vendor from the suggestions'); return; }
                    if (lines.length === 0) { notify.error('Please add at least one line item'); return; }
                    
                    // Validate that all lines have required customer information
                    const invalidLines = lines.filter(l => {
                      const hasCustomer = (l.customer_name||'').trim() || (l.customerText||'').trim();
                      const hasProduct = vendor.vendor_type === 'FLAT' || (l.product_sku||'').trim() || (l.product_name||'').trim();
                      return !hasCustomer || !hasProduct;
                    });
                    
                    if (invalidLines.length > 0) {
                      notify.error(`Please fill in customer and product details for all line items (${invalidLines.length} incomplete)`);
                      return;
                    }
                    
                    const planned = (document.getElementById('plannedArrival') as HTMLInputElement)?.value || undefined;
                    const reference = (document.getElementById('reference') as HTMLInputElement)?.value || undefined;
                    const notes = (document.getElementById('notes') as HTMLTextAreaElement)?.value || undefined;
                    
                    // Fix timezone issue: treat datetime-local as local time, not UTC
                    let plannedArrivalISO: string | undefined = undefined;
                    if (planned) {
                      // datetime-local gives us YYYY-MM-DDTHH:mm format
                      // We want to preserve the local time as entered by user
                      const localDate = new Date(planned);
                      // Get timezone offset and adjust to keep the same display time
                      const offsetMs = localDate.getTimezoneOffset() * 60000;
                      const adjustedDate = new Date(localDate.getTime() - offsetMs);
                      plannedArrivalISO = adjustedDate.toISOString();
                    }
                    
                    const payload: any = {
                      vendor_id: vendor.id,
                      vendor_type: vendor.vendor_type,
                      warehouse_id: warehouseId,
                      planned_arrival: plannedArrivalISO,
                      reference,
                      notes,
                      lines: lines
                        .map(l=>({ 
                          product_sku: (selectedVendor?.vendor_type==='SKU' ? (l.product_sku||'').trim()||undefined : undefined), 
                          product_name: (selectedVendor?.vendor_type==='FLAT' ? fixedFlatProductName : (l.product_name||'').trim()||undefined), 
                          customer_name:(l.customer_name||'').trim()||undefined, 
                          apartment:(l.apartment||'').trim()||undefined, 
                          quantity: (selectedVendor?.vendor_type==='FLAT' ? 1 : Number(l.quantity||1)) 
                        }))
                        .filter(l => {
                          const hasCustomer = l.customer_name && l.customer_name.trim();
                          const hasProduct = l.product_sku || l.product_name;
                          return hasCustomer && hasProduct;
                        })
                    };
                    const rec = await createReceipt(payload);
                    notify.success(`Receipt ${rec.code || rec.id} created successfully!`);
                    resetModal();
                    await reload();
                    setSelected(rec);
                  } catch (e: any) {
                    notify.error(e?.response?.data?.detail || 'Failed to create receipt. Please check your inputs.');
                  } finally {
                    setCreateReceiptLoading(false);
                  }
                }}
              >
                {createReceiptLoading ? (
                  <>
                    <RotateCw size={16} style={{marginRight:4, animation: 'spin 1s linear infinite'}} />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} style={{marginRight:4}} />
                    Create Receipt ({lines.length} item{lines.length !== 1 ? 's' : ''})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {selected && (
        <div className="inbound-modal-overlay" onClick={() => setSelected(null)}>
          <div className="inbound-modal" onClick={e => e.stopPropagation()}>
            <div className="inbound-modal-header">
              <h2 className="inbound-modal-title">{selected.code || selected.reference || selected.id}</h2>
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
                          <td>{(l as any).bin_code || l.bin_id || '-'}</td>
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

      {showCsv && (
        <div className="inbound-modal-overlay" onClick={()=>!csvBusy && closeCsvModal()}>
          <div className="inbound-modal" onClick={e=>e.stopPropagation()}>
            <div className="inbound-modal-header">
              <h2 className="inbound-modal-title">Import Receipt from CSV</h2>
              <button className="btn-outline-token" onClick={closeCsvModal} disabled={csvBusy}>Close</button>
            </div>
            <div className="inbound-modal-body">
              <div className="empty-hint" style={{marginBottom:12}}>
                <strong>CSV Import Instructions:</strong><br/>
                Download the template below, fill in your receipt data, and upload. The template includes an example row - this will be automatically ignored during import.
                <br/><br/>
                <strong>Required columns:</strong> vendor_name, customer_name (or customer_phone)<br/>
                <strong>Optional columns:</strong> vendor_type (SKU|FLAT), store_name, reference, planned_arrival (ISO date), apartment, product_sku, product_name, quantity, notes
              </div>
              <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                <a
                  className="btn-primary-token"
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent('vendor_name,vendor_type,store_name,reference,planned_arrival,customer_name,customer_phone,apartment,product_sku,product_name,quantity,notes\nExample Vendor,SKU,Example Store,REF-001,2025-08-21T10:00:00Z,John Doe,+1234567890,A-101,SKU-001,Sample Product,2,Example notes - this row will be ignored\n')}`}
                  download={`receipt-import-template.csv`}
                >
                  <Grid3x3 size={16} style={{marginRight:4}} />
                  Download CSV Template (with example)
                </a>
                <label className="btn-primary-token" style={{display:'inline-flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                  <input type="file" accept=".csv" style={{display:'none'}} onChange={async (e)=>{
                    const file = e.target.files?.[0]; if (!file) return;
                    setCsvBusy(true);
                    try {
                      if (!warehouseId) { notify.error('Select a warehouse'); return; }
                      const text = await file.text();
                      const linesRaw = text.split(/\r?\n/).filter(r=>r.trim().length>0);
                      if (linesRaw.length < 2) { notify.error('CSV is empty'); return; }
                      const header = linesRaw[0].split(',').map(h=>h.trim());
                      const hLow = header.map(h=>h.toLowerCase());
                      const idx = (name: string) => hLow.indexOf(name);
                      const rows = linesRaw.slice(1).map(r => r.split(','));
                      const vendIdx = idx('vendor_name');
                      const vtypeIdx = idx('vendor_type');
                      const storeIdx = idx('store_name');
                      const refIdx = idx('reference');
                      const etaIdx = idx('planned_arrival');
                      const custIdx = idx('customer_name');
                      const phoneIdx = idx('customer_phone');
                      const apartmentIdx = idx('apartment');
                      const skuIdx = idx('product_sku');
                      const pnameIdx = idx('product_name');
                      const qtyIdx = idx('quantity');
                      const notesIdx = idx('notes');
                      const errors: string[] = [];
                      if (vendIdx === -1) errors.push('Missing column: vendor_name');
                      if (custIdx === -1 && phoneIdx === -1) errors.push('Missing customer_name or customer_phone column');
                      if (errors.length) { setCsvPreview({ vendor: undefined as any, vendor_type: 'SKU', header, lines: [], errors }); return; }
                      
                      const vendName = (rows[0][vendIdx]||'').trim();
                      let vendor;
                      
                      // Skip if first row is an example row
                      if (vendName.toLowerCase().includes('example') || vendName.toLowerCase().includes('sample')) {
                        // Find the first non-example row for vendor lookup
                        const realRow = rows.find(r => {
                          const vn = (r[vendIdx]||'').trim();
                          return vn && !vn.toLowerCase().includes('example') && !vn.toLowerCase().includes('sample');
                        });
                        if (!realRow) {
                          setCsvPreview({ vendor: undefined as any, vendor_type: 'SKU', header, lines: [], errors: ['No valid vendor rows found (only example data)'] });
                          return;
                        }
                        const realVendorName = (realRow[vendIdx]||'').trim();
                        const vendors = await vendorService.getVendors();
                        vendor = vendors.find(v => (v.business_name||'').toLowerCase() === realVendorName.toLowerCase());
                        if (!vendor) { setCsvPreview({ vendor: undefined as any, vendor_type: 'SKU', header, lines: [], errors: [`Vendor not found: ${realVendorName}`] }); return; }
                      } else {
                        const vendors = await vendorService.getVendors();
                        vendor = vendors.find(v => (v.business_name||'').toLowerCase() === vendName.toLowerCase());
                        if (!vendor) { setCsvPreview({ vendor: undefined as any, vendor_type: 'SKU', header, lines: [], errors: [`Vendor not found: ${vendName}`] }); return; }
                      }
                      const typeCsvRaw = vtypeIdx >= 0 ? (rows[0][vtypeIdx]||'').trim().toUpperCase() : '';
                      
                      // Validate vendor type matches what's in CSV
                      let vendor_type: 'SKU' | 'FLAT';
                      if (typeCsvRaw && (typeCsvRaw === 'SKU' || typeCsvRaw === 'FLAT')) {
                        if (typeCsvRaw !== vendor.vendor_type) {
                          setCsvPreview({ 
                            vendor: undefined as any, 
                            vendor_type: 'SKU', 
                            header, 
                            lines: [], 
                            errors: [`Vendor type mismatch: CSV specifies '${typeCsvRaw}' but vendor '${vendor.business_name}' is type '${vendor.vendor_type}'`] 
                          }); 
                          return;
                        }
                        vendor_type = typeCsvRaw as 'SKU' | 'FLAT';
                      } else {
                        vendor_type = vendor.vendor_type as 'SKU' | 'FLAT';
                      }
                      const storeName = storeIdx >= 0 ? (rows[0][storeIdx]||'').trim() : '';
                      const reference = refIdx >= 0 ? (rows[0][refIdx]||'').trim() : undefined;
                      const plannedRaw = etaIdx >= 0 ? (rows[0][etaIdx]||'').trim() : '';
                      let planned_iso: string | undefined = undefined;
                      const localErrors: string[] = [];
                      if (plannedRaw) {
                        const t = Date.parse(plannedRaw);
                        if (!isNaN(t)) planned_iso = new Date(t).toISOString(); else localErrors.push('Invalid planned_arrival date');
                      }
                      let catalog: Array<{id:string;sku:string;name:string}> = [];
                      if (vendor_type === 'SKU') {
                        try { 
                          catalog = await productService.listProducts(); 
                        } catch (e) {
                          console.debug('Failed to load product catalog', e);
                        }
                      }
                      const toStr = (v?: string) => (v||'').trim();
                      const parsedLines = rows
                        .map((r, i) => {
                          const recErrors: string[] = [];
                          const customer_name = toStr(custIdx>=0 ? r[custIdx] : '');
                          const customer_phone = toStr(phoneIdx>=0 ? r[phoneIdx] : '');
                          const apartment = toStr(apartmentIdx>=0 ? r[apartmentIdx] : '');
                          const product_sku = toStr(skuIdx>=0 ? r[skuIdx] : '');
                          const product_name = toStr(pnameIdx>=0 ? r[pnameIdx] : '');
                          const qtyStr = toStr(qtyIdx>=0 ? r[qtyIdx] : '');
                          const notes = toStr(notesIdx>=0 ? r[notesIdx] : '');
                          
                          // Skip example/sample rows more thoroughly
                          const isExample = [customer_name, customer_phone, apartment, product_sku, product_name, notes]
                            .some(field => {
                              const lower = field.toLowerCase();
                              return lower.includes('example') || 
                                     lower.includes('sample') || 
                                     lower.includes('test') ||
                                     lower.includes('demo') ||
                                     lower === 'xxx' ||
                                     lower === 'n/a';
                            });
                          if (isExample) return null;
                          
                          if (!customer_name && !customer_phone) recErrors.push('Missing customer_name/phone');
                          let quantity = 1;
                          if (vendor_type === 'SKU') {
                            if (!product_sku && !product_name) recErrors.push('Missing product_sku or product_name');
                            const qn = parseInt(qtyStr || '1', 10);
                            if (isNaN(qn) || qn < 1) recErrors.push('Invalid quantity'); else quantity = qn;
                            if (!product_sku && product_name && catalog.length) {
                              const hit = catalog.find(p => (p.name||'').toLowerCase() === product_name.toLowerCase());
                              if (!hit) recErrors.push('Product not found by name');
                            }
                          } else {
                            quantity = 1;
                          }
                          return { idx: i+1, customer_name, customer_phone, apartment, product_sku, product_name, quantity, notes, errors: recErrors };
                        })
                        .filter((line): line is NonNullable<typeof line> => line !== null);
                      const allErrors = [...localErrors, ...parsedLines.flatMap(l => l.errors.map(e => `Row ${l.idx}: ${e}`))];
                      setCsvPreview({ vendor, vendor_type, storeName, reference, planned_iso, header, lines: parsedLines, errors: allErrors });
                    } catch (err: any) {
                      notify.error(fmtErr(err));
                    } finally { setCsvBusy(false); }
                  }} />
                  Upload CSV
                </label>
              </div>
              {csvPreview && (
                <div style={{marginTop:12}}>
                  <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
                    <div><strong>Vendor:</strong> {csvPreview.vendor?.business_name || '-'} ({csvPreview.vendor_type})</div>
                    <div><strong>Store:</strong> {csvPreview.storeName || '-'}</div>
                    <div><strong>Reference:</strong> {csvPreview.reference || '-'}</div>
                    <div><strong>Planned:</strong> {csvPreview.planned_iso ? new Date(csvPreview.planned_iso).toLocaleString() : '-'}</div>
                  </div>
                  {csvPreview.errors.length > 0 && (()=>{
                    const headerErrs = csvPreview.errors.filter(e => !/^Row\s+/i.test(e));
                    const rowErrs = csvPreview.errors.filter(e => /^Row\s+/i.test(e));
                    return (
                      <div style={{marginTop:8}}>
                        <div className="empty-hint" style={{color:'var(--color-error)'}}>
                          {csvPreview.errors.length} issue(s) found.
                          {rowErrs.length > 0 ? ' Fix highlighted rows below.' : ''}
                        </div>
                        {headerErrs.length > 0 && (
                          <ul style={{margin:'6px 0 0 16px', color:'var(--color-error)'}}>
                            {headerErrs.map((e, i)=>(<li key={i}>{e}</li>))}
                          </ul>
                        )}
                      </div>
                    );
                  })()}
                  <div style={{maxHeight:280, overflow:'auto', marginTop:8}}>
                    <table className="inbound-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Customer</th>
                          <th>Apartment</th>
                          {csvPreview.vendor_type==='SKU' && <th>SKU</th>}
                          {csvPreview.vendor_type==='SKU' && <th>Product</th>}
                          <th>Qty</th>
                          <th>Notes</th>
                          <th>Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.lines.map(l => (
                          <tr key={l.idx} style={l.errors.length?{background:'rgba(220, 38, 38, 0.08)'}:undefined}>
                            <td>{l.idx}</td>
                            <td>{l.customer_name || l.customer_phone}</td>
                            <td>{l.apartment || '-'}</td>
                            {csvPreview.vendor_type==='SKU' && <td>{l.product_sku || '-'}</td>}
                            {csvPreview.vendor_type==='SKU' && <td>{l.product_name || '-'}</td>}
                            <td>{csvPreview.vendor_type==='FLAT' ? 1 : (l.quantity || 1)}</td>
                            <td>{l.notes || '-'}</td>
                            <td style={{color:'var(--color-error)'}}>{l.errors.join('; ') || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="inbound-modal-footer">
              <div style={{display:'flex', gap:8}}>
                <button className="btn-outline-token" onClick={()=>setShowCsv(false)} disabled={csvBusy}>Cancel</button>
                <button className="btn-outline-token" onClick={()=>setCsvPreview(null)} disabled={csvBusy || !csvPreview}>Reset</button>
              </div>
              <button className="btn-primary-token" disabled={csvBusy || !csvPreview || csvPreview.errors.length>0} onClick={async ()=>{
                if (!csvPreview) return;
                setCsvBusy(true);
                try {
                  const payload: any = {
                    vendor_id: csvPreview.vendor.id,
                    vendor_type: csvPreview.vendor_type,
                    warehouse_id: warehouseId,
                    reference: csvPreview.reference,
                    planned_arrival: csvPreview.planned_iso,
                    notes: [csvPreview.storeName?`Store: ${csvPreview.storeName}`:null, `CSV import ${csvPreview.lines.length} line(s)`].filter(Boolean).join(' | '),
                    lines: csvPreview.lines.map(l => (
                      csvPreview.vendor_type==='FLAT' ? {
                        product_name: fixedFlatProductName,
                        quantity: 1,
                        customer_name: l.customer_name || l.customer_phone,
                        apartment: l.apartment,
                        notes: l.notes,
                      } : {
                        product_sku: l.product_sku,
                        product_name: l.product_name,
                        quantity: l.quantity || 1,
                        customer_name: l.customer_name || l.customer_phone,
                        apartment: l.apartment,
                        notes: l.notes,
                      }
                    )),
                  };
                  const rec = await createReceipt(payload);
                  notify.success(`Created receipt ${rec.code || rec.id} from CSV`);
                  await reload(); setSelected(rec); setShowCsv(false); setCsvPreview(null);
                } catch (err: any) {
                  notify.error(fmtErr(err));
                } finally { setCsvBusy(false); }
              }}>Create Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoodsIn;
