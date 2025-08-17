import api from './api';

export interface Flat {
  id: string;
  rwa_id: string;
  flat_number: string;
}

export const getFlats = async (): Promise<Flat[]> => {
  const res = await api.get('/flats/');
  return res.data;
};
