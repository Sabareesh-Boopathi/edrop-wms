import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Warehouse } from 'types';
import { Bay, BayType, VehicleSize, VehicleType } from '../types/bay';

interface BayFormModalProps {
  warehouses: Warehouse[];
  initial?: Partial<Bay>;
  onCancel: () => void;
  onSave: (values: Omit<Bay, 'created_at'|'updated_at'|'utilizationPct'>) => void;
}

const schema = z.object({
  id: z.string().min(2).optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  warehouse_id: z.string().min(1, 'Select a warehouse'),
  type: z.custom<BayType>(),
  dynamicMode: z.enum(['GOODS_IN','GOODS_OUT']).optional(),
  capacity: z.number().int().min(1),
  vehicleCompat: z.array(z.enum(['SMALL','MEDIUM','LARGE'] as const satisfies Readonly<VehicleSize[]>)).min(1, 'Select at least 1'),
  status: z.enum(['EMPTY','RESERVED','VEHICLE_PRESENT','MAINTENANCE']),
  reserved_for: z.object({ ref: z.string(), direction: z.enum(['IN','OUT']), eta: z.string().optional() }).optional(),
  vehicle: z.object({ reg: z.string(), type: z.custom<VehicleType>(), carrier: z.string().optional(), vendor: z.string().optional() }).optional(),
  operation: z.enum(['UNLOADING','LOADING']).optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

const BayFormModal: React.FC<BayFormModalProps> = ({ warehouses, initial, onCancel, onSave }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: initial?.id,
      name: initial?.name || '',
      warehouse_id: initial?.warehouse_id || (warehouses[0]?.id || ''),
      type: initial?.type || 'GOODS_IN',
      dynamicMode: initial?.dynamicMode || 'GOODS_IN',
      capacity: initial?.capacity || 1,
      vehicleCompat: initial?.vehicleCompat || ['SMALL','MEDIUM'],
      status: initial?.status || 'EMPTY',
      reserved_for: initial?.reserved_for,
      vehicle: initial?.vehicle,
      operation: initial?.operation,
      progressPct: initial?.progressPct,
    },
  });

  const onSubmit = (data: FormValues) => {
    const now = new Date().toISOString();
    const base: Omit<Bay, 'created_at'|'updated_at'|'utilizationPct'> = {
      id: data.id || `BAY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      name: data.name,
      warehouse_id: data.warehouse_id,
      type: data.type as BayType,
      dynamicMode: data.type === 'DYNAMIC' ? data.dynamicMode : undefined,
      capacity: data.capacity,
      vehicleCompat: data.vehicleCompat,
      status: data.status,
      reserved_for: data.reserved_for,
      vehicle: data.vehicle,
      operation: data.operation,
      progressPct: data.progressPct,
      // created_at/updated_at handled in service
    };
    onSave(base);
  };

  const type = watch('type');
  const compat = watch('vehicleCompat');
  const toggleCompat = (v: VehicleSize) => {
    const next = compat.includes(v) ? compat.filter(x => x !== v) : [...compat, v];
    setValue('vehicleCompat', next);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initial?.id ? 'Edit Bay' : 'Add Bay'}</h2>
          <button className="close-button" onClick={onCancel}>&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Warehouse</label>
                <select {...register('warehouse_id')}>
                  {warehouses.map(w => <option key={w.id} value={String(w.id)}>{String(w.name)}</option>)}
                </select>
                {errors.warehouse_id?.message && <p className="error-message">{String(errors.warehouse_id.message)}</p>}
              </div>
              <div className="form-group">
                <label>Name</label>
                <input {...register('name')} placeholder="e.g., Gate A1" />
                {errors.name?.message && <p className="error-message">{String(errors.name.message)}</p>}
              </div>
              <div className="form-group">
                <label>Type</label>
                <select {...register('type')}>
                  <option value="GOODS_IN">Goods In</option>
                  <option value="GOODS_OUT">Goods Out</option>
                  <option value="DYNAMIC">Dynamic</option>
                  <option value="PARKING">Parking</option>
                </select>
              </div>
              {type === 'DYNAMIC' && (
                <div className="form-group">
                  <label>Dynamic Mode</label>
                  <select {...register('dynamicMode')}>
                    <option value="GOODS_IN">Goods In</option>
                    <option value="GOODS_OUT">Goods Out</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Capacity</label>
                <input type="number" min={1} {...register('capacity', { valueAsNumber: true })} />
              </div>
              <div className="form-group">
                <label>Vehicle Compatibility</label>
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  {(['SMALL','MEDIUM','LARGE'] as VehicleSize[]).map(v => (
                    <button type="button" key={v} className={`pill ${compat.includes(v) ? 'active' : ''}`} onClick={()=>toggleCompat(v)}>
                      {v}
                    </button>
                  ))}
                </div>
                {errors.vehicleCompat?.message && <p className="error-message">{String(errors.vehicleCompat.message)}</p>}
              </div>
              <div className="form-group">
                <label>Status</label>
                <select {...register('status')}>
                  <option value="EMPTY">Empty</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="VEHICLE_PRESENT">Vehicle Present</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-outline-token" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary-token">{initial?.id ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BayFormModal;
