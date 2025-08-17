import api from './api';

export type UUID = string;

export interface OrderItem {
  product_id: UUID;
  quantity: number;
  price: string | number; // Decimal as string from API
}

export interface Order {
  id: UUID;
  customer_id: UUID;
  warehouse_id: UUID;
  status: string;
  total_amount: string | number; // Decimal as string from API
  items?: OrderItem[];
  created_at?: string;
}

export interface OrderProduct {
  id: UUID;
  order_id: UUID;
  product_id: UUID;
  quantity: number;
  price_at_time_of_order: string | number;
}

export async function getOrders(params?: { skip?: number; limit?: number }) {
  const res = await api.get<Order[]>('/orders/', { params });
  return res.data;
}

export async function getMyOrders() {
  const res = await api.get<Order[]>('/orders/me');
  return res.data;
}

export async function getOrderProducts(orderId: UUID) {
  const res = await api.get<OrderProduct[]>(`/orders/${orderId}/products`);
  return res.data;
}

// Placeholder: backend currently has no update endpoint for order status
export async function updateOrderStatus(_orderId: UUID, _status: string) {
  // TODO: implement when backend endpoint exists
  return { ok: false, message: 'Not implemented' } as const;
}

export default {
  getOrders,
  getMyOrders,
  getOrderProducts,
  updateOrderStatus,
};
