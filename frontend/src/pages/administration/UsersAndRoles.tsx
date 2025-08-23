import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import TableCard from '../../components/table/TableCard';
import { useAuth } from '../../contexts/AuthContext';
import { MoreHorizontal, PlusCircle, X, Users, Shield, UserCheck, Edit, Trash2, Phone, MapPin, Search, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as notify from '../../lib/notify';
import * as userService from '../../services/userService';
import { getWarehouses } from '../../services/warehouseService';
import './UsersAndRoles.css';
import EmptyState from '../../components/EmptyState';
import KpiCard from '../../components/KpiCard';
import LoadingOverlay from '../../components/LoadingOverlay';
import { useConfig } from '../../contexts/ConfigContext';

const USER_STATUSES_TUPLE = ['ACTIVE', 'INACTIVE', 'PENDING'] as const;
const ROLE_TUPLE = ['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'] as const;

// Define a base schema for type inference
const baseUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().min(10, 'Phone must be at least 10 digits').optional().nullable(),
  address: z.string().min(5, 'Address must be at least 5 characters').optional().nullable(),
  role: z.enum(ROLE_TUPLE),
  status: z.enum(USER_STATUSES_TUPLE),
  password: z.string().optional().nullable(),
  warehouse_id: z.string().nullable().optional(),
});

export type UserSchema = z.infer<typeof baseUserSchema>;
export type UserStatus = (typeof USER_STATUSES_TUPLE)[number];
export type Role = (typeof ROLE_TUPLE)[number];

export type UserData = {
  id: string;
  name: string;
  email: string;
  phone_number?: string | null;
  address?: string | null;
  role: Role;
  status: UserStatus;
  last_login: string;
  warehouse_id: string | null;
};

