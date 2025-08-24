import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../constants';

export interface OrderDto {
  id: string;
  total_amount?: number | string;
}
export interface PickTaskDto { id: string; status: 'pending' | 'in_progress' | 'completed' | 'exception' }
export interface DispatchRouteDto { route_id: string; status: 'pending' | 'waiting' | 'ready' | 'dispatched' | 'hold' }

export const api = createApi({
  reducerPath: 'edropApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getOrders: builder.query<OrderDto[], { limit?: number } | void>({
      query: (args) => ({ url: '/orders/', params: { limit: args?.limit ?? 100 } }),
    }),
    getPickTasks: builder.query<PickTaskDto[], void>({
      query: () => '/outbound/pick-tasks',
    }),
    getDispatchRoutes: builder.query<DispatchRouteDto[], void>({
      query: () => '/outbound/dispatch/routes',
    }),
  }),
});

export const { useGetOrdersQuery, useGetPickTasksQuery, useGetDispatchRoutesQuery } = api;
