import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { MoreHorizontal, PlusCircle, X, BarChart2, Home, Package, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import './WarehouseManagement.css';

const WAREHOUSE_STATUSES_TUPLE = ["Active", "Inactive", "Near Capacity"] as const;

const warehouseSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  capacity: z.number().min(1, "Capacity must be greater than 0"),
  status: z.enum(WAREHOUSE_STATUSES_TUPLE),
});

type WarehouseSchema = z.infer<typeof warehouseSchema>;

// Define types first
type WarehouseStatus = typeof WAREHOUSE_STATUSES_TUPLE[number];

type Warehouse = {
	id: number;
	name: string;
	location: string;
	capacity: number;
	utilization: number;
	status: WarehouseStatus;
	items: number;
};

// Mock data for warehouses - expanded for more realistic demo
const initialWarehouses: Warehouse[] = [
	{
		id: 1,
		name: 'Main Distribution Center',
		location: 'New York, NY',
		capacity: 100000,
		utilization: 85,
		status: 'Active',
		items: 85000,
	},
	{
		id: 2,
		name: 'West Coast Hub',
		location: 'Los Angeles, CA',
		capacity: 75000,
		utilization: 60,
		status: 'Active',
		items: 45000,
	},
	{
		id: 3,
		name: 'Midwest Annex',
		location: 'Chicago, IL',
		capacity: 50000,
		utilization: 95,
		status: 'Near Capacity',
		items: 47500,
	},
	{
		id: 4,
		name: 'Southern Regional',
		location: 'Atlanta, GA',
		capacity: 60000,
		utilization: 70,
		status: 'Active',
		items: 42000,
	},
	{
		id: 5,
		name: 'Overflow Storage',
		location: 'Phoenix, AZ',
		capacity: 25000,
		utilization: 40,
		status: 'Inactive',
		items: 10000,
	},
	{
		id: 6,
		name: 'Northeast Depot',
		location: 'Boston, MA',
		capacity: 80000,
		utilization: 88,
		status: 'Active',
		items: 70400,
	},
];

