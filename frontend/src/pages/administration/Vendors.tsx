import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import TableCard from '../../components/table/TableCard';
import { MoreHorizontal, PlusCircle, X, Users, Shield, UserCheck, Edit, Trash2, Mail, Phone, MapPin, Store as StoreIcon, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getWarehouses } from '../../services/warehouseService';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as notify from '../../lib/notify';
import * as vendorService from '../../services/vendorService';
import './Vendors.css';
import EmptyState from '../../components/EmptyState';
import KpiCard from '../../components/KpiCard';
import VendorDetails from './VendorDetails';
import { useConfig } from '../../contexts/ConfigContext';
import LoadingOverlay from '../../components/LoadingOverlay';

const VENDOR_STATUSES = ["ACTIVE", "INACTIVE", "KYC PENDING"] as const;
const VENDOR_TYPES = ["SKU", "FLAT"] as const;

const baseVendorSchema = z.object({
    business_name: z.string().min(3, "Business name must be at least 3 characters"),
    registered_name: z.string().optional().nullable(),
    email: z.string().email("Invalid email address").optional().nullable(),
    phone_number: z.string().min(10, "Phone must be at least 10 digits").optional().nullable(),
    registered_address: z.string().min(5, "Address must be at least 5 characters").optional().nullable(),
    vendor_type: z.enum(VENDOR_TYPES),
    vendor_status: z.enum(VENDOR_STATUSES),
    password: z.string().optional().nullable(),
});

export type VendorSchema = z.infer<typeof baseVendorSchema>;
export type VendorStatus = typeof VENDOR_STATUSES[number];
export type VendorType = typeof VENDOR_TYPES[number];

export type VendorData = {
    id: string;
    business_name: string;
    registered_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    registered_address?: string | null;
    vendor_type: VendorType;
    vendor_status: VendorStatus;
    created_at: string;
    updated_at: string;
    stores: any[];
};

type VendorSummary = {
    id: string;
    business_name: string;
    vendor_type: VendorType | string;
    vendor_status: VendorStatus | string;
    store_count: number;
    product_count: number;
};

const vendorSchemaValidation = (isEditMode: boolean) => baseVendorSchema.extend({
    password: isEditMode
        ? z.string().optional().nullable()
        : z.string().min(8, "Password must be at least 8 characters"),
});

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

