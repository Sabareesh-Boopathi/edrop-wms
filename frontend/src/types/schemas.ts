import { z } from 'zod';

export const OrderSchema = z.object({
  id: z.string(),
  total_amount: z.union([z.number(), z.string()]).optional(),
});
export const OrdersSchema = z.array(OrderSchema);

export const PickTaskSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'exception']),
});
export const PickTasksSchema = z.array(PickTaskSchema);

export const DispatchRouteSchema = z.object({
  route_id: z.string(),
  status: z.enum(['pending', 'waiting', 'ready', 'dispatched', 'hold']),
});
export const DispatchRoutesSchema = z.array(DispatchRouteSchema);
