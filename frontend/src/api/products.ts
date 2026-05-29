import axios from './axios';

export const getProducts = async (params?: any) => {
  const response = await axios.get('/products', { params });
  return response.data;
};

export const getProductById = async (id: string) => {
  const response = await axios.get(`/products/${id}`);
  return response.data;
};
