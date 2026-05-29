import axios from './axios';

export const getFavorites = async () => {
  const response = await axios.get('/favorites');
  return response.data;
};

export const addFavorite = async (productId: string) => {
  const response = await axios.post('/favorites', { product_id: productId });
  return response.data;
};

export const removeFavorite = async (productId: string) => {
  const response = await axios.delete(`/favorites/${productId}`);
  return response.data;
};
