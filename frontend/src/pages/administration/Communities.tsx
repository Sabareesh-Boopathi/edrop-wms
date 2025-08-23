import React, { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Building2, Users, MapPin, Building, Search, PlusCircle,
  Edit, Trash2, Mail, Phone, ChevronLeft, ChevronRight, X 
} from 'lucide-react';
import * as notify from '../../lib/notify';
import { listCommunities, createCommunity, updateCommunity, deleteCommunity, type Community } from '../../services/communityService';
import TableCard from '../../components/table/TableCard';
import KpiCard from '../../components/KpiCard';
import EmptyState from '../../components/EmptyState';
import LocationPicker from '../../components/LocationPicker';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import '../../pages/inbound/Inbound.css';
import './Communities.css';

// Schema following project patterns
const Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  landmark: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  rwa_email: z.string().email().optional().or(z.literal('')),
  fm_number: z.string().optional(),
  blocks: z.array(z.string()).optional(),
  community_type: z.enum(['COMMUNITY', 'INDIVIDUAL']).default('COMMUNITY'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  notes: z.string().optional(),
});

type Schema = z.infer<typeof Schema>;

// Modal component following project patterns
function CommunityModal({ 
  initial, 
  onClose, 
  onSave 
}: { 
  initial: Community | null;
  onClose: () => void;
  onSave: (data: Schema) => void;
}) {
  const form = useForm<Schema>({
    resolver: zodResolver(Schema),
    defaultValues: initial ? {
      name: initial.name,
      code: initial.code || '',
      address_line1: initial.address_line1,
      address_line2: initial.address_line2 || '',
      city: initial.city,
      state: initial.state,
      pincode: initial.pincode,
      landmark: initial.landmark || '',
      rwa_email: initial.rwa_email || '',
      fm_number: initial.fm_number || '',
  blocks: initial.blocks || [],
      status: initial.status,
      community_type: initial.community_type || 'COMMUNITY',
      notes: initial.notes || '',
    } : {
      name: '',
      code: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      rwa_email: '',
      fm_number: '',
      blocks: [],
      community_type: 'COMMUNITY' as const,
      status: 'ACTIVE' as const,
      notes: '',
    }
  });

  const [blocks, setBlocks] = useState<string[]>(
    Array.isArray(initial?.blocks)
      ? (initial!.blocks as string[])
      : (typeof (initial as any)?.blocks === 'string' && (initial as any).blocks
          ? String((initial as any).blocks).split(',').map((b: string) => b.trim())
          : [])
  );
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(
    initial?.latitude && initial?.longitude 
      ? { lat: initial.latitude, lng: initial.longitude }
      : null
  );

  const handleSubmit = (data: Schema) => {
    const finalData = {
      ...data,
      blocks: blocks.map(b => b.trim()).filter(Boolean),
      latitude: location?.lat,
      longitude: location?.lng,
    };
    onSave(finalData);
  };

  const addBlock = () => {
    setBlocks([...blocks, '']);
  };

  const updateBlock = (index: number, value: string) => {
    const newBlocks = [...blocks];
    newBlocks[index] = value;
    setBlocks(newBlocks);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  return (
    <div className="inbound-modal-overlay" onClick={onClose}>
      <div className="inbound-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:900}}>
        <div className="inbound-modal-header">
          <h2 className="inbound-modal-title">{initial ? 'Edit Community' : 'Add Community'}</h2>
          <div style={{display:'flex', gap:8}}>
            <button type="button" className="btn-outline-token" onClick={onClose}>Close</button>
          </div>
        </div>
        
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="inbound-modal-body">
            <div className="form-row">
              <div className="form-field">
                <label>Community Name <span style={{color:'var(--color-error)'}}>*</span></label>
                <input {...form.register('name')} placeholder="Green Valley Apartments" />
                {form.formState.errors.name && (
                  <div className="error-text">{form.formState.errors.name.message}</div>
                )}
              </div>
              <div className="form-field">
                <label>Community Code <span style={{color:'var(--color-error)'}}>*</span></label>
                <input {...form.register('code')} placeholder="GVA" />
                {form.formState.errors.code && (
                  <div className="error-text">{form.formState.errors.code.message}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-field" style={{flex:'1 1 100%'}}>
                <label>Address Line 1 <span style={{color:'var(--color-error)'}}>*</span></label>
                <input {...form.register('address_line1')} placeholder="123 Main Street" />
                {form.formState.errors.address_line1 && (
                  <div className="error-text">{form.formState.errors.address_line1.message}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-field" style={{flex:'1 1 100%'}}>
                <label>Address Line 2</label>
                <input {...form.register('address_line2')} placeholder="Near Central Park" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>City <span style={{color:'var(--color-error)'}}>*</span></label>
                <input {...form.register('city')} placeholder="Mumbai" />
                {form.formState.errors.city && (
                  <div className="error-text">{form.formState.errors.city.message}</div>
                )}
              </div>
              <div className="form-field">
                <label>State <span style={{color:'var(--color-error)'}}>*</span></label>
                <input {...form.register('state')} placeholder="Maharashtra" />
                {form.formState.errors.state && (
                  <div className="error-text">{form.formState.errors.state.message}</div>
                )}
              </div>
              <div className="form-field">
                <label>Pincode <span style={{color:'var(--color-error)'}}>*</span></label>
                <input {...form.register('pincode')} placeholder="400001" />
                {form.formState.errors.pincode && (
                  <div className="error-text">{form.formState.errors.pincode.message}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Landmark</label>
                <input {...form.register('landmark')} placeholder="Near Metro Station" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field" style={{flex:'1 1 100%'}}>
                <label>Location Coordinates</label>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <input type="number" placeholder="Latitude" value={location?.lat || ''} onChange={(e) => setLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0, lng: prev?.lng || 0 }))} />
                  <input type="number" placeholder="Longitude" value={location?.lng || ''} onChange={(e) => setLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0, lat: prev?.lat || 0 }))} />
                  <button type="button" onClick={() => setShowLocationPicker(true)} className="btn-outline-token" style={{whiteSpace:'nowrap'}}>
                    <MapPin size={16} /> Pick from Map
                  </button>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>RWA Email</label>
                <input type="email" {...form.register('rwa_email')} placeholder="rwa@greenvalley.com" />
                {form.formState.errors.rwa_email && (
                  <div className="error-text">{form.formState.errors.rwa_email.message}</div>
                )}
              </div>
              <div className="form-field">
                <label>Facility Manager Number</label>
                <input {...form.register('fm_number')} placeholder="+91 9876543210" />
              </div>
              <div className="form-field" style={{minWidth:160}}>
                <label>Status</label>
                <select {...form.register('status')}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field" style={{flex:1}}>
                <label>Notes</label>
                <textarea {...form.register('notes')} placeholder="Additional notes about the community" rows={3} />
              </div>
            </div>

            <div className="form-row" style={{flexDirection:'column', alignItems:'stretch'}}>
              <div className="form-field" style={{flex:1}}>
                <label>Blocks/Towers</label>
                <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:8}}>
                  {blocks.map((b, i) => (
                    <span key={i} style={{display:'inline-flex', alignItems:'center', gap:6, padding:'4px 8px', borderRadius:999, background:'var(--color-surface-alt)', border:'1px solid var(--color-border)'}}>
                      {b || `Block ${i+1}`}
                      <button type="button" className="icon-btn" title="Remove" onClick={() => removeBlock(i)} style={{color:'var(--color-error)'}}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  <input
                    placeholder="Add a block (e.g., A, Tower 1)"
                    onKeyDown={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = target.value.trim();
                        if (val) { setBlocks(prev => [...prev, val]); target.value = ''; }
                      }
                    }}
                  />
                  <button type="button" className="btn-outline-token" onClick={() => {
                    const el = (document.activeElement as HTMLInputElement);
                    if (el && el.tagName === 'INPUT') {
                      const v = el.value.trim();
                      if (v) { setBlocks(prev => [...prev, v]); el.value = ''; }
                    }
                  }}>
                    <PlusCircle size={16} /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="inbound-modal-footer">
            <button type="button" className="btn-outline-token" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary-token">{initial ? 'Update' : 'Create'} Community</button>
          </div>
        </form>
      </div>
      
      {showLocationPicker && (
        <LocationPicker
          onClose={() => setShowLocationPicker(false)}
          onLocationSelect={(lat, lng) => {
            setLocation({ lat, lng });
            setShowLocationPicker(false);
          }}
          title="Select Community Location"
          initialPosition={location ? [location.lat, location.lng] : [19.0760, 72.8777]}
        />
      )}
    </div>
  );
}

