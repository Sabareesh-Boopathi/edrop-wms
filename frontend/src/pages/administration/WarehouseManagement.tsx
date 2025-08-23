import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import TableCard from '../../components/table/TableCard';
import { MoreHorizontal, PlusCircle, X, BarChart2, Home, Package, Edit, Trash2, Building, Phone, Mail, MapPin, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as notify from '../../lib/notify';
import LocationPicker from '../../components/LocationPicker';
import * as warehouseService from '../../services/warehouseService';
import Celebration from '../../components/Celebration';
import './WarehouseManagement.css';
import EmptyState from '../../components/EmptyState';
import KpiCard from '../../components/KpiCard';
import LoadingOverlay from '../../components/LoadingOverlay';

const WAREHOUSE_STATUSES_TUPLE = ["ACTIVE", "INACTIVE", "NEAR_CAPACITY"] as const;

const warehouseSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  size_sqft: z.number().min(100, "Size must be at least 100 sqft"),
  capacity_units: z.number().min(1, "Capacity must be greater than 0").optional().nullable(),
  status: z.enum(WAREHOUSE_STATUSES_TUPLE),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  operations_time: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  contact_email: z.string().email("Invalid email address").optional().nullable(),
  latitude: z.number().min(-90, "Must be >= -90").max(90, "Must be <= 90").optional().nullable(),
  longitude: z.number().min(-180, "Must be >= -180").max(180, "Must be <= 180").optional().nullable(),
});

export type WarehouseSchema = z.infer<typeof warehouseSchema>;

export type WarehouseStatus = typeof WAREHOUSE_STATUSES_TUPLE[number];

export type Warehouse = {
	id: string;
	name: string;
	address: string;
    city: string;
    latitude?: number | null;
    longitude?: number | null;
    manager_id?: string | null;
	status: WarehouseStatus;
    size_sqft: number;
    utilization_pct: number;
    start_date: string;
    end_date?: string | null;
    capacity_units?: number | null;
    operations_time?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
};

