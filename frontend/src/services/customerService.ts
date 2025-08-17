import api from './api';

export interface Customer {
  id: string;
  phone_number?: string | null;
  user_id: string;
  flat_id: string;
  email: string;
}

export const getCustomers = async (): Promise<Customer[]> => {
  const res = await api.get('/customers/');
  return res.data;
};
