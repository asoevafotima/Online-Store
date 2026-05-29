import axios from './axios';

export const getCart = async () => {
  const response = await axios.get('/cart');
  return response.data;
};

export const addToCart = async (productId: string, quantity: number) => {
  const response = await axios.post('/cart/items', { product_id: productId, quantity });
  return response.data;
};

export const removeFromCart = async (itemId: string) => {
  const response = await axios.delete(`/cart/items/${itemId}`);
  return response.data;
};
