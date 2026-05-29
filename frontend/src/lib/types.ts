// ==================== Auth ====================
export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  phone: string;
}

export interface TokenResponse {
  access_token: string;
  role: string;
}

// ==================== User ====================
export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface UserUpdate {
  username: string;
  email: string;
  phone: string;
}

export interface UserRoleUpdate {
  role: string;
}

// ==================== Category ====================
export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface CategoryCreate {
  name: string;
  description?: string;
}

// ==================== Product ====================
export interface Product {
  id: number;
  store_id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  rating: number;
  category: Category;
  created_at: string;
}

export interface ProductCreate {
  category_id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface ProductUpdate {
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
}

export interface ProductFilters {
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
  skip?: number;
  limit?: number;
}

// ==================== Cart ====================
export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  total: number;
}

// ==================== Order ====================
export interface OrderItem {
  id: number;
  product_id: number;
  store_id: number;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  user_id: number;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderCreate {
  address: string;
  city: string;
  payment_method: string;
  discount_code?: string;
}

// ==================== Review ====================
export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewCreate {
  product_id: number;
  rating: number;
  comment: string;
}

// ==================== Favorite ====================
export interface Favorite {
  id: number;
  user_id: number;
  product_id: number;
  product: Product;
}

// ==================== Payment ====================
export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  method: string;
  status: string;
  created_at: string;
}

// ==================== Delivery ====================
export interface Delivery {
  id: number;
  order_id: number;
  address: string;
  city: string;
  status: string;
  created_at: string;
}

// ==================== Notification ====================
export interface Notification {
  id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ==================== Store ====================
export interface Store {
  id: number;
  user_id: number;
  name: string;
  description: string;
  logo: string | null;
  rating: number;
  is_active: boolean;
  created_at: string;
}

// ==================== Discount ====================
export interface Discount {
  id: number;
  store_id: number;
  code: string;
  percent: number;
  is_active: boolean;
  expires_at: string | null;
}
