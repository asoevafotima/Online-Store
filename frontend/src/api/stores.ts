import axios from './axios';

export const getStores = async () => {
  const response = await axios.get('/stores');
  return response.data;
};

export const getStoreById = async (id: string) => {
  const response = await axios.get(`/stores/${id}`);
  return response.data;
};
