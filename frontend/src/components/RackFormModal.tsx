import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Rack, Warehouse } from 'types';
import './RackDetailModal.css';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useConfig } from '../contexts/ConfigContext';
import { useAuth } from '../contexts/AuthContext';

interface RackFormModalProps {
  warehouseId: string;
  allWarehouses: Warehouse[];
  rack?: Rack;
  onCancel: () => void;
  // onSave now can receive optional count (for bulk create). If editing, count will be ignored.
  onSave: (values: Omit<Rack, 'id' | 'total_bins' | 'occupied_bins'> & { id?: string; warehouse_id: string; count?: number }) => void;
}

const RACK_STATUSES_TUPLE = ['active', 'maintenance', 'inactive'] as const;

const rackSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  warehouse_id: z.string().min(1, 'Please select a warehouse'),
  stacks: z.number().int('Stacks must be a whole number').min(1, 'Stacks must be at least 1'),
  bins_per_stack: z.number().int('Bins per stack must be a whole number').min(1, 'Bins per stack must be at least 1'),
  description: z.string().optional().nullable(),
  status: z.enum(RACK_STATUSES_TUPLE),
  // Quantity only applies for create; allow 1..100
  count: z.number().int().min(1, 'Min 1').max(100, 'Max 100').default(1),
});

type RackFormValues = z.infer<typeof rackSchema>;