const UsersAndRoles: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'' | UserStatus>('');
  const [roleFilter, setRoleFilter] = useState<'' | Role>('');
  const [whList, setWhList] = useState<Array<{ id: string; name: string }>>([]);
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'status' | 'last_login'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { formatDate } = useConfig();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const managerWarehouseId = (user as any)?.warehouse_id || null;

  useEffect(() => {
    fetchUsersWithWarehouses();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getWarehouses();
        const list = Array.isArray(data) ? data : [];
        const filtered = isManager && managerWarehouseId ? list.filter((w) => w.id === managerWarehouseId) : list;
        if (active) setWhList(filtered);
      } catch {
        // ignore fetch failure
      }
    })();
    return () => {
      active = false;
    };
  }, [isManager, managerWarehouseId]);

  const fetchUsersWithWarehouses = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getUsersWithWarehouses();
      setUsers(data);
    } catch (error) {
      // leave as-is for now (non-critical); TODO unify notify
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
    notify.show('Are you sure you want to delete this user?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await userService.deleteUser(id);
            setUsers(users.filter((u) => u.id !== id));
            notify.success('User deleted successfully!');
          } catch (error) {
            notify.error('Failed to delete user.');
            console.error(error);
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => notify.dismiss(),
      },
    });
  };

  const handleSaveUser = async (data: UserSchema) => {
    try {
      const userData = { ...data, warehouse_id: data.warehouse_id || null };

      if (selectedUser) {
        const updatedUser = await userService.updateUser(selectedUser.id, userData);
        setUsers(users.map((u) => (u.id === selectedUser.id ? { ...updatedUser, last_login: selectedUser.last_login } : u)));
        notify.success('User updated successfully!');
      } else {
        if (!userData.password) {
          notify.error('Password is required for new users.');
          return;
        }
        const newUser = await userService.createUser(userData as UserSchema & { password: string });
        setUsers([...users, { ...newUser, last_login: new Date().toISOString() }]);
        notify.success('User added successfully!');
      }

      setIsModalOpen(false);
    } catch (error: any) {
      if (error?.response?.data?.detail) {
        notify.error(error.response.data.detail);
      } else {
        notify.error('An error occurred while saving the user.');
      }
      console.error(error);
    }
  };

  const kpiData = useMemo(() => {
    const activeUsers = users.filter((u) => u.status);
    const totalUsers = users.length;
    const totalRoles = ROLE_TUPLE.length;

    return {
      totalUsers,
      activeUsers: activeUsers.length,
      totalRoles,
    };
  }, [users]);

  const displayedUsers = useMemo(() => {
    const filtered = users.filter((u) => {
      const t = searchTerm.trim().toLowerCase();
      const matchesTerm = !t ||
        u.name.toLowerCase().includes(t) ||
        u.email.toLowerCase().includes(t) ||
        (u.phone_number || '').toLowerCase().includes(t) ||
        (u.address || '').toLowerCase().includes(t);
      const matchesWh = !warehouseFilter || u.warehouse_id === warehouseFilter;
      const matchesStatus = !statusFilter || u.status === statusFilter;
      const matchesRole = !roleFilter || u.role === roleFilter;
      return matchesTerm && matchesWh && matchesStatus && matchesRole;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      if (sortBy === 'name') { va = a.name || ''; vb = b.name || ''; }
      else if (sortBy === 'role') { va = a.role || ''; vb = b.role || ''; }
      else if (sortBy === 'status') { va = a.status || ''; vb = b.status || ''; }
      else { va = a.last_login || ''; vb = b.last_login || ''; }
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [users, searchTerm, warehouseFilter, statusFilter, roleFilter, sortBy, sortDir]);

  const total = displayedUsers.length;
  const pagedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return displayedUsers.slice(start, end);
  }, [displayedUsers, page, pageSize]);

  const toggleSort = (key: 'name' | 'role' | 'status' | 'last_login') => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

  if (isLoading) {
    return <LoadingOverlay fullscreen label="Loading users" />;
  }

  if (!isLoading && users.length === 0) {
    return (
      <div className="page-content">
        <EmptyState
          icon={<Users size={64} />}
          title="No Users Found"
          message="Get started by adding your first user. Assign roles and manage access across the platform."
          actionLabel="Add Your First User"
          actionIcon={<PlusCircle className="icon" />}
          onAction={handleAddUser}
        />
        <AnimatePresence>
          {isModalOpen && (
            <UserModal user={selectedUser} onClose={() => setIsModalOpen(false)} onSave={handleSaveUser} />
          )}
        </AnimatePresence>
      </div>
    );
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
        <KpiCard icon={<Users className="icon" />} title="Total Users" value={kpiData.totalUsers} variant="indigo" />
        <KpiCard icon={<UserCheck className="icon" />} title="Active Users" value={kpiData.activeUsers} variant="emerald" />
        <KpiCard icon={<Shield className="icon" />} title="System Roles" value={kpiData.totalRoles} variant="orange" />
      </motion.section>

  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
  <TableCard
    variant="inbound"
  title="User Directory"
  warehouse={isAdmin ? (
          <div className="form-field" style={{ minWidth: 220 }}>
          <label>Warehouse</label>
          <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
            <option value="">All</option>
            {whList.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          </div>
        ) : undefined}
            search={(
                  <div className="form-field" style={{ maxWidth: 340 }}>
                    <label>Search</label>
                    <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 8, top: '50%', transform:'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
              <input
                style={{ paddingLeft: 30 }}
                placeholder="Name / Email / Phone / Address"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                onKeyDown={(e)=> { if (e.key==='Enter') { setPage(1); } }}
              />
                    </div>
                  </div>
                )}
            filters={(
              <>
                <div className="form-field" style={{ flex: '0 0 auto', width: 'auto', display: 'inline-flex', alignItems: 'center' }}>
                  <label>Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                    style={{ width: 'auto' }}
                  >
                    <option value="">All</option>
                    {USER_STATUSES_TUPLE.map((v) => (<option key={v} value={v}>{v}</option>))}
                  </select>
                </div>
                <div className="form-field" style={{ flex: '0 0 auto', width: 'auto', display: 'inline-flex', alignItems: 'center' }}>
                  <label>Role</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value as any); setPage(1); }}
                    style={{ width: 'auto' }}
                  >
                    <option value="">All</option>
                    {ROLE_TUPLE.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </div>
              </>
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
                <TableHead onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }} title="Sort by User">
                  User
                  {sortBy === 'name' && (
                    <span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead onClick={() => toggleSort('role')} style={{ cursor: 'pointer' }} title="Sort by Role">
                  Role
                  {sortBy === 'role' && (
                    <span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </TableHead>
                <TableHead onClick={() => toggleSort('status')} style={{ cursor: 'pointer' }} title="Sort by Status">
                  Status
                  {sortBy === 'status' && (
                    <span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </TableHead>
                <TableHead onClick={() => toggleSort('last_login')} style={{ cursor: 'pointer' }} title="Sort by Last Login">
                  Last Login
                  {sortBy === 'last_login' && (
                    <span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    {user.phone_number && (
                      <div className="contact-info">
                        <Phone size={14} /> {user.phone_number}
                      </div>
                    )}
                    {user.address && (
                      <div className="contact-info">
                        <MapPin size={14} /> {user.address}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell className="text-right last-login-text">{user.last_login ? formatDate(user.last_login) : 'N/A'}</TableCell>
                  <TableCell className="actions-cell">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <UserModal
            user={selectedUser}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveUser}
            currentUserRole={(user as any)?.role as any}
            currentUserWarehouseId={managerWarehouseId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

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
  return <span className={`role-badge ${roleClassName}`}>{role}</span>;
};

// Ensure userSchema is defined before UserModal
const userSchema = (isEditMode: boolean) =>
  baseUserSchema.extend({
    password: isEditMode ? z.string().optional().nullable() : z.string().min(8, 'Password must be at least 8 characters'),
  });

const UserModal: React.FC<{ user: UserData | null; onClose: () => void; onSave: (data: UserSchema) => void; currentUserRole?: Role; currentUserWarehouseId?: string | null }> = ({
  user,
  onClose,
  onSave,
  currentUserRole,
  currentUserWarehouseId,
}) => {
  const isEditMode = user !== null;
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<UserSchema>({
    resolver: zodResolver(userSchema(isEditMode)),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || '',
      address: user?.address || '',
      role: user?.role || 'VIEWER',
      status: user?.status || 'PENDING',
      warehouse_id: user?.warehouse_id || (!isEditMode && currentUserRole === 'MANAGER' ? currentUserWarehouseId || '' : null),
    },
  });

  type Warehouse = { id: string; name: string };
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const role = watch('role');
  const isAdminCtx = currentUserRole === 'ADMIN';
  const isManagerCtx = currentUserRole === 'MANAGER';

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await getWarehouses();
      const list = Array.isArray(data) ? data : [];
      const filtered = isManagerCtx && currentUserWarehouseId ? list.filter((w) => w.id === currentUserWarehouseId) : list;
      if (active) setWarehouses(filtered);
    })();
    return () => {
      active = false;
    };
  }, [getWarehouses, isManagerCtx, currentUserWarehouseId]);

  useEffect(() => {
    if (user) {
      const selectedWarehouse = warehouses.find((w) => w.id === user.warehouse_id);
      reset({
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
        role: user.role,
        status: user.status,
        warehouse_id: selectedWarehouse ? selectedWarehouse.id : '',
      });
    }
  }, [user, warehouses, reset]);

  const onSubmit = (data: UserSchema) => onSave(data);

  const InputField = ({
    name,
    label,
    type = 'text',
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
      <input type={type} id={name} {...register(name)} placeholder={placeholder} className={error ? 'error' : ''} />
      {error && <p className="error-message">{error.message}</p>}
    </div>
  );

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="modal-content"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
            <InputField name="password" label="Password" type="password" register={register} error={errors.password} placeholder={user ? 'Leave blank to keep current password' : 'Enter a secure password'} />

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select id="role" {...register('role')} className={errors.role ? 'error' : ''}>
                {ROLE_TUPLE
                  .filter((r) => !(isManagerCtx && r === 'ADMIN'))
                  .map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                ))}
              </select>
              {errors.role?.message && <p className="error-message">{String(errors.role.message)}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" {...register('status')} className={errors.status ? 'error' : ''}>
                {USER_STATUSES_TUPLE.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.status?.message && <p className="error-message">{String(errors.status.message)}</p>}
            </div>

    {role !== 'ADMIN' && (
              <div className="form-group">
                <label htmlFor="warehouse_id">Warehouse</label>
                <select
                  id="warehouse_id"
                  {...register('warehouse_id', {
                    required: 'Warehouse is required for non-ADMIN roles',
                    validate: (value) => value !== '' || 'Please select a valid warehouse',
                  })}
                  className={errors.warehouse_id ? 'error' : ''}
      value={watch('warehouse_id') || ''}
      disabled={isManagerCtx}
                  onChange={(e) => {
                    const updatedValue = e.target.value;
                    reset({ ...watch(), warehouse_id: updatedValue });
                  }}
                >
      <option value="">Select a warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {errors.warehouse_id && <p className="error-message">{errors.warehouse_id.message}</p>}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <Button type="button" onClick={onClose} className="btn-outline-token">
              Cancel
            </Button>
            <Button type="submit" className="btn-primary-token">
              {user ? 'Save Changes' : 'Add User'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UsersAndRoles;
