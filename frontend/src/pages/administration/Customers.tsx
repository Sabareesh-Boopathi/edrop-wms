import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import TableCard from '../../components/table/TableCard';
import KpiCard from '../../components/KpiCard';
import EmptyState from '../../components/EmptyState';
import { PlusCircle, Edit, Trash2, Users, Search, ChevronLeft, ChevronRight, MapPin, Building } from 'lucide-react';
import * as notify from '../../lib/notify';
import * as customerService from '../../services/customerService';
import * as communityService from '../../services/communityService';
import * as addressService from '../../services/addressService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import LocationPicker from '../../components/LocationPicker';
import type { Customer } from '../../services/customerService';
import type { Community } from '../../services/communityService';
import type { Address } from '../../services/addressService';
import '../../pages/inbound/Inbound.css';
import './Customers.css';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone_number: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email'),
  // Location - Either community OR address (not both)
  location_type: z.enum(['COMMUNITY', 'INDIVIDUAL']).optional(),
  community_id: z.string().optional(),
  block: z.string().optional(),
  flat_number: z.string().optional(),
  // Address fields for individuals
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  landmark: z.string().optional(),
  door_number: z.string().optional(),
  latitude: z.number().min(-90, "Must be >= -90").max(90, "Must be <= 90").optional().nullable(),
  longitude: z.number().min(-180, "Must be >= -180").max(180, "Must be <= 180").optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  notes: z.string().optional(),
}).refine((data) => {
  if (!data.location_type) return false;
  if (data.location_type === 'COMMUNITY') {
    return !!data.community_id;
  }
  return !!(data.address_line1 && data.city && data.state && data.pincode);
}, {
  message: 'Please select Residence Type and fill required fields',
  path: ['location_type']
});