const WarehouseManagement: React.FC = () => {
	const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
	const [showCelebration, setShowCelebration] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<'' | WarehouseStatus>('');
	const [sortBy, setSortBy] = useState<'name' | 'status' | 'utilization_pct'>('name');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
	const [warehouseId, setWarehouseId] = useState<string>('');
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	useEffect(() => {
		fetchWarehouses();
	}, []);

	const fetchWarehouses = async () => {
		try {
			setIsLoading(true);
			const data = await warehouseService.getWarehouses();
			setWarehouses(data);
		} catch (error) {
			notify.error("Failed to fetch warehouses.");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddWarehouse = () => {
		setSelectedWarehouse(null);
		setIsModalOpen(true);
	};

	const handleEditWarehouse = (warehouse: Warehouse) => {
		setSelectedWarehouse(warehouse);
		setIsModalOpen(true);
	};

	const handleDeleteWarehouse = async (id: string) => {
	notify.show("Are you sure you want to delete this warehouse?", {
            action: {
              label: "Delete",
              onClick: async () => {
				try {
					await warehouseService.deleteWarehouse(id);
					setWarehouses(warehouses.filter(w => w.id !== id));
					notify.success("Warehouse deleted successfully!");
				} catch (error) {
					notify.error("Failed to delete warehouse.");
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

	const handleSaveWarehouse = async (warehouseData: WarehouseSchema) => {
		try {
			if (selectedWarehouse) {
				// Edit existing
				const updatedWarehouse = await warehouseService.updateWarehouse(selectedWarehouse.id, warehouseData);
				setWarehouses(warehouses.map(w => w.id === selectedWarehouse.id ? updatedWarehouse : w));
				notify.success("Warehouse updated successfully!");
			} else {
				// Add new
				const newWarehouse = await warehouseService.createWarehouse(warehouseData);
				setWarehouses([...warehouses, newWarehouse]);
				notify.success("Warehouse added successfully!");
				setShowCelebration(true);
				setTimeout(() => setShowCelebration(false), 10000); // Hide celebration after 10 seconds
			}
			setIsModalOpen(false);
		} catch (error: any) {
			if (error.response && error.response.data && error.response.data.detail) {
				notify.error(error.response.data.detail); // Display meaningful error from backend
			} else {
				notify.error("Failed to save warehouse.");
			}
			console.error(error);
		}
	};

	const kpiData = useMemo(() => {
		const activeWarehouses = warehouses.filter(w => w.status !== 'INACTIVE');
		const totalCapacity = activeWarehouses.reduce((acc, w) => acc + (Number(w.capacity_units) || 0), 0);
		const totalSize = activeWarehouses.reduce((acc, w) => acc + w.size_sqft, 0);
		const weightedUtilizationSum = activeWarehouses.reduce((acc, w) => acc + ((parseFloat(String(w.utilization_pct)) || 0) * (Number(w.capacity_units) || 0)), 0);
		const overallUtilization = totalCapacity > 0 ? Math.round(weightedUtilizationSum / totalCapacity) : 0;
		
		return {
			count: activeWarehouses.length,
			totalCapacity,
			totalSize,
			overallUtilization,
		};
	}, [warehouses]);

	const displayedWarehouses = useMemo(() => {
		const t = searchTerm.trim().toLowerCase();
		const filtered = warehouses.filter(w => {
			const matchesTerm = !t ||
			  w.name.toLowerCase().includes(t) ||
			  (w.city || '').toLowerCase().includes(t) ||
			  (w.contact_email || '').toLowerCase().includes(t) ||
			  (w.contact_phone || '').toLowerCase().includes(t);
			const matchesWarehouse = !warehouseId || w.id === warehouseId;
			const matchesStatus = !statusFilter || w.status === statusFilter;
			return matchesTerm && matchesWarehouse && matchesStatus;
		});
		const dir = sortDir === 'asc' ? 1 : -1;
		return filtered.sort((a, b) => {
			if (sortBy === 'utilization_pct') return ((parseFloat(String(a.utilization_pct)) || 0) - (parseFloat(String(b.utilization_pct)) || 0)) * dir;
			const va = sortBy === 'status' ? a.status : a.name;
			const vb = sortBy === 'status' ? b.status : b.name;
			return va.localeCompare(vb) * dir;
		});
	}, [warehouses, searchTerm, sortBy, sortDir, warehouseId, statusFilter]);

	const total = displayedWarehouses.length;
	const pagedWarehouses = useMemo(() => {
		const start = (page - 1) * pageSize;
		const end = start + pageSize;
		return displayedWarehouses.slice(start, end);
	}, [displayedWarehouses, page, pageSize]);

	const toggleSort = (key: 'name' | 'status' | 'utilization_pct') => {
		if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
		else { setSortBy(key); setSortDir('asc'); }
	};

	if (isLoading) {
		return <LoadingOverlay fullscreen label="Loading warehouses" />;
	}

	if (!isLoading && warehouses.length === 0) {
		return (
			<div className="page-content">
				<EmptyState
				  icon={<Home size={64} />}
				  title="No Warehouses Found"
				  message="Get started by adding your first warehouse. Track inventory, manage capacity, and streamline your operations."
				  actionLabel="Add Your First Warehouse"
				  actionIcon={<PlusCircle className="icon" />}
				  onAction={handleAddWarehouse}
				/>
				<AnimatePresence>
					{isModalOpen && (
						<WarehouseModal
							warehouse={selectedWarehouse}
							onClose={() => setIsModalOpen(false)}
							onSave={handleSaveWarehouse}
						/>
					)}
				</AnimatePresence>
			</div>
		);
	}

	return (
		<div className="page-content">
			{showCelebration && <Celebration title="Congratulations!" subtitle="Your new warehouse has been created and is ready for operations." />}
			<header className="header">
				<div className="header-text">
					<h1>Warehouse Management</h1>
					<p>Organize, track, and manage your entire warehouse fleet.</p>
				</div>
				<Button onClick={handleAddWarehouse} className="add-warehouse-btn">
					<PlusCircle className="icon" />
					Add New Warehouse
				</Button>
			</header>

			<motion.section
				className="kpi-section"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, staggerChildren: 0.1 }}
			>
				<KpiCard icon={<Home className="icon"/>} title="Active Warehouses" value={kpiData.count} variant="indigo" />
                <KpiCard icon={<Building className="icon"/>} title="Total Area" value={`${(kpiData.totalSize / 1000).toFixed(1)}k sqft`} variant="emerald" />
				<KpiCard icon={<Package className="icon"/>} title="Total Capacity" value={`${(kpiData.totalCapacity / 1000).toFixed(0)}k units`} variant="orange" />
				<KpiCard icon={<BarChart2 className="icon"/>} title="Overall Utilization" value={`${kpiData.overallUtilization}%`} variant="cyan" />
			</motion.section>

			<div className="main-grid">
				<motion.div
					className="main-content"
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
						<TableCard
							variant="inbound"
							title="Warehouse Fleet"
							controlsWrap="nowrap"
							controlsAlign="right"
							centerSearch
							actions={(
								<Button className="btn-primary-token" onClick={handleAddWarehouse}>
									<PlusCircle className="icon" />
									Add Warehouse
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
												placeholder="Name / City / Email / Phone"
												value={searchTerm}
												onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
											/>
										</div>
									</div>
								</div>
							)}
							filters={(
								<div className="form-field" style={{ flex: '0 0 auto', width: 'auto', display: 'inline-flex', alignItems: 'center' }}>
									<label>Status</label>
									<select
										value={statusFilter}
										onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
										style={{ width: 'auto' }}
									>
										<option value="">All</option>
										{WAREHOUSE_STATUSES_TUPLE.map(s => (
											<option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
										))}
									</select>
								</div>
							)}
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
										<TableHead onClick={() => toggleSort('name')} style={{ cursor: 'pointer', width: '35%' }} title="Sort by Warehouse name">
											Warehouse
											{sortBy === 'name' && (
												<span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
											)}
										</TableHead>
										<TableHead style={{ width: '28%' }}>Contact</TableHead>
										<TableHead onClick={() => toggleSort('status')} style={{ cursor: 'pointer', width: '15%' }} title="Sort by Status">
											Status
											{sortBy === 'status' && (
												<span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
											)}
										</TableHead>
										<TableHead onClick={() => toggleSort('utilization_pct')} style={{ cursor: 'pointer', width: '12%' }} title="Sort by Utilization">
											Utilization
											{sortBy === 'utilization_pct' && (
												<span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
											)}
										</TableHead>
										<TableHead style={{ width: '10%' }}>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{pagedWarehouses.map((warehouse) => (
										<TableRow key={warehouse.id}>
											<TableCell style={{ width: '35%' }}>
												<div className="warehouse-name">{warehouse.name}</div>
												<div className="warehouse-location">{warehouse.city}</div>
											</TableCell>
											<TableCell style={{ width: '28%' }}>
												{warehouse.contact_email && <div className="contact-info"><Mail size={14} /> {warehouse.contact_email}</div>}
												{warehouse.contact_phone && <div className="contact-info"><Phone size={14} /> {warehouse.contact_phone}</div>}
											</TableCell>
											<TableCell style={{ width: '15%' }}>
												<StatusBadge status={warehouse.status} />
											</TableCell>
											<TableCell className="text-right utilization-text" style={{ width: '12%' }}>
												{(Number.isFinite(parseFloat(String(warehouse.utilization_pct ?? 0))) ? parseFloat(String(warehouse.utilization_pct ?? 0)) : 0).toFixed(0)}%
											</TableCell>
											<TableCell className="actions-cell" style={{ width: '10%' }}>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" className="action-btn">
															<MoreHorizontal className="icon" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="dropdown-content">
														<DropdownMenuItem onClick={() => handleEditWarehouse(warehouse)} className="dropdown-item">
															<Edit className="icon" />
															<span>Edit</span>
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => handleDeleteWarehouse(warehouse.id)} className="dropdown-item danger">
															<Trash2 className="icon" />
															<span>Delete</span>
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
			</div>

			<AnimatePresence>
				{isModalOpen && (
					<WarehouseModal
						warehouse={selectedWarehouse}
						onClose={() => setIsModalOpen(false)}
						onSave={handleSaveWarehouse}
					/>
				)}
			</AnimatePresence>
		</div>
	);
};

const StatusBadge: React.FC<{ status: WarehouseStatus }> = ({ status }) => {
	const statusClassName = `status-${status.replace(/_/g, '-').toLowerCase()}`;
	return (
		<span className={`status-badge ${statusClassName}`}>
			<span className="status-dot"></span>
			{status.replace(/_/g, ' ')}
		</span>
	);
};

const WarehouseModal: React.FC<{ warehouse: Warehouse | null, onClose: () => void, onSave: (data: WarehouseSchema) => void }> = ({ warehouse, onClose, onSave }) => {
    const [isMapOpen, setIsMapOpen] = useState(false);
    const { register, handleSubmit, formState: { errors }, control, setValue, watch } = useForm<WarehouseSchema>({
        resolver: zodResolver(warehouseSchema),
        defaultValues: {
            name: warehouse?.name || '',
            address: warehouse?.address || '',
            city: warehouse?.city || '',
            size_sqft: warehouse?.size_sqft || undefined,
            capacity_units: warehouse?.capacity_units || undefined,
            status: warehouse?.status || 'ACTIVE',
            start_date: warehouse?.start_date ? new Date(warehouse.start_date).toISOString().split('T')[0] : '',
            operations_time: warehouse?.operations_time || '',
            contact_phone: warehouse?.contact_phone || '',
            contact_email: warehouse?.contact_email || '',
            latitude: warehouse?.latitude || undefined,
            longitude: warehouse?.longitude || undefined,
        }
    });

    const latitude = watch('latitude');
    const longitude = watch('longitude');

	const onSubmit = (data: WarehouseSchema) => {
		onSave(data);
	};

	const InputField = ({ name, label, type = "text", register, error, placeholder, disabled }: { name: keyof WarehouseSchema, label: string, type?: string, register: any, error?: { message?: string }, placeholder?: string, disabled?: boolean }) => (
		<div className="form-group">
			<label htmlFor={name}>{label}</label>
			<input 
				type={type} 
				id={name} 
				{...register(name, { valueAsNumber: type === 'number' })} 
				placeholder={placeholder}
				className={error ? 'error' : ''} 
                disabled={disabled}
			/>
			{error && <p className="error-message">{error.message}</p>}
		</div>
	);

	return (
        <>
		<motion.div
			className="modal-overlay"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
		>
			<motion.div
				className="modal-content"
				initial={{ y: -50, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: 50, opacity: 0 }}
				transition={{ type: "spring", stiffness: 300, damping: 30 }}
			>
				<div className="modal-header">
					<h3 className="modal-title">{warehouse ? 'Edit Warehouse' : 'Add New Warehouse'}</h3>
					<Button variant="ghost" size="icon" onClick={onClose} className="close-btn">
						<X size={24} />
					</Button>
				</div>
				<form onSubmit={handleSubmit(onSubmit)} noValidate className="modal-form">
						<div className="form-grid">
						<InputField name="name" label="Warehouse Name" register={register} error={errors.name} placeholder="e.g., Main Distribution Center" />
						<InputField name="address" label="Address" register={register} error={errors.address} placeholder="e.g., 123 Industrial Park" />
                        <InputField name="city" label="City" register={register} error={errors.city} placeholder="e.g., New York, NY" />
						<InputField name="size_sqft" label="Size (sqft)" type="number" register={register} error={errors.size_sqft} placeholder="e.g., 100000" />
						<InputField name="capacity_units" label="Capacity (units)" type="number" register={register} error={errors.capacity_units} placeholder="e.g., 100000" />
						
						<div className="form-group">
							<label htmlFor="status">Status</label>
							<select 
								id="status" 
								{...register("status")} 
								className={errors.status ? 'error' : ''}
							>
								{WAREHOUSE_STATUSES_TUPLE.map(status => (
									<option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
								))}
							</select>
                            {errors.status?.message && <p className="error-message">{String(errors.status.message)}</p>}
						</div>

                        <InputField name="start_date" label="Start Date" type="date" register={register} error={errors.start_date} />
                        <InputField name="operations_time" label="Operations Time" register={register} error={errors.operations_time} placeholder="e.g., Mon-Fri 9am-5pm" />
                        <InputField name="contact_phone" label="Contact Phone" register={register} error={errors.contact_phone} placeholder="e.g., 123-456-7890" />
                        <InputField name="contact_email" label="Contact Email" register={register} error={errors.contact_email} placeholder="e.g., contact@example.com" />
                        
                        <div className="form-group-span-2">
                            <label>Location</label>
                            <div className="location-picker-group">
                                <InputField name="latitude" label="Latitude" type="number" register={register} error={errors.latitude} placeholder="e.g., 40.7128" disabled />
                                <InputField name="longitude" label="Longitude" type="number" register={register} error={errors.longitude} placeholder="e.g., -74.0060" disabled />
                                <Button type="button" variant="outline" onClick={() => setIsMapOpen(true)} className="map-picker-btn">
                                    <MapPin size={16} />
                                    Pick from Map
                                </Button>
                            </div>
                        </div>
					</div>

					<div className="modal-footer">
						<Button type="button" onClick={onClose} className="btn-outline-token">Cancel</Button>
						<Button type="submit" className="btn-primary-token">{warehouse ? 'Save Changes' : 'Add Warehouse'}</Button>
					</div>
				</form>
			</motion.div>
		</motion.div>

        <AnimatePresence>
            {isMapOpen && (
                <LocationPicker
                    onClose={() => setIsMapOpen(false)}
                    onLocationSelect={(lat, lng) => {
                        setValue('latitude', lat, { shouldValidate: true });
                        setValue('longitude', lng, { shouldValidate: true });
						notify.success("Location selected from map!");
                        setIsMapOpen(false);
                    }}
                    initialPosition={[
                        latitude || warehouse?.latitude || 51.505,
                        longitude || warehouse?.longitude || -0.09
                    ]}
                />
            )}
        </AnimatePresence>
        </>
	);
};

export default WarehouseManagement;