const Vendors: React.FC = () => {
    const [vendors, setVendors] = useState<VendorData[]>([]);
    const [summaries, setSummaries] = useState<VendorSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null);
    const [showVendorDetails, setShowVendorDetails] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'' | VendorStatus>('');
    const [typeFilter, setTypeFilter] = useState<'' | VendorType>('');
    const [sortBy, setSortBy] = useState<'business_name' | 'vendor_type' | 'vendor_status' | 'created_at'>('business_name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [warehouseFilter, setWarehouseFilter] = useState<string>('');
    const [whList, setWhList] = useState<Array<{ id: string; name: string }>>([]);
    const { formatDate } = useConfig();

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            setIsLoading(true);
            const [data, summary] = await Promise.all([
                vendorService.getVendors(),
                vendorService.getVendorSummaries(),
            ]);
            setVendors(data);
            setSummaries(summary as VendorSummary[]);
        } catch (error: any) {
            notify.error(getErrorMessage(error));
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch warehouses for filter dropdown
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const data = await getWarehouses();
                if (active) setWhList(data);
            } catch {
                // ignore fetch failure for optional filter
            }
        })();
        return () => { active = false; };
    }, []);

    const handleAddVendor = () => {
        setSelectedVendor(null);
        setIsModalOpen(true);
    };

    const handleEditVendor = (vendor: VendorData) => {
        setSelectedVendor(vendor);
        setIsModalOpen(true);
    };

    const handleDeleteVendor = async (id: string) => {
        notify.show("Are you sure you want to delete this vendor?", {
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await vendorService.deleteVendor(id);
                        setVendors(vendors.filter(v => v.id !== id));
                        notify.success("Vendor deleted successfully!");
                    } catch (error: any) {
                        notify.error(getErrorMessage(error));
                        console.error(error);
                    }
                },
            },
            cancel: {
                label: "Cancel",
                onClick: () => notify.dismiss(),
            },
        });
    };

    const handleSaveVendor = async (data: VendorSchema) => {
        try {
            if (selectedVendor) {
                const updatedVendor = await vendorService.updateVendor(selectedVendor.id, data);
                setVendors(vendors.map(v => v.id === selectedVendor.id ? { ...updatedVendor, created_at: selectedVendor.created_at, stores: selectedVendor.stores } : v));
                notify.success("Vendor updated successfully!");
            } else {
                if (!data.password) {
                    notify.error("Password is required for new vendors.");
                    return;
                }
                const newVendor = await vendorService.createVendor(data as VendorSchema & { password: string });
                setVendors([...vendors, { ...newVendor, created_at: new Date().toISOString(), stores: [] }]);
                notify.success("Vendor added successfully!");
            }
            setIsModalOpen(false);
        } catch (error: any) {
            notify.error(getErrorMessage(error));
            console.error(error);
        }
    };

    const kpiData = useMemo(() => {
        const activeVendors = vendors.filter(v => v.vendor_status === 'ACTIVE');
        return {
            totalVendors: vendors.length,
            activeVendors: activeVendors.length,
            vendorTypes: VENDOR_TYPES.length,
        };
    }, [vendors]);

    const displayedVendors = useMemo(() => {
        const t = searchTerm.trim().toLowerCase();
        const filtered = vendors.filter(v => {
            const matchesTerm = !t ||
                (v.business_name || '').toLowerCase().includes(t) ||
                (v.registered_name || '').toLowerCase().includes(t) ||
                (v.email || '').toLowerCase().includes(t) ||
                (v.phone_number || '').toLowerCase().includes(t);
            const matchesStatus = !statusFilter || v.vendor_status === statusFilter;
            const matchesType = !typeFilter || v.vendor_type === typeFilter;
            const matchesWarehouse = !warehouseFilter || (Array.isArray(v.stores) && v.stores.some((s: any) => s?.warehouse_id === warehouseFilter));
            return matchesTerm && matchesStatus && matchesType && matchesWarehouse;
        });
        const dir = sortDir === 'asc' ? 1 : -1;
        return filtered.sort((a, b) => {
            let va = '';
            let vb = '';
            if (sortBy === 'business_name') { va = a.business_name || ''; vb = b.business_name || ''; }
            else if (sortBy === 'vendor_type') { va = a.vendor_type || ''; vb = b.vendor_type || ''; }
            else if (sortBy === 'vendor_status') { va = a.vendor_status || ''; vb = b.vendor_status || ''; }
            else { va = a.created_at || ''; vb = b.created_at || ''; }
            return va.localeCompare(vb) * dir;
        });
    }, [vendors, searchTerm, statusFilter, typeFilter, sortBy, sortDir]);

    const total = displayedVendors.length;
    const pagedVendors = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return displayedVendors.slice(start, end);
    }, [displayedVendors, page, pageSize]);

    const toggleSort = (key: 'business_name' | 'vendor_type' | 'vendor_status' | 'created_at') => {
        if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(key); setSortDir('asc'); }
    };

    if (isLoading) {
        return (
            <div className="page-content">
                <header className="header">
                    <div className="header-text">
                        <h1>Vendor Management</h1>
                        <p>Administer vendor profiles, types, and statuses across the platform.</p>
                    </div>
                </header>
                <LoadingOverlay label="Loading vendors" />
            </div>
        );
    }

    if (!isLoading && vendors.length === 0) {
        return (
            <div className="page-content">
                <EmptyState
                    icon={<Users size={64} />}
                    title="No Vendors Found"
                    message="Get started by adding your first vendor to onboard products and manage supply."
                    actionLabel="Add Your First Vendor"
                    actionIcon={<PlusCircle className="icon" />}
                    onAction={handleAddVendor}
                />
                <AnimatePresence>
                    {isModalOpen && (
                        <VendorModal
                            vendor={selectedVendor}
                            onClose={() => setIsModalOpen(false)}
                            onSave={handleSaveVendor}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    const handleOpenVendorDetails = (vendor: VendorData) => {
        setSelectedVendor(vendor);
        setShowVendorDetails(true);
    };

    return (
        <div className="page-content">
            <header className="header">
                <div className="header-text">
                    <h1>Vendor Management</h1>
                    <p>Administer vendor profiles, types, and statuses across the platform.</p>
                </div>
                <Button onClick={handleAddVendor} className="btn-primary-token">
                    <PlusCircle className="icon" />
                    Add New Vendor
                </Button>
            </header>

            <motion.section
                className="kpi-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, staggerChildren: 0.1 }}
            >
                <KpiCard icon={<Users className="icon" />} title="Total Vendors" value={kpiData.totalVendors} variant="indigo" />
                <KpiCard icon={<UserCheck className="icon" />} title="Active Vendors" value={kpiData.activeVendors} variant="emerald" />
                <KpiCard icon={<Shield className="icon" />} title="Vendor Types" value={kpiData.vendorTypes} variant="orange" />
            </motion.section>

            {/* Modern vendor cards summary */}
            <div className="vendor-cards-grid">
                {summaries.map(s => (
                    <div key={s.id} className="vendor-card">
                        <div className="vendor-card-header">
                            <div>
                                <div className="vendor-card-name">{s.business_name}</div>
                                <div className="vendor-card-meta">
                                    <span className={`badge ${String(s.vendor_type).toLowerCase()}`}>{s.vendor_type}</span>
                                    <span className={`badge status ${String(s.vendor_status).toLowerCase().replace(' ', '-')}`}>{s.vendor_status}</span>
                                </div>
                            </div>
                            <Button size="sm" className="btn-outline-token" onClick={() => handleOpenVendorDetails(vendors.find(v => v.id === s.id)!)}>Manage</Button>
                        </div>
                        <div className="vendor-card-body">
                            <div className="metric">
                                <div className="metric-label">Stores</div>
                                <div className="metric-value">{s.store_count}</div>
                            </div>
                            <div className="metric">
                                <div className="metric-label">Products</div>
                                <div className="metric-value">{s.product_count}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <motion.div
                                className="main-content"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                            <TableCard
                    variant="inbound"
                    title="Vendor Directory"
                    centerSearch
                    controlsWrap="nowrap"
                    actions={(
                        <Button className="btn-primary-token" onClick={handleAddVendor}>
                            <PlusCircle className="icon" />
                            Add Vendor
                        </Button>
                    )}
                    warehouse={
                        <div className="form-field" style={{ minWidth: 220 }}>
                            <label>Warehouse</label>
                            <select value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}>
                                <option value="">All</option>
                                {whList.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    }
                    search={
                        <div style={{ flex: '1 1 300px', maxWidth: 420 }}>
                            <div className="form-field" style={{ margin: 0 }}>
                                <label>Search</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--color-text-subtle)' }} />
                                    <input
                                        style={{ paddingLeft: 30 }}
                                        placeholder="Business / Email / Phone"
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                    />
                                </div>
                            </div>
                        </div>
                    }
                    filters={
                        <>
                            <div className="form-field" style={{ flex: '0 0 auto', width: 'auto', display: 'inline-flex', alignItems: 'center' }}>
                                <label>Status</label>
                                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }} style={{ width: 'auto' }}>
                                    <option value="">All</option>
                                    {VENDOR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-field" style={{ flex: '0 0 auto', width: 'auto', display: 'inline-flex', alignItems: 'center' }}>
                                <label>Type</label>
                                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }} style={{ width: 'auto' }}>
                                    <option value="">All</option>
                                    {VENDOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </>
                    }
                    footer={(
                        <>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                                {total ? `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}` : '—'}
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button
                                    type="button"
                                    className="btn-outline-token"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    aria-label="Previous page"
                                    title="Previous"
                                    style={{
                                        width: 'var(--control-height-sm)',
                                        height: 'var(--control-height-sm)',
                                        padding: 0,
                                        display: 'grid',
                                        placeItems: 'center',
                                    }}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span style={{ minWidth: 32, textAlign: 'center' }}>{page}</span>
                                <button
                                    type="button"
                                    className="btn-outline-token"
                                    onClick={() => setPage((p) => (p * pageSize < total ? p + 1 : p))}
                                    disabled={page * pageSize >= total}
                                    aria-label="Next page"
                                    title="Next"
                                    style={{
                                        width: 'var(--control-height-sm)',
                                        height: 'var(--control-height-sm)',
                                        padding: 0,
                                        display: 'grid',
                                        placeItems: 'center',
                                    }}
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
                    <Table className="inbound-table">
                        <TableHeader>
                            <TableRow>
                                <TableHead onClick={() => toggleSort('business_name')} style={{ cursor: 'pointer' }} title="Sort by Vendor">
                                    Vendor
                                    {sortBy === 'business_name' && (
                                        <span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                                    )}
                                </TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead onClick={() => toggleSort('vendor_type')} style={{ cursor: 'pointer' }} title="Sort by Type">
                                    Type
                                    {sortBy === 'vendor_type' && (
                                        <span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                                    )}
                                </TableHead>
                                <TableHead onClick={() => toggleSort('vendor_status')} style={{ cursor: 'pointer' }} title="Sort by Status">
                                    Status
                                    {sortBy === 'vendor_status' && (
                                        <span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                                    )}
                                </TableHead>
                                <TableHead className="text-right" onClick={() => toggleSort('created_at')} style={{ cursor: 'pointer' }} title="Sort by Created">
                                    Created On
                                    {sortBy === 'created_at' && (
                                        <span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                                    )}
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pagedVendors.map((vendor) => (
                                <TableRow key={vendor.id}>
                                    <TableCell>
                                        <div className="vendor-name">{vendor.business_name}</div>
                                        <div className="vendor-registered-name">{vendor.registered_name}</div>
                                    </TableCell>
                                    <TableCell>
                                        {vendor.email && <div className="contact-info"><Mail size={14} /> {vendor.email}</div>}
                                        {vendor.phone_number && <div className="contact-info"><Phone size={14} /> {vendor.phone_number}</div>}
                                    </TableCell>
                                    <TableCell><TypeBadge type={vendor.vendor_type} /></TableCell>
                                    <TableCell><StatusBadge status={vendor.vendor_status} /></TableCell>
                                    <TableCell className="text-right">{formatDate(vendor.created_at)}</TableCell>
                                    <TableCell className="actions-cell">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="action-btn">
                                                    <MoreHorizontal className="icon" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="dropdown-content">
                                                <DropdownMenuItem onClick={() => handleOpenVendorDetails(vendor)} className="dropdown-item">
                                                    <StoreIcon className="icon" /><span>Manage Stores & Products</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEditVendor(vendor)} className="dropdown-item">
                                                    <Edit className="icon" /><span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteVendor(vendor.id)} className="dropdown-item danger">
                                                    <Trash2 className="icon" /><span>Delete</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableCard>
            </motion.div>

            <AnimatePresence>
                {isModalOpen && (
                    <VendorModal
                        vendor={selectedVendor}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSaveVendor}
                    />
                )}
            </AnimatePresence>
            {showVendorDetails && selectedVendor && (
                <VendorDetails
                    vendor={{ id: selectedVendor.id, business_name: selectedVendor.business_name }}
                    open={showVendorDetails}
                    onClose={() => setShowVendorDetails(false)}
                />
            )}
        </div>
    );
};

const StatusBadge: React.FC<{ status: VendorStatus }> = ({ status }) => {
    const statusClassName = `status-${status.toLowerCase().replace(' ', '-')}`;
    return (
        <span className={`status-badge ${statusClassName}`}>
            <span className="status-dot"></span>
            {status}
        </span>
    );
};

const TypeBadge: React.FC<{ type: VendorType }> = ({ type }) => {
    const typeClassName = `type-${type.toLowerCase()}`;
    return (
        <span className={`type-badge ${typeClassName}`}>
            {type}
        </span>
    );
};

const VendorModal: React.FC<{ vendor: VendorData | null, onClose: () => void, onSave: (data: VendorSchema) => void }> = ({ vendor, onClose, onSave }) => {
    const isEditMode = vendor !== null;
    const { register, handleSubmit, formState: { errors } } = useForm<VendorSchema>({
        resolver: zodResolver(vendorSchemaValidation(isEditMode)),
        defaultValues: vendor || {
            business_name: '',
            registered_name: '',
            email: '',
            phone_number: '',
            registered_address: '',
            vendor_type: 'SKU',
            vendor_status: 'ACTIVE',
            password: '',
        },
    });

    const onSubmit = (data: VendorSchema) => {
        onSave(data);
    };

    const InputField = ({ name, label, type = "text", register, error, placeholder }: { name: keyof VendorSchema; label: string; type?: string; register: any; error?: { message?: string }; placeholder?: string; }) => (
        <div className="form-group">
            <label htmlFor={name}>{label}</label>
            <input type={type} id={name} {...register(name)} placeholder={placeholder} className={error ? "error" : ""} />
            {error && <p className="error-message">{error.message}</p>}
        </div>
    );

    return (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                <div className="modal-header">
                    <h3 className="modal-title">{vendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="close-btn"><X size={24} /></Button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="modal-form">
                    <div className="form-grid">
                        <InputField name="business_name" label="Business Name" register={register} error={errors.business_name} placeholder="e.g., Acme Corp" />
                        <InputField name="registered_name" label="Registered Name" register={register} error={errors.registered_name} placeholder="e.g., Acme Corporation Inc." />
                        <InputField name="email" label="Email Address" type="email" register={register} error={errors.email} placeholder="e.g., contact@acme.com" />
                        <InputField name="phone_number" label="Phone Number" register={register} error={errors.phone_number} placeholder="e.g., 9876543210" />
                        <InputField name="registered_address" label="Registered Address" register={register} error={errors.registered_address} placeholder="e.g., 123 Business Rd, Commerce City" />
                        <InputField name="password" label="Password" type="password" register={register} error={errors.password} placeholder={vendor ? "Leave blank to keep current password" : "Enter a secure password"} />

                        <div className="form-group">
                            <label htmlFor="vendor_type">Vendor Type</label>
                            <select id="vendor_type" {...register("vendor_type")} className={errors.vendor_type ? 'error' : ''}>
                                {VENDOR_TYPES.map(type => (<option key={type} value={type}>{type}</option>))}
                            </select>
                            {errors.vendor_type?.message && <p className="error-message">{String(errors.vendor_type.message)}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="vendor_status">Status</label>
                            <select id="vendor_status" {...register("vendor_status")} className={errors.vendor_status ? 'error' : ''}>
                                {VENDOR_STATUSES.map(status => (<option key={status} value={status}>{status}</option>))}
                            </select>
                            {errors.vendor_status?.message && <p className="error-message">{String(errors.vendor_status.message)}</p>}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <Button type="button" onClick={onClose} className="btn-outline-token">Cancel</Button>
                        <Button type="submit" className="btn-primary-token">{vendor ? 'Save Changes' : 'Add Vendor'}</Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default Vendors;