export default function Communities() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const data = await listCommunities();
      setCommunities(data);
    } catch (e: any) {
      notify.error(e?.response?.data?.detail || 'Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  // Filtering and pagination following project patterns
  const filteredCommunities = useMemo(() => {
    return communities.filter(community => {
      const matchesSearch = !search || 
        community.name.toLowerCase().includes(search.toLowerCase()) ||
        community.code?.toLowerCase().includes(search.toLowerCase()) ||
        community.city?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || community.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [communities, search, statusFilter]);

  const pagedCommunities = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCommunities.slice(start, start + pageSize);
  }, [filteredCommunities, page, pageSize]);

  const pageCount = Math.ceil(filteredCommunities.length / pageSize);

  // KPIs following existing pattern
  const kpis = useMemo(() => {
    const activeCommunities = communities.filter(c => c.status === 'ACTIVE');
    const citiesCount = new Set(communities.map(c => c.city).filter(Boolean)).size;
  const communitiesWithBlocks = communities.filter(c => Array.isArray(c.blocks) ? c.blocks.length > 0 : !!c.blocks).length;

    return [
      { title: 'Total Communities', value: communities.length.toString(), icon: <Building2 size={24} />, variant: 'indigo' as const },
      { title: 'Active Communities', value: activeCommunities.length.toString(), icon: <Users size={24} />, variant: 'emerald' as const },
      { title: 'Cities Covered', value: citiesCount.toString(), icon: <MapPin size={24} />, variant: 'cyan' as const },
      { title: 'With Blocks/Towers', value: communitiesWithBlocks.toString(), icon: <Building size={24} />, variant: 'orange' as const },
    ];
  }, [communities]);

  const handleCreateCommunity = () => {
    setEditingCommunity(null);
    setShowModal(true);
  };

  const handleEditCommunity = (community: Community) => {
    setEditingCommunity(community);
    setShowModal(true);
  };

  const getErrorMessage = (error: any): string => {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) {
      const msgs = detail.map((d: any) => d?.msg || d?.message || (typeof d === 'string' ? d : JSON.stringify(d)));
      return msgs.join('; ');
    }
    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object') return detail.message || JSON.stringify(detail);
    return error?.message || 'An error occurred';
  };

  const handleDeleteCommunity = async (community: Community) => {
    notify.show(`Delete community "${community.name}"?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteCommunity(community.id);
            notify.success('Community deleted successfully');
            await loadCommunities();
          } catch (e: any) {
            notify.error(getErrorMessage(e) || 'Failed to delete community');
          }
        }
      },
      cancel: { label: 'Cancel', onClick: () => notify.dismiss?.() }
    });
  };

  const handleSaveCommunity = async (data: Schema) => {
    try {
      if (editingCommunity) {
        await updateCommunity(editingCommunity.id, data);
        notify.success('Community updated successfully');
      } else {
        await createCommunity(data);
        notify.success('Community created successfully');
      }
      setShowModal(false);
      await loadCommunities();
    } catch (e: any) {
      notify.error(e?.response?.data?.detail || 'Failed to save community');
    }
  };

  return (
    <div className="inbound-page">
      <header className="inbound-header">
        <div>
          <h1>Communities Management</h1>
          <p>Manage residential communities and societies.</p>
        </div>
        <Button onClick={handleCreateCommunity} className="btn-primary-token">
          <PlusCircle className="icon" />
          Add Community
        </Button>
      </header>

      <section className="inbound-kpis">
        {kpis.map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </section>

      <TableCard
        variant="inbound"
        title="Communities"
        centerSearch
        actions={(
          <Button className="btn-primary-token" onClick={handleCreateCommunity}>
            <PlusCircle className="icon" />
            Add Community
          </Button>
        )}
        search={(
          <div style={{ flex: '1 1 300px', maxWidth: 420 }}>
            <div className="form-field" style={{ margin: 0 }}>
              <label>Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--color-text-subtle)' }} />
                <input
                  style={{ paddingLeft: 30 }}
                  placeholder="Name / Code / City"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>
          </div>
        )}
        filters={(
          <div className="form-field" style={{ minWidth: 160, width: 'auto', flex: '0 0 auto' }}>
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}>
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        )}
        footer={(
          <>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
              {filteredCommunities.length ? `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, filteredCommunities.length)} of ${filteredCommunities.length}` : '—'}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                className="btn-outline-token"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
                title="Previous"
                style={{ width: 'var(--control-height-sm)', height: 'var(--control-height-sm)', padding: 0, display: 'grid', placeItems: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ minWidth: 32, textAlign: 'center' }}>{page}</span>
              <button
                type="button"
                className="btn-outline-token"
                onClick={() => setPage((p) => (p * pageSize < filteredCommunities.length ? p + 1 : p))}
                disabled={page * pageSize >= filteredCommunities.length}
                aria-label="Next page"
                title="Next"
                style={{ width: 'var(--control-height-sm)', height: 'var(--control-height-sm)', padding: 0, display: 'grid', placeItems: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ height: 'var(--control-height-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', background: 'var(--color-surface)', padding: 'var(--control-padding-y-sm) var(--control-padding-x-sm)', fontSize: 'var(--font-size-sm)' }}
              >
                {[10, 25, 50, 100].map((s) => <option key={s} value={s}>{s}/page</option>)}
              </select>
            </div>
          </>
        )}
      >
        {loading ? (
          <div className="empty-hint" style={{ padding: 16 }}>Loading communities…</div>
        ) : filteredCommunities.length === 0 ? (
          <EmptyState 
            icon={<Building2 size={64} />}
            title="No Communities Found" 
            message="Create a community to start managing residents." 
            actionLabel="Add Community" 
            onAction={handleCreateCommunity} 
          />
        ) : (
          <Table className="communities-table table-compact">
            <TableHeader>
              <TableRow>
                <TableHead>Community</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCommunities.map(community => (
                <TableRow key={community.id}>
                  <TableCell>
                    <div className="name-cell">
                      <div className="name-avatar" aria-hidden>
                        <Building size={16} />
                      </div>
                      <div className="name-text">
                        <div className="name-primary">{community.name}</div>
                        {community.address_line1 && (
                          <div className="name-secondary" title={community.address_line1}>{community.address_line1}</div>
                        )}
                        {community.blocks && (
                          <div className="meta-chips">
                            <span
                              className="chip chip-muted"
                              title={Array.isArray(community.blocks) ? community.blocks.join(', ') : String(community.blocks)}
                            >
                              {Array.isArray(community.blocks) ? `${community.blocks.length} block${community.blocks.length===1?'':'s'}` : 'Blocks'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="community-code">{community.code}</code>
                  </TableCell>
                  <TableCell>
                    <div className="location-info">
                      <div style={{display:'inline-flex', alignItems:'center', gap:6}}>
                        <MapPin size={14} style={{opacity:.7}} />
                        <span>{community.city}</span>
                      </div>
                      {(community.state || community.pincode) && (
                        <div className="text-soft">{community.state}{community.pincode ? ` ${community.pincode}` : ''}</div>
                      )}
                      {community.landmark && <div className="text-soft" title={community.landmark}>{community.landmark}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(community.rwa_email || community.fm_number) ? (
                      <div className="contact-info">
                        {community.rwa_email && (
                          <div>
                            <Mail size={14} />
                            <a href={`mailto:${community.rwa_email}`} title={community.rwa_email}>{community.rwa_email}</a>
                          </div>
                        )}
                        {community.fm_number && (
                          <div>
                            <Phone size={14} />
                            <a href={`tel:${community.fm_number}`} title={community.fm_number}>{community.fm_number}</a>
                          </div>
                        )}
                      </div>
                    ) : <span style={{color:'var(--color-text-muted)'}}>—</span>}
                  </TableCell>
                  <TableCell>
                    <span className={`status-chip status-${community.status.toLowerCase()}`}>
                      {community.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="row-actions" style={{display:'inline-flex',gap:10}}>
                      <button type="button" className="action-link success" onClick={() => handleEditCommunity(community)}>
                        <Edit size={16}/> Edit
                      </button>
                      <button type="button" className="action-link danger" onClick={() => handleDeleteCommunity(community)}>
                        <Trash2 size={16}/> Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>

      {showModal && (
        <CommunityModal 
          initial={editingCommunity}
          onClose={() => setShowModal(false)}
          onSave={handleSaveCommunity}
        />
      )}
    </div>
  );
};
