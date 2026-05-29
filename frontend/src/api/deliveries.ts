import api from './axios';
import { Delivery } from '../lib/types';

export const deliveriesApi = {
  getByOrder: async (orderId: number): Promise<Delivery> => {
    const response = await api.get<Delivery>(`/deliveries/by-order/${orderId}`);
    return response.data;
  },
  getAll: async (): Promise<Delivery[]> => {
    const response = await api.get<Delivery[]>('/deliveries/');
    return response.data;
  },
  updateStatus: async (id: number, status: string): Promise<Delivery> => {
    const response = await api.put<Delivery>(`/deliveries/${id}/status/`, { status });
    return response.data;
  },
};
