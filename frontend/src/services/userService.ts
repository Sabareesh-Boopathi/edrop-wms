import api from './api';
import { UserData, UserSchema } from '../pages/administration/UsersAndRoles';

export const getUsers = async (): Promise<UserData[]> => {
    const response = await api.get('/users');
    return response.data;
};

export const getUser = async (id: string): Promise<UserData> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

export const createUser = async (userData: UserSchema): Promise<UserData> => {
    const response = await api.post('/users', userData);
    return response.data;
};

export const updateUser = async (id: string, userData: Partial<UserSchema>): Promise<UserData> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
};

export const getUsersWithWarehouses = async (): Promise<UserData[]> => {
    const response = await api.get('/users/with-warehouses');
    return response.data;
};
