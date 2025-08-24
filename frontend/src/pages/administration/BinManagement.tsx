import React, { useEffect, useMemo, useState } from 'react';
import 'pages/administration/WarehouseManagement.css';
import 'pages/administration/CrateManagement.css';
import './BinManagement.css';
import { Warehouse, Rack } from 'types';
import { useConfig } from '../../contexts/ConfigContext';
import { getWarehouses } from 'services/warehouseService';
import { getRacksByWarehouse, createRack, updateRack, deleteRack } from 'services/rackService';
import RackCard from 'components/RackCard';
import RackDetailModal from 'components/RackDetailModal';
import RackFormModal from 'components/RackFormModal';
import EmptyState from 'components/EmptyState';
import { PlusCircle, Layers, Home, ChevronDown, ChevronRight, Search, Filter as FilterIcon, ArrowUpDown } from 'lucide-react';
import * as notify from '../../lib/notify';

// Simple UUID v4/v1 validator (case-insensitive)
const isUuid = (v: string | undefined | null): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const BinManagement: React.FC = () => {
  const { config } = useConfig();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  // Map of warehouseId -> racks
  const [racksByWarehouse, setRacksByWarehouse] = useState<Record<string, Rack[]>>({});
  const [loadingByWarehouse, setLoadingByWarehouse] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rackModalOpen, setRackModalOpen] = useState(false);
  const [editingRack, setEditingRack] = useState<Rack | null>(null);
  const [detailRack, setDetailRack] = useState<Rack | null>(null);
  const [modalWarehouseId, setModalWarehouseId] = useState<string>('');

  // Quick filters
  const [search, setSearch] = useState('');
  const [utilFilter, setUtilFilter] = useState<'all' | 'low' | 'med' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'util'>('name');
  const [rackScale, setRackScale] = useState<'sm'|'md'|'lg'|'xl'>('md');
  const [rackVariant, setRackVariant] = useState<'classic'|'pro'>('classic');

  // DnD state
  const [dragging, setDragging] = useState<{ rackId: string; warehouseId: string } | null>(null);

  // Deterministic soft accent color derived from warehouse name
  const accentColorFromName = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    // Return hsl converted to hex (approx) by constructing a temp element not needed; simpler mapping using hsl string
    return `hsl(${hue} 55% 38%)`; // moderately saturated for accent
  };

  const loadRacksFor = async (warehouseId: string) => {
    if (!isUuid(warehouseId)) {
      // skip invalid ids to prevent 422 from backend path param validation
      setRacksByWarehouse(prev => ({ ...prev, [warehouseId]: [] }));
      return;
    }
    try {
      setLoadingByWarehouse(prev => ({ ...prev, [warehouseId]: true }));
      const data = await getRacksByWarehouse(warehouseId);
      setRacksByWarehouse(prev => ({ ...prev, [warehouseId]: Array.isArray(data) ? data : [] }));
    } catch (e: any) {
      setError('Failed to load racks');
      setRacksByWarehouse(prev => ({ ...prev, [warehouseId]: [] }));
  notify.error(e?.response?.data?.detail ?? 'Failed to load racks');
    } finally {
      setLoadingByWarehouse(prev => ({ ...prev, [warehouseId]: false }));
    }
  };

  // New: Preload racks for all warehouses so counts are accurate in collapsed sections
  const preloadAllRacks = async (list: Warehouse[]) => {
    try {
      const valid = list.filter(w => isUuid(w.id));
      const entries: Array<[string, Rack[]]> = await Promise.all(
        valid.map(async (w): Promise<[string, Rack[]]> => {
          try {
            const data = await getRacksByWarehouse(w.id);
            return [w.id, Array.isArray(data) ? [...data] : []];
          } catch {
            return [w.id, []];
          }
        })
      );
      setRacksByWarehouse(prev => {
        const next = { ...prev } as Record<string, Rack[]>;
        for (const [id, racks] of entries) next[id] = racks;
        return next;
      });
    } catch {
      // ignore; individual errors handled per request
    }
  };

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setLoading(true);
        const data = await getWarehouses();
        setWarehouses(Array.isArray(data) ? data : []);
        // Initialize collapse state: expand first by default
        const initExpanded: Record<string, boolean> = {};
        if (Array.isArray(data) && data.length) {
          initExpanded[data[0].id] = true;
        }
        setExpanded(initExpanded);
        // Preload first warehouse racks for immediate viewing
        if (Array.isArray(data) && data.length) {
          if (isUuid(data[0].id)) {
            void loadRacksFor(data[0].id);
            setModalWarehouseId(data[0].id);
          }
          // Preload all racks in background so counts are shown for every warehouse
          void preloadAllRacks(data as Warehouse[]);
        }
      } catch (e: any) {
        setError('Failed to load warehouses');
  notify.error(e?.response?.data?.detail ?? 'Failed to load warehouses');
      } finally {
        setLoading(false);
      }
    };
    loadWarehouses();
  }, []);

  const toggleWarehouse = (warehouseId: string) => {
    setExpanded(prev => {
      const willOpen = !prev[warehouseId];
      const next: Record<string, boolean> = {};
      // Close all, then toggle the clicked one
      warehouses.forEach(w => { next[w.id] = false; });
      next[warehouseId] = willOpen;
      if (willOpen) {
        if (!(warehouseId in racksByWarehouse)) {
          void loadRacksFor(warehouseId);
        }
        if (isUuid(warehouseId)) setModalWarehouseId(warehouseId);
      }
      return next;
    });
    // Close any open modals/details when switching sections
    setDetailRack(null);
    setRackModalOpen(false);
    setEditingRack(null);
  };

  const openAddRack = (warehouseId?: string) => {
    setEditingRack(null);
    if (warehouseId) setModalWarehouseId(warehouseId);
    setRackModalOpen(true);
  };

  const openEditRack = (rack: Rack) => {
    setEditingRack(rack);
    setModalWarehouseId(rack.warehouse_id);
    setRackModalOpen(true);
  };

  const handleSaveRack = async (values: Omit<Rack, 'id' | 'total_bins' | 'occupied_bins'> & { id?: string, warehouse_id: string; count?: number }) => {
    try {
      setLoading(true);
      if (values.id) {
        await updateRack(values.id, {
          // name is auto-generated and read-only
          stacks: Number(values.stacks ?? 0),
          bins_per_stack: Number(values.bins_per_stack ?? 0),
          description: values.description ?? '',
          warehouse_id: values.warehouse_id,
          // include status if provided
          ...(values as any).status ? { status: (values as any).status } : {},
        });
  notify.success('Rack updated successfully');
      } else {
        const quantity = Math.min(Math.max(Number(values.count || 1), 1), 100);
        for (let i = 0; i < quantity; i++) {
          await createRack({
            warehouse_id: values.warehouse_id,
            stacks: Number(values.stacks ?? 0),
            bins_per_stack: Number(values.bins_per_stack ?? 0),
            description: values.description ?? '',
            status: (values as any).status || (config.defaultRackStatus as any) || 'active',
          });
        }
  notify.success(quantity > 1 ? `Created ${quantity} racks` : 'Rack created successfully');
      }
      await loadRacksFor(values.warehouse_id);
      setRackModalOpen(false);
      setEditingRack(null);
      setExpanded(prev => ({ ...prev, [values.warehouse_id]: true }));
      setModalWarehouseId(values.warehouse_id);
    } catch (e: any) {
      setError('Failed to save rack');
  notify.error(e?.response?.data?.detail ?? 'Failed to save rack');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRack = async (rackId: string, warehouseId: string) => {
  notify.show('Are you sure you want to delete this rack?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            setLoading(true);
            await deleteRack(rackId);
            await loadRacksFor(warehouseId);
            setDetailRack(null);
            notify.success('Rack deleted successfully');
          } catch (e: any) {
            setError('Failed to delete rack');
            notify.error(e?.response?.data?.detail ?? 'Failed to delete rack');
          } finally {
            setLoading(false);
          }
        },
      },
      cancel: {
        label: 'Cancel',
  onClick: () => notify.dismiss(),
      },
    });
  };

  const filteredSorted = (warehouseId: string) => {
    const list = racksByWarehouse[warehouseId] || [];
    const bySearch = search.trim().toLowerCase();
  const filtered = list.filter(r => {
      const util = r.total_bins > 0 ? (r.occupied_bins / r.total_bins) * 100 : 0;
      const matchesSearch = !bySearch || String(r.name).toLowerCase().includes(bySearch);
      const matchesUtil =
        utilFilter === 'all' ? true :
        utilFilter === 'low' ? util <= 50 :
        utilFilter === 'med' ? util > 50 && util <= 80 :
        util > 80;
      return matchesSearch && matchesUtil;
    });
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') return String(a.name).localeCompare(String(b.name));
      const ua = a.total_bins ? a.occupied_bins / a.total_bins : 0;
      const ub = b.total_bins ? b.occupied_bins / b.total_bins : 0;
      return ub - ua; // desc by utilization
    });
    return sorted;
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, rackId: string, warehouseId: string) => {
    setDragging({ rackId, warehouseId });
    e.dataTransfer.setData('text/plain', JSON.stringify({ rackId, warehouseId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const moveWithinWarehouse = (warehouseId: string, sourceRackId: string, targetRackId: string | null) => {
    setRacksByWarehouse(prev => {
      const current = prev[warehouseId] || [];
      const fromIdx = current.findIndex(r => r.id === sourceRackId);
      if (fromIdx < 0) return prev;
      let toIdx = current.length - 1;
      if (targetRackId) {
        const found = current.findIndex(r => r.id === targetRackId);
        if (found >= 0) toIdx = found;
      }
      const next = [...current];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return { ...prev, [warehouseId]: next };
    });
  };

  const onDropOnCard = (e: React.DragEvent<HTMLDivElement>, targetRackId: string, warehouseId: string) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('text/plain');
      const parsed = JSON.parse(data) as { rackId: string; warehouseId: string };
      if (!parsed || parsed.warehouseId !== warehouseId) return; // only reorder within same warehouse
      moveWithinWarehouse(warehouseId, parsed.rackId, targetRackId);
    } finally {
      setDragging(null);
    }
  };

  const onDropOnGridEnd = (e: React.DragEvent<HTMLDivElement>, warehouseId: string) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('text/plain');
      const parsed = JSON.parse(data) as { rackId: string; warehouseId: string };
      if (!parsed || parsed.warehouseId !== warehouseId) return;
      moveWithinWarehouse(warehouseId, parsed.rackId, null);
    } finally {
      setDragging(null);
    }
  };

  return (
    <div className="page-content">
      <div className="header">
        <div className="header-text">
          <h1>Bin Management</h1>
          <p>Visualize rack utilization and manage bins across warehouses.</p>
        </div>
        <div>
          <button className="add-warehouse-btn" onClick={() => openAddRack(modalWarehouseId)}>+ Add Rack</button>
        </div>
      </div>

      {/* Instruction Banner */}
  <div style={{fontSize:12, fontWeight:500, color:'var(--color-success-deep)', background:'var(--color-primary-soft)', border:'1px solid var(--color-success-border)', padding:'6px 12px', borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:10}}>
        <span>Click any rack visual to view detailed bin statuses. Use size controls to zoom.</span>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:11, color:'var(--color-success-deep)'}}>Size:</span>
          {(['sm','md','lg','xl'] as const).map(s => (
            <button key={s} onClick={()=>setRackScale(s)}
              className={`pill ${rackScale===s?'active':''}`}
              style={{padding:'4px 8px',fontSize:11,borderRadius:6,
                border: rackScale===s ? '1px solid var(--color-success-border)' : '1px solid var(--color-border)',
                background: rackScale===s ? 'var(--color-success)' : 'var(--color-surface)',
                color: rackScale===s ? 'var(--color-white)' : 'var(--color-text)'
              }}
            >{s.toUpperCase()}</button>
          ))}
          <span style={{fontSize:11, color:'var(--color-success-deep)', marginLeft:8}}>View:</span>
          {(['classic','pro'] as const).map(v => (
            <button key={v} onClick={()=>setRackVariant(v)}
              className={`pill ${rackVariant===v?'active':''}`}
              style={{padding:'4px 8px',fontSize:11,borderRadius:6,
                border: rackVariant===v ? '1px solid var(--color-success-border)' : '1px solid var(--color-border)',
                background: rackVariant===v ? 'var(--color-success)' : 'var(--color-surface)',
                color: rackVariant===v ? 'var(--color-white)' : 'var(--color-text)'
              }}
            >{v === 'classic' ? 'Classic' : 'Pro'}</button>
          ))}
        </div>
      </div>

      {/* Global Rack Legend */}
      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}} aria-label="Rack legend">
        <span style={{fontSize:12,fontWeight:600,color:'var(--color-text)',marginRight:4}}>Legend:</span>
  <span className="chip chip-util-low">Low Util (&lt;=50%)</span>
  <span className="chip chip-util-med">Medium (50–80%)</span>
  <span className="chip chip-util-high">High (&gt;80%)</span>
  <span className="chip chip-neutral">Empty Slot</span>
  <span className="chip" style={{background:'var(--color-primary)',color:'var(--color-white)',border:'1px solid var(--color-primary-hover)'}}>Filled Slot</span>
      </div>

      {/* Global quick filters */}
      <div className="filters-bar">
        <div className="filter-item input">
          <Search size={16} />
          <input
            placeholder="Search racks by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-item pills">
          <FilterIcon size={16} />
          <button className={`pill ${utilFilter === 'all' ? 'active' : ''}`} onClick={() => setUtilFilter('all')}>All</button>
          <button className={`pill ${utilFilter === 'low' ? 'active' : ''}`} onClick={() => setUtilFilter('low')}>≤50%</button>
          <button className={`pill ${utilFilter === 'med' ? 'active' : ''}`} onClick={() => setUtilFilter('med')}>50–80%</button>
          <button className={`pill ${utilFilter === 'high' ? 'active' : ''}`} onClick={() => setUtilFilter('high')}>≥80%</button>
        </div>
        <div className="filter-item select">
          <ArrowUpDown size={16} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="name">Sort: Name</option>
            <option value="util">Sort: Utilization</option>
          </select>
        </div>
      </div>

      {warehouses.length === 0 && (
        <EmptyState
          icon={<Home size={64} />}
          title="No Warehouses Found"
          message="Create a warehouse to begin adding racks and organizing bins."
          actionLabel="Add Warehouse"
          onAction={() => { window.location.href = '/administration/warehouse-management'; }}
        />
      )}

      {/* Warehouses accordion */}
      {warehouses.map((wh) => {
        const isOpen = !!expanded[wh.id];
        const rackList = racksByWarehouse[wh.id] || [];
        const view = filteredSorted(wh.id);
        const isLoadingWh = !!loadingByWarehouse[wh.id];
        const canAddRack = isUuid(wh.id);
        return (
          <div key={wh.id} className="card">
            <button className="card-header accordion-header" onClick={() => toggleWarehouse(wh.id)} aria-expanded={isOpen}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                Racks in {String(wh.name)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge">{rackList.length} racks</span>
                <button
                  className={`add-warehouse-btn small${!canAddRack ? ' disabled' : ''}`}
                  onClick={(e) => { e.stopPropagation(); if (canAddRack) openAddRack(wh.id); }}
                  title={canAddRack ? '+ Add Rack' : 'Cannot add rack: invalid warehouse id'}
                  disabled={!canAddRack}
                >
                  + Add Rack
                </button>
              </div>
            </button>
            {isOpen && (
              <div className="card-content with-padding">
                {isLoadingWh ? (
                  <div>Loading racks...</div>
                ) : view.length === 0 ? (
                  <EmptyState
                    icon={<Layers size={64} />}
                    title="No Racks Found"
                    message="Get started by adding your first rack for this warehouse."
                    actionLabel="Add Your First Rack"
                    onAction={() => openAddRack(wh.id)}
                  />
                ) : (
                  <div className="crate-grid" onDragOver={onDragOver} onDrop={(e) => onDropOnGridEnd(e, wh.id)}>
                    {view.map((rack) => (
                      <div
                        key={rack.id}
                        className={`dnd-wrapper ${dragging?.rackId === rack.id ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, rack.id, wh.id)}
                        onDrop={(e) => onDropOnCard(e, rack.id, wh.id)}
                        onDragOver={onDragOver}
                      >
                        <RackCard
                          rack={{ ...rack, name: String(rack.name) }}
                          warehouseName={String(wh.name)}
                          warehouseShortCode={(wh as any).shortCode || undefined}
                          accentColor={accentColorFromName(String(wh.name))}
                          onDetails={() => setDetailRack(rack)}
                          scale={rackScale}
                          variant={rackVariant}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {detailRack && (
        <RackDetailModal
          rack={detailRack}
          onClose={() => setDetailRack(null)}
          onEditRack={() => openEditRack(detailRack)}
          onDeleteRack={() => handleDeleteRack(detailRack.id, detailRack.warehouse_id)}
        />
      )}

      {rackModalOpen && (
        <RackFormModal
          warehouseId={modalWarehouseId || ''}
          allWarehouses={warehouses}
          rack={editingRack ?? undefined}
          onCancel={() => { setRackModalOpen(false); setEditingRack(null); }}
          onSave={handleSaveRack}
        />
      )}
    </div>
  );
};

export default BinManagement;
