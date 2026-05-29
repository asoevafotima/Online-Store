import api from './axios';
import { Payment } from '../lib/types';

export const paymentsApi = {
  getByOrder: async (orderId: number): Promise<Payment> => {
    const response = await api.get<Payment>(`/payments/by-order/${orderId}`);
    return response.data;
  },
  getAll: async (): Promise<Payment[]> => {
    const response = await api.get<Payment[]>('/payments/');
    return response.data;
  },
  getById: async (id: number): Promise<Payment> => {
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
  },
  updateStatus: async (id: number, status: string): Promise<Payment> => {
    const response = await api.put<Payment>(`/payments/${id}/status/`, { status });
    return response.data;
  },
};
