import axios from './axios';

export const login = async (data: any) => {
  const response = await axios.post('/auth/login', data);
  return response.data;
};

export const register = async (data: any) => {
  const response = await axios.post('/auth/register', data);
  return response.data;
};

export const getProfile = async () => {
  const response = await axios.get('/auth/me');
  return response.data;
};
