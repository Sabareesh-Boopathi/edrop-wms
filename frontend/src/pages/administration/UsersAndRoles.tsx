import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { MoreHorizontal, PlusCircle, X, Users, Shield, UserCheck, Edit, Trash2, Mail, User, Phone, MapPin } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import * as userService from '../../services/userService';
import './UsersAndRoles.css';

const USER_STATUSES_TUPLE = ["ACTIVE", "INACTIVE", "PENDING"] as const;
const ROLE_TUPLE = ["ADMIN", "MANAGER", "OPERATOR", "VIEWER"] as const;

// Define a base schema for type inference
const baseUserSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(10, "Phone must be at least 10 digits").optional().nullable(),
  address: z.string().min(5, "Address must be at least 5 characters").optional().nullable(),
  role: z.enum(ROLE_TUPLE),
  status: z.enum(USER_STATUSES_TUPLE),
  password: z.string().optional().nullable(),
});

export type UserSchema = z.infer<typeof baseUserSchema>;
export type UserStatus = typeof USER_STATUSES_TUPLE[number];
export type Role = typeof ROLE_TUPLE[number];

export type UserData = {
    id: string;
    name: string;
    email: string;
    phone_number?: string | null;
    address?: string | null;
    role: Role;
    status: UserStatus;
    last_login: string;
};

