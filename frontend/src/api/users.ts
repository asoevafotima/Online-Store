import axios from './axios';

export const getUsers = async () => {
  const response = await axios.get('/users');
  return response.data;
};

export const getUserById = async (id: string) => {
  const response = await axios.get(`/users/${id}`);
  return response.data;
};
