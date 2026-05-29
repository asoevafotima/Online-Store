export const API_URL = 'http://localhost:8000';

export const ORDER_STATUSES: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'warning' },
  confirmed: { label: 'Confirmed', color: 'info' },
  processing: { label: 'Processing', color: 'info' },
  shipped: { label: 'Shipped', color: 'info' },
  delivered: { label: 'Delivered', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'danger' },
};

export const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit Card' },
  { value: 'cash', label: 'Cash on Delivery' },
  { value: 'bank', label: 'Bank Transfer' },
];

export const SORT_OPTIONS = [
  { value: 'id', label: 'Default' },
  { value: 'price', label: 'Price' },
  { value: 'name', label: 'Name' },
  { value: 'rating', label: 'Rating' },
  { value: 'created_at', label: 'Newest' },
];

export const ITEMS_PER_PAGE = 12;
