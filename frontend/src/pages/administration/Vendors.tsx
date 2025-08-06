import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { MoreHorizontal, PlusCircle, X, Users, Shield, UserCheck, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import * as vendorService from '../../services/vendorService';
import './Vendors.css';

const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
    <div className="empty-state">
        <h2>No vendors found</h2>
        <p>Add your first vendor to get started.</p>
        <Button onClick={onAdd} className="add-vendor-btn">
            <PlusCircle className="icon" />
            Add New Vendor
        </Button>
    </div>
);

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

const vendorSchemaValidation = (isEditMode: boolean) => baseVendorSchema.extend({
    password: isEditMode
      ? z.string().optional().nullable()
      : z.string().min(8, "Password must be at least 8 characters"),
});

const Vendors: React.FC = () => {
    const [vendors, setVendors] = useState<VendorData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            setIsLoading(true);
            const data = await vendorService.getVendors();
            setVendors(data);
        } catch (error) {
            toast.error("Failed to fetch vendors.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddVendor = () => {
        setSelectedVendor(null);
        setIsModalOpen(true);
    };

    const handleEditVendor = (vendor: VendorData) => {
        setSelectedVendor(vendor);
        setIsModalOpen(true);
    };

    const handleDeleteVendor = async (id: string) => {
        toast.error("Are you sure you want to delete this vendor?", {
            action: {
              label: "Delete",
              onClick: async () => {
                try {
                    await vendorService.deleteVendor(id);
                    setVendors(vendors.filter(v => v.id !== id));
                    toast.success("Vendor deleted successfully!");
                } catch (error) {
                    toast.error("Failed to delete vendor.");
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

    const handleSaveVendor = async (data: VendorSchema) => {
        try {
            if (selectedVendor) {
                const updatedVendor = await vendorService.updateVendor(selectedVendor.id, data);
                setVendors(vendors.map(v => v.id === selectedVendor.id ? { ...updatedVendor, created_at: selectedVendor.created_at, stores: selectedVendor.stores } : v));
                toast.success("Vendor updated successfully!");
            } else {
                if (!data.password) {
                    toast.error("Password is required for new vendors.");
                    return;
                }
                const newVendor = await vendorService.createVendor(data as VendorSchema & { password: string });
                setVendors([...vendors, { ...newVendor, created_at: new Date().toISOString(), stores: [] }]);
                toast.success("Vendor added successfully!");
            }
            setIsModalOpen(false);
        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.detail) {
                toast.error(error.response.data.detail);
            } else {
                toast.error("An error occurred while saving the vendor.");
            }
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

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isLoading && vendors.length === 0) {
        return (
            <div className="page-content">
                <EmptyState onAdd={handleAddVendor} />
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

    return (
        <div className="page-content">
            <header className="header">
                <div className="header-text">
                    <h1>Vendor Management</h1>
                    <p>Administer vendor profiles, types, and statuses across the platform.</p>
                </div>
                <Button onClick={handleAddVendor} className="add-vendor-btn">
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
                <KpiCard icon={<Users className="icon"/>} title="Total Vendors" value={kpiData.totalVendors.toString()} cardClass="kpi-card-1" />
                <KpiCard icon={<UserCheck className="icon"/>} title="Active Vendors" value={kpiData.activeVendors.toString()} cardClass="kpi-card-2" />
                <KpiCard icon={<Shield className="icon"/>} title="Vendor Types" value={kpiData.vendorTypes.toString()} cardClass="kpi-card-3" />
            </motion.section>

            <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <div className="card-header">
                    <h3 className="card-title">Vendor Directory</h3>
                </div>
                <div className="card-content">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>Contact</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th className="text-right">Created On</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.map((vendor) => (
                                <tr key={vendor.id}>
                                    <td>
                                        <div className="vendor-name">{vendor.business_name}</div>
                                        <div className="vendor-registered-name">{vendor.registered_name}</div>
                                    </td>
                                    <td>
                                        {vendor.email && <div className="contact-info"><Mail size={14} /> {vendor.email}</div>}
                                        {vendor.phone_number && <div className="contact-info"><Phone size={14} /> {vendor.phone_number}</div>}
                                    </td>
                                    <td>
                                        <TypeBadge type={vendor.vendor_type} />
                                    </td>
                                    <td>
                                        <StatusBadge status={vendor.vendor_status} />
                                    </td>
                                    <td className="text-right">
                                        {new Date(vendor.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="actions-cell">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="action-btn">
                                                    <MoreHorizontal className="icon" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="dropdown-content">
                                                <DropdownMenuItem onClick={() => handleEditVendor(vendor)} className="dropdown-item">
                                                    <Edit className="icon" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteVendor(vendor.id)} className="dropdown-item danger">
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
        </div>
    );
};

const KpiCard: React.FC<{ icon: React.ReactNode, title: string, value: string, cardClass: string }> = ({ icon, title, value, cardClass }) => (
    <motion.div className={`kpi-card ${cardClass}`}>
        <div className="kpi-card-header">
            <h4 className="kpi-card-title">{title}</h4>
            <div className="kpi-card-icon">{icon}</div>
        </div>
        <div className="kpi-card-content">
            <div className="kpi-card-value">{value}</div>
        </div>
    </motion.div>
);

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
                        <Button type="button" variant="outline" onClick={onClose} className="btn btn-outline">Cancel</Button>
                        <Button type="submit" className="btn btn-primary">{vendor ? 'Save Changes' : 'Add Vendor'}</Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default Vendors;