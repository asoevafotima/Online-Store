import axios from './axios';

export const getCategories = async () => {
  const response = await axios.get('/categories');
  return response.data;
};

export const getCategoryById = async (id: string) => {
  const response = await axios.get(`/categories/${id}`);
  return response.data;
};
