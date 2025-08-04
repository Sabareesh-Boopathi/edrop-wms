import api from './api';
import { Milestone } from '../types';

export const getMilestones = async (): Promise<Milestone[]> => {
  const response = await api.get('/milestones');
  return response.data;
};