const UsersAndRoles: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const data = await userService.getUsers();
            setUsers(data);
        } catch (error) {
            toast.error("Failed to fetch users.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddUser = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: UserData) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (id: string) => {
        toast.error("Are you sure you want to delete this user?", {
            action: {
              label: "Delete",
              onClick: async () => {
                try {
                    await userService.deleteUser(id);
                    setUsers(users.filter(u => u.id !== id));
                    toast.success("User deleted successfully!");
                } catch (error) {
                    toast.error("Failed to delete user.");
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

    const handleSaveUser = async (data: UserSchema) => {
        try {
            const userData = { ...data };

            // Handle user update or creation
            if (selectedUser) {
                const updatedUser = await userService.updateUser(selectedUser.id, userData);
                setUsers(users.map(u => u.id === selectedUser.id ? { ...updatedUser, last_login: selectedUser.last_login } : u));
                toast.success("User updated successfully!");
            } else {
                if (!userData.password) {
                    toast.error("Password is required for new users.");
                    return;
                }
                const newUser = await userService.createUser(userData as UserSchema & { password: string });
                setUsers([...users, { ...newUser, last_login: new Date().toISOString() }]);
                toast.success("User added successfully!");
            }

            setIsModalOpen(false);
        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.detail) {
                toast.error(error.response.data.detail);
            } else {
                toast.error("An error occurred while saving the user.");
            }
            console.error(error);
        }
    };

    const kpiData = useMemo(() => {
        const activeUsers = users.filter(u => u.status);
        const totalUsers = users.length;
        const totalRoles = ROLE_TUPLE.length;
        
        return {
            totalUsers,
            activeUsers: activeUsers.length,
            totalRoles,
        };
    }, [users]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="page-content">
            <header className="header">
                <div className="header-text">
                    <h1>User & Role Management</h1>
                    <p>Administer user access, roles, and permissions across the platform.</p>
                </div>
                <Button onClick={handleAddUser} className="add-user-btn">
                    <PlusCircle className="icon" />
                    Add New User
                </Button>
            </header>

            <motion.section
                className="kpi-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, staggerChildren: 0.1 }}
            >
                <KpiCard icon={<Users className="icon"/>} title="Total Users" value={kpiData.totalUsers.toString()} cardClass="kpi-card-1" />
                <KpiCard icon={<UserCheck className="icon"/>} title="Active Users" value={kpiData.activeUsers.toString()} cardClass="kpi-card-2" />
                <KpiCard icon={<Shield className="icon"/>} title="System Roles" value={kpiData.totalRoles.toString()} cardClass="kpi-card-3" />
            </motion.section>

            <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <div className="card-header">
                    <h3 className="card-title">User Directory</h3>
                </div>
                <div className="card-content">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Contact</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th className="text-right">Last Login</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-name">{user.name}</div>
                                        <div className="user-email">{user.email}</div>
                                    </td>
                                    <td>
                                        {user.phone_number && <div className="contact-info"><Phone size={14} /> {user.phone_number}</div>}
                                        {user.address && <div className="contact-info"><MapPin size={14} /> {user.address}</div>}
                                    </td>
                                    <td>
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td>
                                        <StatusBadge status={user.status} />
                                    </td>
                                    <td className="text-right last-login-text">
                                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="actions-cell">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="action-btn">
                                                    <MoreHorizontal className="icon" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="dropdown-content">
                                                <DropdownMenuItem onClick={() => handleEditUser(user)} className="dropdown-item">
                                                    <Edit className="icon" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="dropdown-item danger">
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
                    <UserModal
                        user={selectedUser}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSaveUser}
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

const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
    const statusClassName = `status-${status.toLowerCase()}`;
    return (
        <span className={`status-badge ${statusClassName}`}>
            <span className="status-dot"></span>
            {status}
        </span>
    );
};

const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
    const roleClassName = `role-${role.toLowerCase()}`;
    return (
        <span className={`role-badge ${roleClassName}`}>
            {role}
        </span>
    );
};

// Ensure userSchema is defined before UserModal
const userSchema = (isEditMode: boolean) => baseUserSchema.extend({
  password: isEditMode
    ? z.string().optional().nullable()
    : z.string().min(8, "Password must be at least 8 characters"),
});

const UserModal: React.FC<{ user: UserData | null, onClose: () => void, onSave: (data: UserSchema) => void }> = ({ user, onClose, onSave }) => {
    const isEditMode = user !== null;
    const { register, handleSubmit, formState: { errors } } = useForm<UserSchema>({
        resolver: zodResolver(userSchema(isEditMode)),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            phone_number: user?.phone_number || '',
            address: user?.address || '',
            role: user?.role || 'VIEWER',
            status: user?.status || 'PENDING',
        }
    });

    const onSubmit = (data: UserSchema) => {
        onSave(data);
    };

    const InputField = ({
        name,
        label,
        type = "text",
        register,
        error,
        placeholder,
    }: {
        name: keyof UserSchema;
        label: string;
        type?: string;
        register: any;
        error?: { message?: string };
        placeholder?: string;
    }) => (
        <div className="form-group">
            <label htmlFor={name}>{label}</label>
            <input
                type={type}
                id={name}
                {...register(name)}
                placeholder={placeholder}
                className={error ? "error" : ""}
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
                    <h3 className="modal-title">{user ? 'Edit User' : 'Add New User'}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="close-btn">
                        <X size={24} />
                    </Button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="modal-form">
                        <div className="form-grid">
                        <InputField name="name" label="Full Name" register={register} error={errors.name} placeholder="e.g., John Doe" />
                        <InputField name="email" label="Email Address" type="email" register={register} error={errors.email} placeholder="e.g., john.doe@example.com" />
                        <InputField name="phone_number" label="Phone Number" register={register} error={errors.phone_number} placeholder="e.g., 9876543210" />
                        <InputField name="address" label="Address" register={register} error={errors.address} placeholder="e.g., 123 Main St, Anytown" />
                        <InputField 
                            name="password" 
                            label="Password" 
                            type="password" 
                            register={register} 
                            error={errors.password} 
                            placeholder={user ? "Leave blank to keep current password" : "Enter a secure password"} 
                        />

                        <div className="form-group">
                            <label htmlFor="role">Role</label>
                            <select id="role" {...register("role")} className={errors.role ? 'error' : ''}>
                                {ROLE_TUPLE.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                            {errors.role?.message && <p className="error-message">{String(errors.role.message)}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">Status</label>
                            <select id="status" {...register("status")} className={errors.status ? 'error' : ''}>
                                {USER_STATUSES_TUPLE.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            {errors.status?.message && <p className="error-message">{String(errors.status.message)}</p>}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <Button type="button" variant="outline" onClick={onClose} className="btn btn-outline">Cancel</Button>
                        <Button type="submit" className="btn btn-primary">{user ? 'Save Changes' : 'Add User'}</Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default UsersAndRoles;
