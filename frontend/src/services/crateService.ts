import api from './api';

export const getCrates = async () => {
  const response = await api.get('/crates');
  return response.data;
};

export const createCrate = async (crate: any) => {
  const response = await api.post('/crates', crate);
  return response.data;
};

export const updateCrate = async (id: string, crate: any) => {
  const response = await api.put(`/crates/${id}`, crate);
  return response.data;
};

export const deleteCrate = async (id: string) => {
  const response = await api.delete(`/crates/${id}`);
  return response.data;
};
