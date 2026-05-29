import axios from './axios';

export const getReviews = async (productId: string) => {
  const response = await axios.get(`/products/${productId}/reviews`);
  return response.data;
};

export const createReview = async (productId: string, data: any) => {
  const response = await axios.post(`/products/${productId}/reviews`, data);
  return response.data;
};