const WarehouseManagement: React.FC = () => {
	const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

	const handleAddWarehouse = () => {
		setSelectedWarehouse(null);
		setIsModalOpen(true);
	};

	const handleEditWarehouse = (warehouse: Warehouse) => {
		setSelectedWarehouse(warehouse);
		setIsModalOpen(true);
	};

	const handleDeleteWarehouse = (id: number) => {
        toast.error("Are you sure you want to delete this warehouse?", {
            action: {
              label: "Delete",
              onClick: () => {
                setWarehouses(warehouses.filter(w => w.id !== id));
                toast.success("Warehouse deleted successfully!");
              },
            },
            cancel: {
              label: "Cancel",
              onClick: () => toast.dismiss(),
            },
          });
	};

	const handleSaveWarehouse = (warehouseData: WarehouseSchema) => {
		if (selectedWarehouse) {
			// Edit existing
			const updatedWarehouse = { ...selectedWarehouse, ...warehouseData };
			setWarehouses(warehouses.map(w => w.id === selectedWarehouse.id ? updatedWarehouse : w));
            toast.success("Warehouse updated successfully!");
		} else {
			// Add new
			const newWarehouse: Warehouse = {
				id: Date.now(),
				...warehouseData,
				utilization: 0, // New warehouses start empty
				items: 0,
			};
			setWarehouses([...warehouses, newWarehouse]);
            toast.success("Warehouse added successfully!");
		}
		setIsModalOpen(false);
	};

	const kpiData = useMemo(() => {
		const activeWarehouses = warehouses.filter(w => w.status !== 'Inactive');
		const totalCapacity = activeWarehouses.reduce((acc, w) => acc + w.capacity, 0);
		const totalItems = activeWarehouses.reduce((acc, w) => acc + w.items, 0);
		const overallUtilization = totalCapacity > 0 ? Math.round((totalItems / totalCapacity) * 100) : 0;
		return {
			count: activeWarehouses.length,
			totalCapacity,
			overallUtilization,
		};
	}, [warehouses]);

	return (
		<div className="page-content">
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
				<KpiCard icon={<Home className="icon-indigo"/>} title="Active Warehouses" value={kpiData.count.toString()} />
				<KpiCard icon={<Package className="icon-green"/>} title="Total Capacity" value={`${(kpiData.totalCapacity / 1000).toFixed(0)}k units`} />
				<KpiCard icon={<BarChart2 className="icon-amber"/>} title="Overall Utilization" value={`${kpiData.overallUtilization}%`} />
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
												<div className="warehouse-location">{warehouse.location}</div>
											</td>
											<td>
												<StatusBadge status={warehouse.status} />
											</td>
											<td className="text-right utilization-text">{warehouse.utilization}%</td>
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
											<p className="utilization-text">{w.utilization}%</p>
										</div>
										<div className="progress-bar-bg">
											<motion.div
												className="progress-bar"
												style={{ width: `0%` }}
												animate={{ width: `${w.utilization}%`}}
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

const KpiCard: React.FC<{ icon: React.ReactNode, title: string, value: string }> = ({ icon, title, value }) => (
	<motion.div className="kpi-card">
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
	const statusClassName = `status-${status.replace(' ', '-')}`;
	return (
		<span className={`status-badge ${statusClassName}`}>
			<span className="status-dot"></span>
			{status}
		</span>
	);
};

const WarehouseModal: React.FC<{ warehouse: Warehouse | null, onClose: () => void, onSave: (data: WarehouseSchema) => void }> = ({ warehouse, onClose, onSave }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<WarehouseSchema>({
        resolver: zodResolver(warehouseSchema),
        defaultValues: {
            name: warehouse?.name || '',
            location: warehouse?.location || '',
            capacity: warehouse?.capacity || undefined,
            status: warehouse?.status || 'Active',
        }
    });

	const onSubmit = (data: WarehouseSchema) => {
		onSave(data);
	};

	const InputField = ({ name, label, type = "text", register, error, placeholder }: { name: keyof WarehouseSchema, label: string, type?: string, register: any, error?: { message?: string }, placeholder?: string }) => (
		<div className="form-group">
			<label htmlFor={name}>{label}</label>
			<input 
				type={type} 
				id={name} 
				{...register(name, { valueAsNumber: type === 'number' })} 
				placeholder={placeholder}
				className={error ? 'error' : ''} 
			/>
			{error && <p className="error-message">{error.message}</p>}
		</div>
	);

	return (
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
				<form onSubmit={handleSubmit(onSubmit)} noValidate>
					<div className="form-grid">
						<InputField name="name" label="Warehouse Name" register={register} error={errors.name} placeholder="e.g., Main Distribution Center" />
						<InputField name="location" label="Location" register={register} error={errors.location} placeholder="e.g., New York, NY" />
						<InputField name="capacity" label="Capacity (units)" type="number" register={register} error={errors.capacity} placeholder="e.g., 100000" />
						
						<div className="form-group">
							<label htmlFor="status">Status</label>
							<select 
								id="status" 
								{...register("status")} 
								className={errors.status ? 'error' : ''}
							>
								{WAREHOUSE_STATUSES_TUPLE.map(status => (
									<option key={status} value={status}>{status}</option>
								))}
							</select>
                            {errors.status?.message && <p className="error-message">{String(errors.status.message)}</p>}
						</div>
					</div>
					<div className="modal-footer">
						<Button type="button" variant="outline" onClick={onClose} className="btn btn-outline">
							Cancel
						</Button>
						<Button type="submit" className="btn btn-primary">
							{warehouse ? 'Save Changes' : 'Create Warehouse'}
						</Button>
					</div>
				</form>
			</motion.div>
		</motion.div>
	);
};

export default WarehouseManagement;