const RackFormModal: React.FC<RackFormModalProps> = ({ warehouseId, allWarehouses, rack, onCancel, onSave }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const mappedWarehouseId = (user?.warehouse_id ?? (typeof window !== 'undefined' ? localStorage.getItem('AUTH_USER_WAREHOUSE_ID') : '') ?? '') as string;
  const { config } = useConfig();
  const maxStacks = Number(config.maxStackHeight || 0);
  const maxBinsPer = Number(config.maxBinsPerRack || 0);

  const { register, handleSubmit, formState: { errors }, reset, watch, setError, clearErrors } = useForm<RackFormValues>({
    resolver: zodResolver(rackSchema),
    defaultValues: {
      name: rack?.name ? String(rack.name) : 'Auto-generated',
      warehouse_id: rack?.warehouse_id ? String(rack.warehouse_id) : String((isAdmin ? (warehouseId || '') : (mappedWarehouseId || warehouseId || ''))),
      stacks: rack?.stacks ? Number(rack.stacks) : 1,
      bins_per_stack: rack?.bins_per_stack ? Number(rack.bins_per_stack) : 1,
      description: rack?.description ? String(rack.description) : '',
      status: (rack as any)?.status ? String((rack as any).status) as typeof RACK_STATUSES_TUPLE[number] : 'active',
      count: 1,
    },
  });

  useEffect(() => {
    reset({
      name: rack?.name ? String(rack.name) : 'Auto-generated',
      warehouse_id: rack?.warehouse_id ? String(rack.warehouse_id) : String(warehouseId || ''),
      stacks: rack?.stacks ? Number(rack.stacks) : 1,
      bins_per_stack: rack?.bins_per_stack ? Number(rack.bins_per_stack) : 1,
      description: rack?.description ? String(rack.description) : '',
      status: (rack as any)?.status ? String((rack as any).status) as typeof RACK_STATUSES_TUPLE[number] : 'active',
      count: 1,
    });
  }, [rack, warehouseId, reset]);

  useEffect(() => {
    const sub = watch((values) => {
      if (maxStacks > 0 && values.stacks && values.stacks > maxStacks) {
        setError('stacks', { type: 'validate', message: `Must be <= ${maxStacks}` });
      } else {
        clearErrors('stacks');
      }
      if (maxBinsPer > 0 && values.bins_per_stack && values.bins_per_stack > maxBinsPer) {
        setError('bins_per_stack', { type: 'validate', message: `Must be <= ${maxBinsPer}` });
      } else {
        clearErrors('bins_per_stack');
      }
    });
    return () => sub.unsubscribe();
  }, [watch, maxStacks, maxBinsPer, setError, clearErrors]);

  const onSubmit = (data: RackFormValues) => {
    if (maxStacks > 0 && data.stacks > maxStacks) return;
    if (maxBinsPer > 0 && data.bins_per_stack > maxBinsPer) return;
    onSave({
      id: rack?.id,
      name: data.name,
      warehouse_id: data.warehouse_id,
      stacks: data.stacks,
      bins_per_stack: data.bins_per_stack,
      description: data.description || undefined,
      status: data.status,
      // only meaningful for create (no existing rack)
      count: rack ? undefined : data.count || 1,
    } as any);
  };

  const Field = ({
    name,
    label,
    type = 'text',
    error,
    placeholder,
    min,
  }: {
    name: keyof RackFormValues;
    label: string;
    type?: string;
    error?: { message?: string };
    placeholder?: string;
    min?: number;
  }) => (
    <div className="form-group">
      <label htmlFor={String(name)}>{label}</label>
      <input
        id={String(name)}
        type={type}
        placeholder={placeholder}
        className={error ? 'error' : ''}
        {...register(name as any, {
          valueAsNumber: type === 'number',
          max: name === 'stacks' && maxStacks > 0 ? maxStacks : name === 'bins_per_stack' && maxBinsPer > 0 ? maxBinsPer : undefined,
          onChange: (e: any) => {
            if (type === 'number') {
              const raw = Number(e.target.value);
              const limit = name === 'stacks' ? (maxStacks > 0 ? maxStacks : undefined) : name === 'bins_per_stack' ? (maxBinsPer > 0 ? maxBinsPer : undefined) : undefined;
              if (limit && raw > limit) {
                e.target.value = String(limit);
              }
            }
          },
        })}
        min={min}
        max={name === 'stacks' && maxStacks > 0 ? maxStacks : name === 'bins_per_stack' && maxBinsPer > 0 ? maxBinsPer : undefined}
      />
      {error?.message && <p className="error-message">{String(error.message)}</p>}
    </div>
  );

  return createPortal(
    <div className="modal-overlay rack-form-overlay" onClick={onCancel}>
      <div className="modal-content rack-form-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{rack ? 'Edit Rack' : 'Add Rack'}</h2>
          <button className="close-button" onClick={onCancel}>&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="warehouse_id">Warehouse</label>
                <select id="warehouse_id" className={errors.warehouse_id ? 'error' : ''} {...register('warehouse_id')} disabled={!isAdmin}>
                  {!warehouseId && !rack?.warehouse_id && <option value="" disabled>Select a warehouse</option>}
                  {allWarehouses.map((w) => (
                    <option key={w.id} value={String(w.id)}>{String(w.name ?? '')}</option>
                  ))}
                </select>
                {!isAdmin && <p className="hint" style={{fontSize:12,color:'var(--color-text-muted)'}}>Only admins can change warehouse.</p>}
                {errors.warehouse_id?.message && <p className="error-message">{String(errors.warehouse_id.message)}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="name">
                  Name
                  <span title="This field is auto-populated from System Configuration (rackPrefix + 3-digit sequence) and cannot be edited."> ⓘ</span>
                </label>
                <input id="name" readOnly style={{ background: 'var(--color-surface-muted)', cursor: 'not-allowed' }} {...register('name')} />
                {errors.name?.message && <p className="error-message">{String(errors.name.message)}</p>}
              </div>

              <div>
                <Field name="stacks" label="Stacks (rows)" type="number" min={1} error={errors.stacks} />
                {maxStacks > 0 && watch('stacks') >= maxStacks && (
                  <p style={{marginTop:-6,fontSize:11,color:'#b45309'}}>Max allowed stacks reached ({maxStacks}).</p>
                )}
              </div>
              <div>
                <Field name="bins_per_stack" label="Bins per Stack (cols)" type="number" min={1} error={errors.bins_per_stack} />
                {maxBinsPer > 0 && watch('bins_per_stack') >= maxBinsPer && (
                  <p style={{marginTop:-6,fontSize:11,color:'#b45309'}}>Max allowed bins per stack reached ({maxBinsPer}).</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input id="description" className={errors.description ? 'error' : ''} {...register('description')} placeholder="Optional" />
                {errors.description?.message && <p className="error-message">{String(errors.description.message)}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select id="status" className={errors.status ? 'error' : ''} {...register('status')}>
                  {RACK_STATUSES_TUPLE.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.status?.message && <p className="error-message">{String(errors.status.message)}</p>}
              </div>

              {!rack && (
                <div className="form-group">
                  <label htmlFor="count">Quantity
                    <span title="Number of racks to auto-generate sequentially (max 100). Names will be assigned automatically."> ⓘ</span>
                  </label>
                  <input id="count" type="number" min={1} max={100} defaultValue={1} {...register('count', { valueAsNumber: true })} />
                  {errors.count?.message && <p className="error-message">{String(errors.count.message)}</p>}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-outline-token" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary-token">{rack ? 'Update' : 'Create Rack(s)'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RackFormModal;
