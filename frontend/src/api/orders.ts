import axios from './axios';

export const getOrders = async () => {
  const response = await axios.get('/orders');
  return response.data;
};

export const getOrderById = async (id: string) => {
  const response = await axios.get(`/orders/${id}`);
  return response.data;
};

export const createOrder = async (data: any) => {
  const response = await axios.post('/orders', data);
  return response.data;
};