type Schema = z.infer<typeof schema>;

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedContacts, setRevealedContacts] = useState<Record<string, { phone_number?: string; email?: string }>>({});
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  // Reveal justification modal state
  const [revealTarget, setRevealTarget] = useState<Customer | null>(null);
  const [revealReason, setRevealReason] = useState('');
  const [revealSaving, setRevealSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [communityFilter, setCommunityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersData, communitiesData, addressesData] = await Promise.all([
        customerService.listCustomers(),
        communityService.listCommunities(),
        addressService.listAddresses()
      ]);
      setCustomers(customersData);
      setCommunities(communitiesData);
      setAddresses(addressesData);
    } catch (e: any) {
      notify.error(e?.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get community details for a customer
  const getCustomerCommunity = (customer: Customer) => {
    return communities.find(c => c.id === customer.community_id);
  };

  // Get address details for a customer
  const getCustomerAddress = (customer: Customer) => {
    return addresses.find(a => a.id === customer.address_id);
  };

  // Get location info for display
  const getCustomerLocation = (customer: Customer) => {
    if (customer.community_id) {
      const community = getCustomerCommunity(customer);
      if (community) {
        const location = `${community.name}, ${community.city}`;
  // Show block/tower label as-is (no 'Block ' prefix) per request
  const details = customer.block ? `${customer.block}` : '';
        const flatInfo = customer.flat_number ? `Flat ${customer.flat_number}` : '';
        return {
          primary: location,
          secondary: [details, flatInfo].filter(Boolean).join(', ') || 'Community'
        };
      }
    } else if (customer.address_id) {
      const address = getCustomerAddress(customer);
      if (address) {
        return {
          primary: `${address.street_address}, ${address.city}`,
          secondary: `${address.state} ${address.pincode}`
        };
      }
    }
    return { primary: 'No address', secondary: '' };
  };

  // Filtering and pagination
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const community = getCustomerCommunity(customer);
      const matchesSearch = !search || 
        (customer.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (customer.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (customer.phone_number || '').includes(search) ||
        (community?.name || '').toLowerCase().includes(search.toLowerCase());

      const matchesCommunity = !communityFilter || customer.community_id === communityFilter;
      const status = (customer.status || 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
      const matchesStatus = statusFilter === 'ALL' || statusFilter === status;

      return matchesSearch && matchesCommunity && matchesStatus;
    });
  }, [customers, search, communityFilter, communities, statusFilter]);

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, page, pageSize]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);

  // KPIs
  const kpis = useMemo(() => [
    {
      title: 'Total Customers',
      value: customers.length.toString(),
      icon: <Users size={24} />,
      variant: 'indigo' as const,
    },
    {
      title: 'Communities Served',
      value: new Set(customers.map(c => c.community_id)).size.toString(),
      icon: <MapPin size={24} />,
      variant: 'emerald' as const,
    }
  ], [customers]);

  const handleCreateCustomer = () => {
    setEditing(null);
    setShowModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditing(customer);
    setShowModal(true);
  };

  const openRevealModal = (customer: Customer) => {
    setRevealTarget(customer);
    setRevealReason('');
  };

  const submitReveal = async () => {
    if (!revealTarget) return;
    const reason = revealReason.trim();
    if (reason.length < 5) {
      notify.error('Please provide a valid justification (min 5 chars).');
      return;
    }
    try {
      setRevealSaving(true);
      const res = await customerService.unmaskCustomer(revealTarget.id, reason);
      setRevealedContacts((prev) => ({ ...prev, [revealTarget.id]: { phone_number: res.phone_number, email: res.email } }));
      // No success toast per request; close modal silently
      setRevealTarget(null);
      setRevealReason('');
    } catch (e: any) {
      notify.error(e?.response?.data?.detail || 'Failed to reveal contact');
    } finally {
      setRevealSaving(false);
    }
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

  const handleDeleteCustomer = async (customer: Customer) => {
    notify.show(`Delete customer "${customer.name}"?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await customerService.deleteCustomer(customer.id);
            notify.success('Customer deleted successfully');
            await loadData();
          } catch (e: any) {
            notify.error(getErrorMessage(e) || 'Failed to delete customer');
          }
        }
      },
      cancel: { label: 'Cancel', onClick: () => notify.dismiss?.() }
    });
  };

  const handleSaveCustomer = async (data: Schema) => {
    try {
      // When residence type is Individual, create/update Address then link via address_id
      if (data.location_type === 'INDIVIDUAL') {
        const addressPayload = {
          street_address: data.address_line1 || '',
          area: data.address_line2 || undefined,
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          country: 'India',
          landmark: data.landmark || undefined,
          door_number: data.door_number || undefined,
          latitude: data.latitude ?? undefined,
          longitude: data.longitude ?? undefined,
        } as const;

        let addressId = editing?.address_id;
        if (editing && addressId) {
          await addressService.updateAddress(addressId, addressPayload as any);
        } else {
          const addr = await addressService.createAddress(addressPayload as any);
          addressId = addr.id;
        }

        if (editing) {
          await customerService.updateCustomer(editing.id, {
            name: data.name,
            phone_number: data.phone_number,
            email: data.email,
            address_id: addressId,
            community_id: undefined,
            block: undefined,
            flat_number: data.flat_number || undefined,
            status: data.status,
            notes: data.notes,
          });
          notify.success('Customer updated successfully');
        } else {
          await customerService.createCustomer({
            name: data.name,
            phone_number: data.phone_number,
            email: data.email,
            address_id: addressId!,
            flat_number: data.flat_number || undefined,
            status: data.status,
            notes: data.notes,
          } as any);
          notify.success('Customer created successfully');
        }
      } else if (data.location_type === 'COMMUNITY') {
        if (editing) {
          await customerService.updateCustomer(editing.id, {
            name: data.name,
            phone_number: data.phone_number,
            email: data.email,
            community_id: data.community_id,
            block: data.block,
            flat_number: data.flat_number,
            address_id: undefined, // ensure address cleared if switching types
            status: data.status,
            notes: data.notes,
          });
          notify.success('Customer updated successfully');
        } else {
          await customerService.createCustomer({
            name: data.name,
            phone_number: data.phone_number,
            email: data.email,
            community_id: data.community_id!,
            block: data.block,
            flat_number: data.flat_number,
            status: data.status,
            notes: data.notes,
          } as any);
          notify.success('Customer created successfully');
        }
      } else {
        throw new Error('Please select Residence Type');
      }

      setShowModal(false);
      await loadData();
    } catch (e: any) {
      notify.error(getErrorMessage(e));
    }
  };

  return (
    <div className="inbound-page">
      <header className="inbound-header">
        <div>
          <h1>Customer Management</h1>
          <p>Manage customer profiles and their residence details.</p>
        </div>
        <Button onClick={handleCreateCustomer} className="btn-primary-token">
          <PlusCircle className="icon" />
          Add Customer
        </Button>
      </header>

      <section className="inbound-kpis">
        {kpis.map((k, i) => (
          <KpiCard key={i} {...k} />
        ))}
      </section>

      <TableCard
        variant="inbound"
        title="Customers Directory"
        centerSearch
        actions={(
          <Button className="btn-primary-token" onClick={handleCreateCustomer}>
            <PlusCircle className="icon" />
            Add Customer
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
                  placeholder="Name / Email / Phone / Community"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>
          </div>
        )}
        filters={(
          <>
            <div className="form-field" style={{ minWidth: 220, width: 'auto', flex: '0 0 auto' }}>
              <label>Community</label>
              <select value={communityFilter} onChange={(e) => { setCommunityFilter(e.target.value); setPage(1); }}>
                <option value="">All</option>
                {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ minWidth: 160, width: 'auto', flex: '0 0 auto' }}>
              <label>Status</label>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}>
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </>
        )}
        footer={(
          <>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
              {filteredCustomers.length ? `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, filteredCustomers.length)} of ${filteredCustomers.length}` : '—'}
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
                onClick={() => setPage((p) => (p * pageSize < filteredCustomers.length ? p + 1 : p))}
                disabled={page * pageSize >= filteredCustomers.length}
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
          <div className="empty-hint" style={{ padding: 16 }}>Loading customers…</div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState 
            title="No Customers" 
            message="Create a customer to start managing accounts." 
            actionLabel="Add Customer" 
            onAction={handleCreateCustomer} 
          />
        ) : (
          <Table className="customers-table table-compact">
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Residence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map(customer => {
                  const community = getCustomerCommunity(customer);
                  const location = getCustomerLocation(customer);
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="name-cell">
                          <div className="name-avatar" aria-hidden>
                            <Users size={16} />
                          </div>
                          <div className="name-text">
                            <div className="name-primary">{customer.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(customer.phone_number || customer.email) ? (
                          <div>
                            <div>
                              {(revealedContacts[customer.id]?.phone_number || customer.phone_number) && (
                                <div>{revealedContacts[customer.id]?.phone_number || customer.phone_number}</div>
                              )}
                              {(revealedContacts[customer.id]?.email || customer.email) && (
                                <div style={{color:'var(--color-text-soft)'}}>{revealedContacts[customer.id]?.email || customer.email}</div>
                              )}
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <button type="button" className="action-link" onClick={() => openRevealModal(customer)}>
                                Reveal with justification
                              </button>
                            </div>
                          </div>
                        ) : <span style={{color:'var(--color-text-muted)'}}>—</span>}
                      </TableCell>
                      <TableCell>
                        {community ? (
                          <div className="name-cell">
                            <div className="name-avatar" aria-hidden>
                              <Building size={16} />
                            </div>
                            <div className="name-text">
                              <div className="name-primary">{community.name}</div>
                              {(community.city || community.state) && (
                                <div className="name-secondary">{community.city}{community.state ? `, ${community.state}` : ''}</div>
                              )}
                              <div className="meta-chips">
                                {customer.block && (
                                  <span className="chip chip-muted" title={`Block/Tower`}>
                                    {customer.block}
                                  </span>
                                )}
                                {customer.flat_number && (
                                  <span className="chip chip-muted" title="Flat">
                                    {`Flat ${customer.flat_number}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="name-cell">
                            <div className="name-avatar" aria-hidden>
                              <MapPin size={16} />
                            </div>
                            <div className="name-text">
                              <div className="name-primary">{location.primary}</div>
                              {location.secondary && <div className="name-secondary">{location.secondary}</div>}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`status-chip status-${(customer.status || 'ACTIVE').toLowerCase()}`}>{customer.status || 'ACTIVE'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="row-actions" style={{display:'inline-flex',gap:10}}>
                          <button type="button" className="action-link success" onClick={() => handleEditCustomer(customer)}>
                            <Edit size={16}/> Edit
                          </button>
                          <button type="button" className="action-link danger" onClick={() => handleDeleteCustomer(customer)}>
                            <Trash2 size={16}/> Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        )}
      </TableCard>

      {showModal && (
        <CustomerModal 
          initial={editing}
          communities={communities}
          addresses={addresses}
          onClose={() => setShowModal(false)}
          onSave={handleSaveCustomer}
        />
      )}

      {/* Reveal Justification Modal */}
      {revealTarget && (
        <div className="inbound-modal-overlay" onClick={() => setRevealTarget(null)}>
          <div className="inbound-modal" onClick={e=>e.stopPropagation()}>
            <div className="inbound-modal-header">
              <h3 className="inbound-modal-title">Reveal contact for “{revealTarget.name}”</h3>
              <button type="button" onClick={() => setRevealTarget(null)} className="btn-outline-token">Close</button>
            </div>
            <div className="inbound-modal-body">
              <div className="form-row">
                <div className="form-field" style={{width:'100%'}}>
                  <label htmlFor="cust_reveal_reason">Justification</label>
                  <textarea id="cust_reveal_reason" value={revealReason} onChange={(e)=>setRevealReason(e.target.value)} placeholder="Enter your reason (min 5 characters)" rows={4} />
                </div>
              </div>
            </div>
            <div className="inbound-modal-footer">
              <button type="button" onClick={() => setRevealTarget(null)} className="btn-outline-token">Cancel</button>
              <button type="button" onClick={submitReveal} className="btn-primary-token" disabled={revealSaving}>{revealSaving ? 'Revealing…' : 'Reveal Now'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomerModal: React.FC<{ 
  initial: Customer | null; 
  communities: Community[];
  addresses: Address[];
  onClose: () => void; 
  onSave: (data: Schema) => void 
}> = ({ initial, communities, addresses, onClose, onSave }) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const isEdit = !!initial;

  // Compute sensible defaults for create/edit, including address lat/lng when editing an Individual
  const defaults = useMemo<Partial<Schema>>(() => {
    if (!initial) {
      return {
        name: '',
        phone_number: '',
        email: '',
        // Start without a residence type; user selects and fields show accordingly
        community_id: '',
        block: '',
        flat_number: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        door_number: '',
        status: 'ACTIVE',
        notes: '',
      };
    }

    const base: Partial<Schema> = {
      name: initial.name || '',
      phone_number: initial.phone_number || '',
      email: initial.email || '',
      location_type: initial.community_id ? 'COMMUNITY' : 'INDIVIDUAL',
      community_id: initial.community_id || '',
      block: initial.block || '',
      flat_number: initial.flat_number || '',
      status: initial.status || 'ACTIVE',
      notes: initial.notes || '',
    };

    if (initial.address_id && !initial.community_id) {
      const addr = addresses.find(a => a.id === initial.address_id);
      return {
        ...base,
        address_line1: addr?.street_address || '',
        address_line2: addr?.area || '',
        city: addr?.city || '',
        state: addr?.state || '',
        pincode: addr?.pincode || '',
        landmark: addr?.landmark || '',
        door_number: addr?.door_number || '',
        latitude: (addr?.latitude ?? undefined) as any,
        longitude: (addr?.longitude ?? undefined) as any,
      };
    }

    // Community-based customers: pull lat/lng from community (if available) for reference
    const comm = initial.community_id ? communities.find(c => c.id === initial.community_id) : undefined;
    return {
      ...base,
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      door_number: '',
      latitude: (comm?.latitude ?? undefined) as any,
      longitude: (comm?.longitude ?? undefined) as any,
    };
  }, [initial, addresses, communities]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, control, setValue, watch, reset } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: defaults as Schema,
  });

  // Ensure form picks up new defaults when editing/props change
  useEffect(() => {
    reset(defaults as Schema);
  }, [defaults, reset]);

  const locationType = watch('location_type');
  const latitude = watch('latitude');
  const longitude = watch('longitude');

  // Community typeahead state
  const [communityQuery, setCommunityQuery] = useState('');
  const [communitySuggestions, setCommunitySuggestions] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  // Prefill community selection on edit
  useEffect(() => {
    if (initial?.community_id && communities?.length) {
      const found = communities.find(c => c.id === initial.community_id) || null;
      setSelectedCommunity(found);
      if (found) {
        setCommunityQuery(found.name);
        setValue('community_id', found.id, { shouldValidate: true, shouldDirty: false });
      }
    }
  }, [initial?.community_id, communities, setValue]);

  // Compute suggestions when typing
  useEffect(() => {
    const q = communityQuery.trim().toLowerCase();
    if (!q || q.length < 2) { setCommunitySuggestions([]); return; }
    const matches = (communities || [])
      .filter(c => (c.name || '').toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q))
      .slice(0, 8);
    setCommunitySuggestions(matches);
  }, [communityQuery, communities]);

  // When community selection changes by user, clear block; retain prefilled block when editing same community
  useEffect(() => {
    if (selectedCommunity?.id && selectedCommunity.id !== initial?.community_id) {
      setValue('block', '', { shouldValidate: true });
    }
  }, [selectedCommunity?.id, initial?.community_id, setValue]);

  // Clear mutually exclusive fields when switching location type
  useEffect(() => {
    if (locationType === 'COMMUNITY') {
      // Clear address fields
      setValue('address_line1', '', { shouldValidate: false });
      setValue('address_line2', '', { shouldValidate: false });
      setValue('city', '', { shouldValidate: false });
      setValue('state', '', { shouldValidate: false });
      setValue('pincode', '', { shouldValidate: false });
      setValue('landmark', '', { shouldValidate: false });
      setValue('door_number', '', { shouldValidate: false });
    } else if (locationType === 'INDIVIDUAL') {
      // Clear community fields
      setSelectedCommunity(null);
      setCommunityQuery('');
      setValue('community_id', '', { shouldValidate: true });
      setValue('block', '', { shouldValidate: false });
    }
  }, [locationType, setValue]);

  // Derive list of blocks from selected community (fallback by id)
  const communityBlocks: string[] = React.useMemo(() => {
    const src = selectedCommunity || communities.find(c => c.id === watch('community_id')) || null;
    let blocks: any = (src as any)?.blocks || [];
    if (typeof blocks === 'string') {
      blocks = String(blocks).split(',').map((b: string) => b.trim()).filter(Boolean);
    }
    return Array.isArray(blocks) ? blocks.filter(Boolean) : [];
  }, [selectedCommunity, communities, watch('community_id')]);

  const InputField = ({ name, label, type = 'text', register, error, placeholder, disabled }: { name: keyof Schema, label: string, type?: string, register: any, error?: { message?: string }, placeholder?: string, disabled?: boolean }) => (
    <div className="form-field">
      <label htmlFor={String(name)}>{label}</label>
      <input
        type={type}
        id={String(name)}
        {...register(name as any, { valueAsNumber: type === 'number' })}
        placeholder={placeholder}
        className={error ? 'error' : ''}
        disabled={disabled}
      />
      {error && <div className="error-text">{error.message}</div>}
    </div>
  );

  return (
    <>
      <div className="inbound-modal-overlay" onClick={onClose}>
        <div className="inbound-modal" onClick={e=>e.stopPropagation()}>
          <div className="inbound-modal-header">
            <h3 className="inbound-modal-title">{isEdit ? 'Edit Customer' : 'Add Customer'}</h3>
            <div style={{display:'flex', gap:8}}>
              <button type="button" onClick={onClose} className="btn-outline-token">Close</button>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSave)} noValidate>
            <div className="inbound-modal-body">
              <div className="form-row">
                <InputField name="name" label="Full Name" register={register} error={errors.name} placeholder="e.g., John Doe" />
                <InputField name="phone_number" label="Phone Number" register={register} error={errors.phone_number} placeholder="e.g., +91 9876543210" />
                <InputField name="email" label="Email" type="email" register={register} error={errors.email} placeholder="e.g., john@example.com" />
              </div>

              <div className="form-row">
                <div className="form-field" style={{minWidth:220}}>
                  <label htmlFor="location_type">Residence Type</label>
                  <select id="location_type" {...register('location_type')} className={errors.location_type ? 'error' : ''}>
                    <option value="">Select type…</option>
                    <option value="COMMUNITY">Apartment/Community</option>
                    <option value="INDIVIDUAL">Individual House</option>
                  </select>
                  {errors.location_type?.message && <div className="error-text">{String(errors.location_type.message)}</div>}
                </div>
                {locationType === 'COMMUNITY' && (
                  <div className="form-field" style={{ minWidth: 300, position: 'relative' }}>
                    <label htmlFor="community_search">Community</label>
                    <input
                      id="community_search"
                      value={communityQuery}
                      onChange={(e) => {
                        setCommunityQuery(e.target.value);
                        setSelectedCommunity(null);
                        setValue('community_id', '', { shouldValidate: true });
                      }}
                      placeholder="Start typing community name or city (min 2 chars)"
                      className={errors.community_id ? 'error' : ''}
                      style={selectedCommunity ? { background: 'var(--color-success-soft)', borderColor: 'var(--color-success)' } : undefined}
                    />
                    {/* hidden input to keep RHF aware of field for validation */}
                    <input type="hidden" {...register('community_id')} />
                    {selectedCommunity && (
                      <div style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 2 }}>
                        ✓ Selected: {selectedCommunity.name}{selectedCommunity.city ? ` · ${selectedCommunity.city}` : ''}
                        <button
                          type="button"
                          className="action-link"
                          onClick={() => { setSelectedCommunity(null); setCommunityQuery(''); setValue('community_id', '', { shouldValidate: true }); }}
                          style={{ marginLeft: 8 }}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                    {communitySuggestions.length > 0 && !selectedCommunity && (
                      <div className="suggestions">
                        {communitySuggestions.map(c => (
                          <div
                            key={c.id}
                            className="suggestion-item"
                            onClick={() => {
                              setSelectedCommunity(c);
                              setCommunityQuery(c.name);
                              setValue('community_id', c.id, { shouldValidate: true });
                              setCommunitySuggestions([]);
                            }}
                          >
                            {c.name} {c.city ? <span className="subtle">({c.city})</span> : null}
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.community_id && <div className="error-text">{errors.community_id.message}</div>}
                  </div>
                )}
              </div>

              {locationType === 'COMMUNITY' && (
                <div className="form-row">
                  {communityBlocks.length > 0 ? (
                    <div className="form-field" style={{minWidth:220}}>
                      <label htmlFor="block">Block/Tower</label>
                      <select id="block" value={watch('block') || ''} onChange={(e)=>setValue('block', e.target.value, { shouldValidate: true })}>
                        <option value="">Select block…</option>
                        {communityBlocks.map((b, i) => (
                          <option key={i} value={b}>{b}</option>
                        ))}
                      </select>
                      {errors.block && <div className="error-text">{errors.block.message}</div>}
                    </div>
                  ) : (
                    <InputField name="block" label="Block/Tower" register={register} error={errors.block} placeholder="e.g., Block A, Tower 1" />
                  )}
                  <InputField name="flat_number" label="Flat Number" register={register} error={errors.flat_number} placeholder="e.g., 101, A-205" />
                </div>
              )}

              {locationType === 'INDIVIDUAL' && (
                <>
                  <div className="form-row">
                    <InputField name="address_line1" label="Address Line 1" register={register} error={errors.address_line1} placeholder="e.g., 123 Main Street" />
                    <InputField name="address_line2" label="Address Line 2" register={register} error={errors.address_line2} placeholder="e.g., Near Park" />
                  </div>
                  <div className="form-row">
                    <InputField name="city" label="City" register={register} error={errors.city} placeholder="e.g., Mumbai" />
                    <InputField name="state" label="State" register={register} error={errors.state} placeholder="e.g., Maharashtra" />
                    <InputField name="pincode" label="Pincode" register={register} error={errors.pincode} placeholder="e.g., 400001" />
                  </div>
                  <div className="form-row">
                    <InputField name="landmark" label="Landmark" register={register} error={errors.landmark} placeholder="e.g., Near Metro Station" />
                    <InputField name="door_number" label="Door Number" register={register} error={errors.door_number} placeholder="e.g., 12A" />
                  </div>
                </>
              )}

              {/* Map-based coordinates for both residence types */}
              <div className="form-row">
                <div className="form-field">
                  <label>Location Coordinates</label>
                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <input type="number" placeholder="Latitude" {...register('latitude' as any, { valueAsNumber: true })} />
                    <input type="number" placeholder="Longitude" {...register('longitude' as any, { valueAsNumber: true })} />
                    <button type="button" onClick={() => setIsMapOpen(true)} className="btn-outline-token" style={{whiteSpace:'nowrap'}}>
                      <MapPin size={16} /> Pick from Map
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{minWidth:220}}>
                  <label htmlFor="status">Status</label>
                  <select id="status" {...register('status')} className={errors.status ? 'error' : ''}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                  {errors.status?.message && <div className="error-text">{String(errors.status.message)}</div>}
                </div>
                <div className="form-field" style={{flex:1}}>
                  <label htmlFor="notes">Notes</label>
                  <textarea id="notes" rows={3} {...register('notes')} placeholder="Additional notes about the customer..." />
                  {errors.notes && <div className="error-text">{errors.notes.message}</div>}
                </div>
              </div>
            </div>
            <div className="inbound-modal-footer">
              <button type="button" onClick={onClose} className="btn-outline-token">Cancel</button>
              <button type="submit" className="btn-primary-token" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : (isEdit ? 'Update Customer' : 'Add Customer')}</button>
            </div>
          </form>
        </div>
      </div>

      {isMapOpen && (
        <LocationPicker
          onClose={() => setIsMapOpen(false)}
          onLocationSelect={(lat, lng) => {
            setValue('latitude', lat, { shouldValidate: true });
            setValue('longitude', lng, { shouldValidate: true });
            setIsMapOpen(false);
          }}
          title="Select Customer Location"
          initialPosition={[
            latitude || 28.6139,
            longitude || 77.2090
          ]}
        />
      )}
    </>
  );
};

export default Customers;
