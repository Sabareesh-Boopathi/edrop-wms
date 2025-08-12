import api from './api';
import { Notification } from '../types';

export const getMyNotifications = async (skip = 0, limit = 20): Promise<Notification[]> => {
  const res = await api.get(`/notifications/me`, { params: { skip, limit } });
  return res.data;
};

export const getMyUnreadCount = async (): Promise<number> => {
  const res = await api.get(`/notifications/me/unread-count`);
  return res.data;
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  const res = await api.post(`/notifications/me/${id}/read`);
  return res.data;
};
