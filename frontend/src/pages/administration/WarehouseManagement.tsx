import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { MoreHorizontal, PlusCircle, X, BarChart2, Home, Package, Edit, Trash2, Building, Phone, Mail, MapPin } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import LocationPicker from '../../components/LocationPicker';
import * as warehouseService from '../../services/warehouseService';
import Celebration from '../../components/Celebration';
import './WarehouseManagement.css';

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

	useEffect(() => {
		fetchWarehouses();
	}, []);

	const fetchWarehouses = async () => {
		try {
			setIsLoading(true);
			const data = await warehouseService.getWarehouses();
			setWarehouses(data);
		} catch (error) {
			toast.error("Failed to fetch warehouses.");
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
        toast.error("Are you sure you want to delete this warehouse?", {
            action: {
              label: "Delete",
              onClick: async () => {
				try {
					await warehouseService.deleteWarehouse(id);
					setWarehouses(warehouses.filter(w => w.id !== id));
					toast.success("Warehouse deleted successfully!");
				} catch (error) {
					toast.error("Failed to delete warehouse.");
					console.error(error);
				}
              },
            },
            cancel: {
              label: "Cancel",
              onClick: () => toast.dismiss(),
            },
          });
	};

	const handleSaveWarehouse = async (warehouseData: WarehouseSchema) => {
		try {
			if (selectedWarehouse) {
				// Edit existing
				const updatedWarehouse = await warehouseService.updateWarehouse(selectedWarehouse.id, warehouseData);
				setWarehouses(warehouses.map(w => w.id === selectedWarehouse.id ? updatedWarehouse : w));
				toast.success("Warehouse updated successfully!");
			} else {
				// Add new
				const newWarehouse = await warehouseService.createWarehouse(warehouseData);
				setWarehouses([...warehouses, newWarehouse]);
				toast.success("Warehouse added successfully!");
				setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 10000); // Hide celebration after 10 seconds
			}
			setIsModalOpen(false);
		} catch (error: any) {
			if (error.response && error.response.data && error.response.data.detail) {
                toast.error(error.response.data.detail); // Display meaningful error from backend
            } else {
                toast.error("Failed to save warehouse.");
            }
			console.error(error);
		}
	};

	const kpiData = useMemo(() => {
		const activeWarehouses = warehouses.filter(w => w.status !== 'INACTIVE');
		const totalCapacity = activeWarehouses.reduce((acc, w) => acc + (w.capacity_units || 0), 0);
        const totalSize = activeWarehouses.reduce((acc, w) => acc + w.size_sqft, 0);
		const weightedUtilizationSum = activeWarehouses.reduce((acc, w) => acc + (w.utilization_pct * (w.capacity_units || 0)), 0);
		const overallUtilization = totalCapacity > 0 ? Math.round(weightedUtilizationSum / totalCapacity) : 0;
		
        return {
			count: activeWarehouses.length,
			totalCapacity,
            totalSize,
			overallUtilization,
		};
	}, [warehouses]);

	if (isLoading) {
		return <div>Loading...</div>; // Or a spinner component
	}

	if (!isLoading && warehouses.length === 0) {
		return (
			<div className="page-content">
				<EmptyState onAdd={handleAddWarehouse} />
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
				<KpiCard icon={<Home className="icon"/>} title="Active Warehouses" value={kpiData.count.toString()} cardClass="kpi-card-1" />
                <KpiCard icon={<Building className="icon"/>} title="Total Area" value={`${(kpiData.totalSize / 1000).toFixed(1)}k sqft`} cardClass="kpi-card-2" />
				<KpiCard icon={<Package className="icon"/>} title="Total Capacity" value={`${(kpiData.totalCapacity / 1000).toFixed(0)}k units`} cardClass="kpi-card-3" />
				<KpiCard icon={<BarChart2 className="icon"/>} title="Overall Utilization" value={`${kpiData.overallUtilization}%`} cardClass="kpi-card-4" />
			</motion.section>

			<div className="main-grid">
				<motion.div
					className="main-content"
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">Warehouse Fleet</h3>
						</div>
						<div className="card-content">
							<table className="table">
								<thead>
									<tr>
										<th>Warehouse</th>
                                        <th>Contact</th>
										<th>Status</th>
										<th className="text-right">Utilization</th>
										<th className="text-right">Actions</th>
									</tr>
								</thead>
								<tbody>
									{warehouses.map((warehouse) => (
										<tr key={warehouse.id}>
											<td>
												<div className="warehouse-name">{warehouse.name}</div>
												<div className="warehouse-location">{warehouse.city}</div>
											</td>
                                            <td>
                                                {warehouse.contact_email && <div className="contact-info"><Mail size={14} /> {warehouse.contact_email}</div>}
                                                {warehouse.contact_phone && <div className="contact-info"><Phone size={14} /> {warehouse.contact_phone}</div>}
                                            </td>
											<td>
												<StatusBadge status={warehouse.status} />
											</td>
											<td className="text-right utilization-text">{warehouse.utilization_pct}%</td>
											<td className="actions-cell">
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
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</motion.div>
				<motion.div
					className="sidebar-content"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5, delay: 0.4 }}
				>
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">Utilization Overview</h3>
						</div>
						<div className="card-content with-padding">
							<div className="utilization-list">
								{warehouses.map(w => (
									<div key={w.id} className="utilization-item">
										<div className="utilization-item-header">
											<p className="utilization-item-name">{w.name}</p>
											<p className="utilization-text">{w.utilization_pct}%</p>
										</div>
										<div className="progress-bar-bg">
											<motion.div
												className="progress-bar"
												style={{ width: `0%` }}
												animate={{ width: `${w.utilization_pct}%`}}
												transition={{ duration: 1, ease: "circOut" }}
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
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

const KpiCard: React.FC<{ icon: React.ReactNode, title: string, value: string, cardClass: string }> = ({ icon, title, value, cardClass }) => (
	<motion.div className={`kpi-card ${cardClass}`}>
		<div className="kpi-card-header">
			<h4 className="kpi-card-title">{title}</h4>
			<div className="kpi-card-icon">
			 {icon}
			</div>
		</div>
		<div className="kpi-card-content">
			<div className="kpi-card-value">{value}</div>
		</div>
	</motion.div>
);

const StatusBadge: React.FC<{ status: WarehouseStatus }> = ({ status }) => {
	const statusClassName = `status-${status.replace(/_/g, '-').toLowerCase()}`;
	return (
		<span className={`status-badge ${statusClassName}`}>
			<span className="status-dot"></span>
			{status.replace(/_/g, ' ')}
		</span>
	);
};

const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
	<div className="empty-state">
		<div className="empty-state-content">
			<div className="empty-state-icon">
				<Package size={64} />
			</div>
			<h2 className="empty-state-title">No Warehouses Found</h2>
			<p className="empty-state-message">
				Get started by adding your first warehouse. Track inventory, manage capacity, and streamline your operations.
			</p>
			<Button onClick={onAdd} className="add-warehouse-btn">
				<PlusCircle className="icon" />
				Add Your First Warehouse
			</Button>
		</div>
	</div>
);

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
						<Button type="button" variant="outline" onClick={onClose} className="btn btn-outline">Cancel</Button>
						<Button type="submit" className="btn btn-primary">{warehouse ? 'Save Changes' : 'Add Warehouse'}</Button>
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
                        toast.success("Location selected from map!");
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
