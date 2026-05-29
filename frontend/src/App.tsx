import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react';
import './index.css';

type Role = 'user' | 'seller' | 'admin' | 'superadmin' | 'guest';

type User = {
  user_id: number | null;
  sub: string;
  role: Role;
};

type AuthContextValue = {
  token: string | null;
  user: User;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
};

type ThemeContextValue = {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
};

type ToastItem = {
  id: number;
  type: 'success' | 'error';
  message: string;
};

type ToastContextValue = {
  showToast: (message: string, type?: 'success' | 'error') => void;
};

type RealtimeContextValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  markLocalRead: (id: number) => void;
  setNotifications: Dispatch<SetStateAction<NotificationItem[]>>;
  chatSummaries: ChatSummary[];
  setChatSummaries: Dispatch<SetStateAction<ChatSummary[]>>;
  chatMessages: Record<string, ChatMessage[]>;
  setChatMessages: Dispatch<SetStateAction<Record<string, ChatMessage[]>>>;
  appendChatMessage: (summary: ChatSummary, message: ChatMessage, notify?: boolean) => void;
};

type Category = {
  id: number;
  name: string;
  description?: string | null;
};

type ProductVariant = {
  id: number;
  name: string;
  value?: string | null;
  variant_type?: string | null;
  price?: number | null;
  stock: number;
};

type Product = {
  id: number;
  store_id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  rating: number;
  created_at: string;
  category?: Category;
  variants?: ProductVariant[];
};

type Store = {
  id: number;
  user_id: number;
  name: string;
  description: string;
  rating: number;
  created_at: string;
  is_active: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
    balance?: number;
  };
  products?: Array<{
    id: number;
    name: string;
    description?: string | null;
    is_active?: boolean;
  }>;
};

type Review = {
  id: number;
  product_id?: number;
  store_id?: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at: string;
};

type OrderItem = {
  id: number;
  product_id: number;
  store_id: number;
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  user_id: number;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
};

type CartItem = {
  id: number;
  product_id: number;
  quantity: number;
  subtotal?: number;
  product?: Product;
};

type Cart = {
  id: number;
  items: CartItem[];
  total: number;
};

type NotificationItem = {
  id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
};

type Discount = {
  id: number;
  store_id: number;
  code: string;
  percent: number;
  is_active: boolean;
  expires_at?: string | null;
};

type ProductImage = {
  id: number;
  product_id: number;
  image_url: string;
};

type PaymentHistoryItem = {
  id?: number;
  amount: number;
  operation_type?: string;
  description?: string;
  created_at?: string;
};

type StoreReport = {
  total_income?: number;
  period_income?: number;
  top_products?: Array<{ product_id?: number; name?: string; revenue?: number }>;
  sales_dynamics?: Array<{ date?: string; total?: number }>;
};

type ChatSummary = {
  store_id: number;
  other_user_id: number;
  other_username?: string;
  last_message?: string;
};

type ChatMessage = {
  id?: number;
  sender_id: number;
  receiver_id: number;
  store_id: number;
  message: string;
  created_at?: string;
};

type ProfileResponse = {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  balance: number;
  created_at: string;
};

const API_URL = 'http://localhost:8000';
const AuthContext = createContext<AuthContextValue | null>(null);
const ThemeContext = createContext<ThemeContextValue | null>(null);
const ToastContext = createContext<ToastContextValue | null>(null);
const RealtimeContext = createContext<RealtimeContextValue | null>(null);

function parseJwt(token: string | null): User {
  if (!token) {
    return { user_id: null, sub: '', role: 'guest' };
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      user_id: payload.user_id ?? null,
      sub: payload.sub ?? payload.username ?? '',
      role: payload.role ?? 'user',
    };
  } catch {
    return { user_id: null, sub: '', role: 'guest' };
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function timeAgo(value?: string) {
  if (!value) return 'just now';
  const date = new Date(value).getTime();
  const diff = Math.max(0, Date.now() - date);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function api<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    let detail = 'Request failed';
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

function buildApiPath(path: string, params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

function localAssistantReply(message: string, products: Product[], stores: Store[]) {
  const query = message.toLowerCase();
  const matchedProducts = products.filter((product) =>
    `${product.name} ${product.description} ${product.category?.name || ''}`.toLowerCase().includes(query),
  );
  const matchedStores = stores.filter((store) =>
    `${store.name} ${store.description}`.toLowerCase().includes(query),
  );

  if (matchedProducts.length) {
    const top = matchedProducts.slice(0, 3).map((product) => `${product.name} (${formatMoney(product.price)})`).join(', ');
    return `Нашёл похожие товары: ${top}.`;
  }

  if (matchedStores.length) {
    const top = matchedStores.slice(0, 3).map((store) => `${store.name} (рейтинг ${store.rating?.toFixed(1) || '0.0'})`).join(', ');
    return `Подходящие магазины: ${top}.`;
  }

  const popular = products.slice(0, 3).map((product) => `${product.name} (${formatMoney(product.price)})`).join(', ');
  return `Точного совпадения не нашёл. Попробуй посмотреть: ${popular}.`;
}

function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthContext missing');
  return value;
}

function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('ThemeContext missing');
  return value;
}

function useToasts() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('ToastContext missing');
  return value;
}

function useRealtime() {
  const value = useContext(RealtimeContext);
  if (!value) throw new Error('RealtimeContext missing');
  return value;
}

function AppProviders({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const authValue = useMemo<AuthContextValue>(() => ({
    token,
    user: parseJwt(token),
    isAuthenticated: Boolean(token),
    login: (newToken) => {
      localStorage.setItem('access_token', newToken);
      setToken(newToken);
    },
    logout: () => {
      localStorage.removeItem('access_token');
      setToken(null);
    },
  }), [token]);

  const themeValue = useMemo<ThemeContextValue>(() => ({
    theme,
    toggleTheme: () => {
      const next = theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      setTheme(next);
    },
  }), [theme]);

  const toastValue = useMemo<ToastContextValue>(() => ({
    showToast: (message, type = 'success') => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((current) => [...current, { id, type, message }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 3000);
    },
  }), []);

  const realtimeValue = useMemo<RealtimeContextValue>(() => ({
    notifications,
    unreadCount: notifications.filter((item) => !item.is_read).length,
    markLocalRead: (id) => {
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
    },
    setNotifications,
  }), [notifications]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return;
    }

    let alive = true;
    api<NotificationItem[]>('/notifications/', {}, token)
      .then((data) => {
        if (alive) setNotifications(data);
      })
      .catch(() => undefined);

    const socket = new WebSocket(`ws://localhost:8000/ws/notifications?token=${token}`);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'notification') {
          const nextItem: NotificationItem = {
            id: payload.id,
            user_id: parseJwt(token).user_id || 0,
            message: payload.message,
            is_read: false,
            created_at: payload.created_at,
          };
          setNotifications((current) => [nextItem, ...current.filter((item) => item.id !== nextItem.id)]);
          const toastId = Date.now() + Math.floor(Math.random() * 1000);
          setToasts((current) => [...current, { id: toastId, type: 'success', message: payload.message }]);
          window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== toastId));
          }, 3000);
        }
      } catch {
        // ignore websocket parse errors
      }
    };

    return () => {
      alive = false;
      socket.close();
    };
  }, [token]);

  return (
    <AuthContext.Provider value={authValue}>
      <ThemeContext.Provider value={themeValue}>
        <ToastContext.Provider value={toastValue}>
          <RealtimeContext.Provider value={realtimeValue}>
            {children}
            <div className="toast-stack">
              {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                  {toast.message}
                </div>
              ))}
            </div>
          </RealtimeContext.Provider>
        </ToastContext.Provider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

function usePageTitle() {
  const location = useLocation();
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/products': 'Products',
    '/stores': 'Stores',
    '/cart': 'Cart',
    '/orders': 'Orders',
    '/favourites': 'Favourites',
    '/profile': 'Profile',
    '/notifications': 'Notifications',
    '/chat': 'Chat',
    '/assistant': 'AI Agent',
    '/seller/studio': 'Seller Studio',
    '/admin/users': 'Users',
    '/admin/stores': 'Stores',
    '/admin/notifications': 'Send Notification',
  };

  if (location.pathname.startsWith('/products/')) return 'Product';
  if (location.pathname.startsWith('/stores/')) return 'Store';
  return titles[location.pathname] || 'MARK·ET';
}

function LoadingBar({ active }: { active: boolean }) {
  return <div className={`loading-bar ${active ? 'active' : ''}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const themeClass = normalized.includes('ship')
    ? 'status-shipped'
    : normalized.includes('deliver')
      ? 'status-delivered'
      : normalized.includes('cancel')
        ? 'status-cancelled'
        : 'status-pending';
  return <span className={`status-badge ${themeClass}`}>{status}</span>;
}

function ProductCard({
  product,
  onAdd,
  isFavourite,
  onToggleFavourite,
}: {
  product: Product;
  onAdd?: (product: Product) => void;
  isFavourite?: boolean;
  onToggleFavourite?: (product: Product) => void;
}) {
  return (
    <article className="product-card">
      <div className="product-card-media">
        <i className="ti ti-package" />
        <span className={`stock-badge ${product.stock > 0 ? 'in' : 'out'}`}>
          {product.stock > 0 ? `In Stock · ${product.stock}` : 'Out of Stock'}
        </span>
      </div>
      <div className="product-card-body">
        <p className="product-card-category">{product.category?.name || `Category #${product.category_id}`}</p>
        <h3 className="product-card-title">{product.name}</h3>
        <div className="rating-line">
          <i className="ti ti-star-filled" />
          <span>{product.rating?.toFixed(1) || '0.0'}</span>
        </div>
        <div className="product-card-footer">
          <strong className="price-text">{formatMoney(product.price)}</strong>
          <div className="card-actions">
            {onToggleFavourite ? (
              <button className={`icon-square ${isFavourite ? 'active' : ''}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onToggleFavourite(product); }}>
                <i className={`ti ${isFavourite ? 'ti-heart-filled' : 'ti-heart'}`} />
              </button>
            ) : null}
            {onAdd ? (
              <button className="icon-square" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAdd(product); }}>
                <i className="ti ti-shopping-cart-plus" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ icon, title, action }: { icon: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <i className={`ti ${icon}`} />
      <p>{title}</p>
      {action}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <div className="error-box">{message}</div>;
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-square" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Sidebar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem('sidebar_collapsed') === '1');
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const isAdmin = ['admin', 'superadmin'].includes(user.role);
  const nav = [
    { to: '/dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard' },
    { to: '/products', label: 'Products', icon: 'ti-package' },
    { to: '/stores', label: 'Stores', icon: 'ti-building-store' },
    { to: '/cart', label: 'Cart', icon: 'ti-shopping-cart', hide: !user.user_id },
    { to: '/orders', label: 'Orders', icon: 'ti-clipboard-list', hide: !user.user_id },
    { to: '/favourites', label: 'Favourites', icon: 'ti-heart', hide: !user.user_id },
  ];

  const account = [
    { to: '/profile', label: 'Profile', icon: 'ti-user' },
    { to: '/notifications', label: 'Notifications', icon: 'ti-bell' },
    { to: '/chat', label: 'Chat', icon: 'ti-message-circle' },
    { to: '/assistant', label: 'AI Agent', icon: 'ti-sparkles' },
  ];

  const admin = [
    { to: '/admin/users', label: 'Users', icon: 'ti-users' },
    { to: '/admin/stores', label: 'Stores', icon: 'ti-building-store' },
    { to: '/admin/notifications', label: 'Send', icon: 'ti-send' },
  ];

  const seller = [
    { to: '/seller/studio', label: 'Studio', icon: 'ti-tool' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div>
        <div className="sidebar-logo-row">
          <a href="/dashboard" className="sidebar-logo">MARK<span>·ET</span></a>
          <button className="icon-square collapse-trigger" onClick={() => setCollapsed((value) => !value)}>
            <i className={`ti ${collapsed ? 'ti-panel-right-open' : 'ti-panel-left-close'}`} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {nav.filter((item) => !item.hide).map((item) => (
            <a key={item.to} href={item.to} className={`nav-item ${location.pathname === item.to ? 'active' : ''}`}>
              <i className={`ti ${item.icon}`} />
              <span>{item.label}</span>
            </a>
          ))}

          <div className="nav-separator" />
          <div className="nav-label">Account</div>

          {account.map((item) => (
            <a key={item.to} href={item.to} className={`nav-item ${location.pathname === item.to ? 'active' : ''}`}>
              <i className={`ti ${item.icon}`} />
              <span>{item.label}</span>
            </a>
          ))}

          {['seller', 'admin', 'superadmin'].includes(user.role) ? (
            <>
              <div className="nav-separator" />
              <div className="nav-label">Seller</div>
              {seller.map((item) => (
                <a key={item.to} href={item.to} className={`nav-item ${location.pathname === item.to ? 'active' : ''}`}>
                  <i className={`ti ${item.icon}`} />
                  <span>{item.label}</span>
                </a>
              ))}
            </>
          ) : null}

          {isAdmin ? (
            <>
              <div className="nav-separator" />
              <div className="nav-label nav-label-accent">Admin panel</div>
              {admin.map((item) => (
                <a key={item.to} href={item.to} className={`nav-item ${location.pathname === item.to ? 'active' : ''}`}>
                  <i className={`ti ${item.icon}`} />
                  <span>{item.label}</span>
                </a>
              ))}
            </>
          ) : null}
        </nav>
      </div>

      <button className="theme-toggle" onClick={toggleTheme}>
        <div className="theme-track">
          <div className={`theme-thumb ${theme === 'light' ? 'light' : ''}`} />
        </div>
        <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
      </button>
    </aside>
  );
}

function NotificationsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const { notifications, markLocalRead } = useRealtime();

  async function markRead(id: number) {
    if (!token) return;
    try {
      await api(`/notifications/${id}/read/`, { method: 'PUT' }, token);
      markLocalRead(id);
    } catch {
      // ignore
    }
  }

  return (
    <aside className={`drawer ${open ? 'open' : ''}`}>
      <div className="drawer-head">
        <h3>Notifications</h3>
        <button className="icon-square" onClick={onClose}>
          <i className="ti ti-x" />
        </button>
      </div>
      <div className="drawer-body">
        {notifications.length ? notifications.map((item) => (
          <button key={item.id} className={`notification-row ${item.is_read ? '' : 'unread'}`} onClick={() => markRead(item.id)}>
            <div>
              <p>{item.message}</p>
              <span>{timeAgo(item.created_at)}</span>
            </div>
            <span className={`notification-dot ${item.is_read ? 'read' : ''}`} />
          </button>
        )) : <EmptyState icon="ti-bell-off" title="No notifications yet" />}
      </div>
    </aside>
  );
}

function Topbar() {
  const { logout, user } = useAuth();
  const { unreadCount } = useRealtime();
  const title = usePageTitle();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const showSearch = ['/products', '/stores'].includes(location.pathname);

  return (
    <>
      <header className="topbar">
        <h1 className="topbar-title">{title}</h1>
        {showSearch ? (
          <div className="search-wrap">
            <i className="ti ti-search" />
            <input
              value={search}
              placeholder={location.pathname === '/products' ? 'Search products...' : 'Search stores...'}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                const key = location.pathname === '/products' ? 'products_search' : 'stores_search';
                sessionStorage.setItem(key, value);
                window.dispatchEvent(new CustomEvent(`${key}_changed`, { detail: value }));
              }}
            />
          </div>
        ) : <div className="topbar-spacer" />}
        <div className="topbar-actions">
          <button className="icon-square" onClick={() => setDrawerOpen(true)}>
            <i className="ti ti-bell" />
            {unreadCount > 0 ? <span className="notif-dot" /> : null}
          </button>
          <button className="avatar-button" onClick={() => navigate('/profile')}>
            {(user.sub || 'GU').slice(0, 2).toUpperCase()}
          </button>
          <button className="icon-square" onClick={logout}>
            <i className="ti ti-logout" />
          </button>
        </div>
      </header>
      <NotificationsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <Topbar />
        <div className="content-shell">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function AuthLayout() {
  return <div className="auth-page"><Outlet /></div>;
}

function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminRoute() {
  const { user } = useAuth();
  return ['admin', 'superadmin'].includes(user.role) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

function SellerRoute() {
  const { user } = useAuth();
  return ['seller', 'admin', 'superadmin'].includes(user.role) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToasts();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api<{ access_token: string }>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      login(data.access_token);
      showToast('Signed in successfully');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-card">
      <LoadingBar active={loading} />
      <div className="auth-logo">MARK<span>·ET</span></div>
      <h2>Sign in</h2>
      <form className="auth-form" onSubmit={submit}>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <ErrorBox message={error} /> : null}
        <button className="primary-button" type="submit">Login</button>
      </form>
      <p className="auth-switch">No account yet? <a href="/register">Register</a></p>
    </section>
  );
}

function RegisterPage() {
  const { login } = useAuth();
  const { showToast } = useToasts();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api<{ access_token: string }>('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      login(data.access_token);
      showToast('Account created');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-card">
      <LoadingBar active={loading} />
      <div className="auth-logo">MARK<span>·ET</span></div>
      <h2>Create account</h2>
      <form className="auth-form" onSubmit={submit}>
        {['username', 'email', 'phone', 'password'].map((field) => (
          <label key={field}>
            {field[0].toUpperCase() + field.slice(1)}
            <input
              type={field === 'password' ? 'password' : 'text'}
              value={form[field as keyof typeof form]}
              onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
            />
          </label>
        ))}
        {error ? <ErrorBox message={error} /> : null}
        <button className="primary-button" type="submit">Register</button>
      </form>
      <p className="auth-switch">Already have an account? <a href="/login">Login</a></p>
    </section>
  );
}

function DashboardPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; created_at: string }>>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([
      user.role === 'seller' ? api<Order[]>('/orders/store', {}, token) : api<Order[]>('/orders/my', {}, token),
      ['admin', 'superadmin'].includes(user.role) ? api<Array<{ id: number; created_at: string }>>('/users/', {}, token) : Promise.resolve([]),
      api<Store[]>('/stores/'),
      api<Product[]>('/products/?limit=6'),
    ])
      .then(([ordersData, usersData, storesData, productsData]) => {
        if (!alive) return;
        setOrders(ordersData);
        setUsers(usersData);
        setStores(storesData);
        setProducts(productsData);
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token, user.role]);

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const newUsersToday = users.filter((item) => new Date(item.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <section>
      <LoadingBar active={loading} />
      {error ? <ErrorBox message={error} /> : null}
      <div className="metrics-grid">
        <div className="metric-card"><p>Total Revenue</p><strong>{formatMoney(revenue)}</strong><span className="metric-up">↑ live</span></div>
        <div className="metric-card"><p>Total Orders</p><strong>{orders.length}</strong><span className="metric-up">↑ active</span></div>
        <div className="metric-card"><p>Active Stores</p><strong>{stores.length}</strong><span>tracked</span></div>
        <div className="metric-card"><p>New Users Today</p><strong>{newUsersToday}</strong><span className="metric-down">↓ API dependent</span></div>
      </div>
      <div className="two-column-grid">
        <section className="surface-card">
          <div className="surface-head"><h3>Recent orders</h3></div>
          <table className="table">
            <thead>
              <tr><th>Order ID</th><th>Products</th><th>Status</th><th>Total</th></tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id}>
                  <td className="mono-cell">#{order.id}</td>
                  <td>{order.items?.length || 0} items</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td className="mono-cell">{formatMoney(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="surface-card">
          <div className="surface-head"><h3>Top products by revenue</h3></div>
          <div className="stack-list">
            {products.map((product, index) => (
              <div key={product.id} className="rank-row">
                <div className="rank-icon"><i className="ti ti-package" /></div>
                <div className="rank-body">
                  <strong>{product.name}</strong>
                  <span>{product.category?.name || 'Category'} · rating {product.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="rank-meta">
                  <strong>{formatMoney(product.price * Math.max(1, product.stock))}</strong>
                  <div className="rank-bar"><div style={{ width: `${100 - index * 12}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function ProductsPage() {
  const { token, isAuthenticated } = useAuth();
  const { showToast } = useToasts();
  const [products, setProducts] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [favourites, setFavourites] = useState<Array<{ id: number; product_id: number }>>([]);
  const [filters, setFilters] = useState({ search: sessionStorage.getItem('products_search') || '', category_id: '', store_id: '', sort_by: 'price', order: 'asc' });
  const [grid, setGrid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setFilters((current) => ({ ...current, search: detail || '' }));
    };
    window.addEventListener('products_search_changed', handler);
    return () => window.removeEventListener('products_search_changed', handler);
  }, []);

  useEffect(() => {
    let alive = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      Promise.all([
        api<Product[]>(buildApiPath('/products/', {
          search: filters.search,
          category_id: filters.category_id,
          store_id: filters.store_id,
          sort_by: filters.sort_by,
          order: filters.order,
          limit: 24,
        })),
        isAuthenticated ? api<Product[]>('/products/recommendations', {}, token).catch(() => []) : api<Product[]>('/products/popular').catch(() => []),
        api<Category[]>('/categories/').catch(() => []),
        api<Store[]>('/stores/'),
        isAuthenticated ? api<Array<{ id: number; product_id: number }>>('/favorites/', {}, token).catch(() => []) : Promise.resolve([]),
      ])
        .then(([productsData, recommendedData, categoriesData, storesData, favouriteData]) => {
          if (!alive) return;
          setProducts(productsData);
          setRecommended(recommendedData);
          setCategories(categoriesData);
          setStores(storesData);
          setFavourites(favouriteData);
          setError('');
        })
        .catch((err) => alive && setError(err instanceof Error ? err.message : 'Failed to load products'))
        .finally(() => alive && setLoading(false));
    }, 300);
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [filters, isAuthenticated, token]);

  async function addToCart(product: Product) {
    if (!token) {
      showToast('Login required to add to cart', 'error');
      return;
    }
    try {
      await api('/cart/add/', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      }, token);
      showToast('Added to cart');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add to cart', 'error');
    }
  }

  async function toggleFavourite(product: Product) {
    if (!token) {
      showToast('Login required to manage favourites', 'error');
      return;
    }
    const existing = favourites.find((item) => item.product_id === product.id);
    try {
      if (existing) {
        await api(`/favorites/${existing.id}`, { method: 'DELETE' }, token);
        setFavourites((current) => current.filter((item) => item.id !== existing.id));
        showToast('Removed from favourites');
      } else {
        const created = await api<{ id: number; product_id: number }>('/favorites/', {
          method: 'POST',
          body: JSON.stringify({ product_id: product.id }),
        }, token);
        setFavourites((current) => [...current, created]);
        showToast('Added to favourites');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Favourite action failed', 'error');
    }
  }

  return (
    <section>
      <LoadingBar active={loading} />
      {error ? <ErrorBox message={error} /> : null}
      {recommended.length ? (
        <div className="surface-card recommendations-panel">
          <div className="surface-head">
            <h3>{isAuthenticated ? 'Recommended for you' : 'Trending now'}</h3>
          </div>
          <div className="mini-products-row">
            {recommended.slice(0, 4).map((product) => (
              <a key={product.id} href={`/products/${product.id}`} className="mini-product-card">
                <strong>{product.name}</strong>
                <span>{product.category?.name || 'Category'}</span>
                <em className="mono-cell">{formatMoney(product.price)}</em>
              </a>
            ))}
          </div>
        </div>
      ) : null}
      <div className="toolbar">
        <select value={filters.category_id} onChange={(event) => setFilters((current) => ({ ...current, category_id: event.target.value }))}>
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select value={filters.store_id} onChange={(event) => setFilters((current) => ({ ...current, store_id: event.target.value }))}>
          <option value="">All stores</option>
          {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
        </select>
        <button className={`toolbar-button ${filters.sort_by === 'price' ? 'active' : ''}`} onClick={() => setFilters((current) => ({ ...current, sort_by: 'price' }))}>Price</button>
        <button className={`toolbar-button ${filters.sort_by === 'rating' ? 'active' : ''}`} onClick={() => setFilters((current) => ({ ...current, sort_by: 'rating' }))}>Rating</button>
        <div className="toolbar-spacer" />
        <button className={`icon-square ${grid ? 'active' : ''}`} onClick={() => setGrid(true)}><i className="ti ti-layout-grid" /></button>
        <button className={`icon-square ${!grid ? 'active' : ''}`} onClick={() => setGrid(false)}><i className="ti ti-list" /></button>
      </div>
      {products.length ? (
        <div className={grid ? 'products-grid' : 'products-list'}>
          {products.map((product) => (
            <a key={product.id} href={`/products/${product.id}`} className="card-link">
              <ProductCard
                product={product}
                onAdd={addToCart}
                isFavourite={Boolean(favourites.find((item) => item.product_id === product.id))}
                onToggleFavourite={toggleFavourite}
              />
            </a>
          ))}
        </div>
      ) : <EmptyState icon="ti-search-off" title="No products matched these filters" />}
    </section>
  );
}

function ProductDetailPage() {
  const { token } = useAuth();
  const { showToast } = useToasts();
  const { pathname } = useLocation();
  const id = pathname.split('/').pop() || '';
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([
      api<Product>(`/products/${id}`),
      api<ProductImage[]>(`/product-images/${id}`).catch(() => []),
      api<Review[]>(`/reviews/product/${id}`),
      api<Product[]>(`/products/${id}/similar`).catch(() => []),
    ])
      .then(([productData, imagesData, reviewData, similarData]) => {
        if (!alive) return;
        setProduct(productData);
        setImages(imagesData);
        setReviews(reviewData);
        setSimilar(similarData);
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : 'Failed to load product'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  async function addToCart() {
    if (!token || !product) {
      showToast('Login required to add to cart', 'error');
      return;
    }
    try {
      await api('/cart/add/', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      }, token);
      showToast('Added to cart');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add', 'error');
    }
  }

  if (!product && !loading) return <ErrorBox message={error || 'Product not found'} />;

  return (
    <section>
      <LoadingBar active={loading} />
      {error ? <ErrorBox message={error} /> : null}
      {product ? (
        <>
          <div className="detail-grid">
            <div className="detail-media">
              {images[0]?.image_url ? <img src={images[0].image_url} alt={product.name} className="detail-image" /> : <i className="ti ti-photo" />}
            </div>
            <div className="detail-body">
              <p className="muted-label">{product.category?.name || 'Category'}</p>
              <h2 className="detail-title">{product.name}</h2>
              <div className="rating-line">
                <i className="ti ti-star-filled" />
                <span>{product.rating?.toFixed(1) || '0.0'} · {reviews.length} reviews</span>
              </div>
              <div className="detail-price">{formatMoney(product.price)}</div>
              <p className="detail-copy">{product.description}</p>
              <p className="detail-copy">Stock: {product.stock}</p>
              {product.variants?.length ? (
                <div className="chip-row">
                  {product.variants.map((variant) => <span key={variant.id} className="chip">{variant.name}{variant.value ? ` · ${variant.value}` : ''}</span>)}
                </div>
              ) : null}
              <button className="primary-button wide" onClick={addToCart}>Add to cart</button>
            </div>
          </div>
          <div className="two-column-grid">
            <section className="surface-card">
              <div className="surface-head"><h3>Reviews</h3></div>
              <div className="stack-list">
                {reviews.length ? reviews.map((review) => (
                  <div key={review.id} className="review-row">
                    <div>
                      <strong>Rating {review.rating}/5</strong>
                      <p>{review.comment}</p>
                    </div>
                    <span>{formatDate(review.created_at)}</span>
                  </div>
                )) : <EmptyState icon="ti-message-off" title="No reviews yet" />}
              </div>
            </section>
            <section className="surface-card">
              <div className="surface-head"><h3>Similar products</h3></div>
              <div className="stack-list">
                {similar.length ? similar.map((item) => (
                  <a key={item.id} href={`/products/${item.id}`} className="mini-link-row">
                    <i className="ti ti-package" />
                    <div>
                      <strong>{item.name}</strong>
                      <span>{formatMoney(item.price)}</span>
                    </div>
                  </a>
                )) : <EmptyState icon="ti-layout-grid-remove" title="No similar products returned by API" />}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}

function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState(sessionStorage.getItem('stores_search') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (event: Event) => setSearch((event as CustomEvent<string>).detail || '');
    window.addEventListener('stores_search_changed', handler);
    return () => window.removeEventListener('stores_search_changed', handler);
  }, []);

  useEffect(() => {
    api<Store[]>('/stores/')
      .then((data) => setStores(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load stores'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = stores.filter((store) => store.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <section>
      <LoadingBar active={loading} />
      {error ? <ErrorBox message={error} /> : null}
      {filtered.length ? (
        <div className="stores-grid">
          {filtered.map((store) => (
            <a key={store.id} href={`/stores/${store.id}`} className="store-card">
              <h3>{store.name}</h3>
              <p>Owner: {store.user?.username || `User #${store.user_id}`}</p>
              <div className="store-meta"><span>★ {store.rating?.toFixed(1) || '0.0'}</span><span>{store.products?.length || 0} products</span></div>
              <span className="store-link">View store →</span>
            </a>
          ))}
        </div>
      ) : <EmptyState icon="ti-building-store-off" title="No stores available" />}
    </section>
  );
}

function StoreDetailPage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const id = pathname.split('/').pop() || '';
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filters, setFilters] = useState({ category: '', sort_by: 'rating', order: 'desc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api<Store>(`/stores/${id}`),
      api<Product[]>(buildApiPath('/products/', {
        store_id: id,
        category_id: filters.category,
        sort_by: filters.sort_by,
        order: filters.order,
      })),
      api<Review[]>(`/store-reviews/store/${id}`).catch(() => []),
    ])
      .then(([storeData, productsData, reviewData]) => {
        setStore(storeData);
        setProducts(productsData);
        setReviews(reviewData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load store'))
      .finally(() => setLoading(false));
  }, [filters, id]);

  const ownStore = store && user.user_id === store.user_id;

  return (
    <section>
      <LoadingBar active={loading} />
      {error ? <ErrorBox message={error} /> : null}
      {store ? (
        <>
          <div className="surface-card store-hero">
            <div>
              <h2>{store.name}</h2>
              <p>{store.description}</p>
            </div>
            <div className="store-hero-meta">
              <span>★ {store.rating?.toFixed(1) || '0.0'}</span>
              <span>Founded {formatDate(store.created_at)}</span>
              <span>{products.length} products</span>
            </div>
          </div>
          {ownStore ? (
            <div className="tab-strip">
              <a href="/profile" className="toolbar-button active">Edit store</a>
              <a href="/orders" className="toolbar-button">Manage orders</a>
            </div>
          ) : null}
          <div className="toolbar">
            <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
              <option value="">All categories</option>
              {Array.from(new Set(products.map((product) => product.category))).filter(Boolean).map((category) => (
                <option key={category!.id} value={category!.id}>{category!.name}</option>
              ))}
            </select>
            <button className={`toolbar-button ${filters.sort_by === 'rating' ? 'active' : ''}`} onClick={() => setFilters((current) => ({ ...current, sort_by: 'rating', order: 'desc' }))}>Rating</button>
            <button className={`toolbar-button ${filters.sort_by === 'created_at' ? 'active' : ''}`} onClick={() => setFilters((current) => ({ ...current, sort_by: 'created_at', order: 'desc' }))}>Newest</button>
          </div>
          <div className="products-grid">
            {products.map((product) => (
              <a key={product.id} href={`/products/${product.id}`} className="card-link">
                <ProductCard product={product} />
              </a>
            ))}
          </div>
          <section className="surface-card">
            <div className="surface-head"><h3>Store reviews</h3></div>
            <div className="stack-list">
              {reviews.length ? reviews.map((review) => (
                <div key={review.id} className="review-row">
                  <div>
                    <strong>Rating {review.rating}/5</strong>
                    <p>{review.comment}</p>
                  </div>
                  <span>{formatDate(review.created_at)}</span>
                </div>
              )) : <EmptyState icon="ti-message-off" title="No store reviews yet" />}
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}

function CartPage() {
  const { token } = useAuth();
  const { showToast } = useToasts();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [promo, setPromo] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);

  function loadCart() {
    if (!token) return;
    setLoading(true);
    api<Cart>('/cart/', {}, token)
      .then(setCart)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load cart'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCart();
  }, [token]);

  function updateQuantity(item: CartItem, quantity: number) {
    if (!token) return;
    const nextQuantity = Math.max(1, quantity);
    setCart((current) => current ? {
      ...current,
      items: current.items.map((row) => row.id === item.id ? { ...row, quantity: nextQuantity } : row),
    } : current);

    window.setTimeout(() => {
      api(`/cart/items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: nextQuantity }),
      }, token)
        .then(() => loadCart())
        .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to update quantity', 'error'));
    }, 500);
  }

  async function removeItem(id: number) {
    if (!token) return;
    try {
      await api(`/cart/items/${id}`, { method: 'DELETE' }, token);
      loadCart();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove item', 'error');
    }
  }

  const subtotal = cart?.total || 0;
  const discount = promo.trim() ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const total = subtotal - discount;

  return (
    <section className="cart-grid">
      <LoadingBar active={loading} />
      {error ? <ErrorBox message={error} /> : null}
      <div className="surface-card">
        <div className="surface-head"><h3>Cart items</h3></div>
        <div className="stack-list">
          {cart?.items?.length ? cart.items.map((item) => (
            <div key={item.id} className="cart-row">
              <div className="rank-icon"><i className="ti ti-package" /></div>
              <div className="cart-info">
                <strong>{item.product?.name || `Product #${item.product_id}`}</strong>
                <span>{item.product?.category?.name || 'Category'}</span>
              </div>
              <div className="quantity-box">
                <button onClick={() => updateQuantity(item, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item, item.quantity + 1)}>+</button>
              </div>
              <strong className="mono-cell">{formatMoney(item.subtotal || (item.product?.price || 0) * item.quantity)}</strong>
              <button className="icon-square" onClick={() => removeItem(item.id)}><i className="ti ti-trash" /></button>
            </div>
          )) : <EmptyState icon="ti-shopping-cart-off" title="Your cart is empty" action={<a href="/products" className="secondary-button">Browse products</a>} />}
        </div>
      </div>

      <div className="surface-card">
        <div className="surface-head"><h3>Order summary</h3></div>
        <div className="summary-block">
          <div className="summary-row"><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
          <div className="summary-row"><span>Discount</span><strong className="positive-text">-{formatMoney(discount)}</strong></div>
          <div className="summary-row summary-total"><span>Total</span><strong>{formatMoney(total)}</strong></div>
          <div className="promo-row">
            <input value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="Promo code..." />
            <button className="secondary-button">Apply</button>
          </div>
          <button className="primary-button wide" onClick={() => setSummaryOpen(true)}>Checkout →</button>
        </div>
      </div>

      <Modal open={summaryOpen} title="Confirm order" onClose={() => setSummaryOpen(false)}>
        <div className="modal-body-stack">
          <p>Proceed to checkout with total {formatMoney(total)}?</p>
          <button className="primary-button" onClick={() => navigate('/checkout')}>Continue</button>
        </div>
      </Modal>
    </section>
  );
}

function CheckoutPage() {
  const { token } = useAuth();
  const { showToast } = useToasts();
  const navigate = useNavigate();
  const [form, setForm] = useState({ address: '', city: '', payment_method: 'balance', discount_code: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await api('/orders/', {
        method: 'POST',
        body: JSON.stringify(form),
      }, token);
      showToast('Order placed');
      navigate('/orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="surface-card form-card">
      <LoadingBar active={loading} />
      <div className="surface-head"><h3>Checkout</h3></div>
      <form className="page-form" onSubmit={submit}>
        <label>Address<input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} /></label>
        <label>City<input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} /></label>
        <label>Payment method<input value={form.payment_method} onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value }))} /></label>
        <label>Promo code<input value={form.discount_code} onChange={(event) => setForm((current) => ({ ...current, discount_code: event.target.value }))} /></label>
        {error ? <ErrorBox message={error} /> : null}
        <button className="primary-button" type="submit">Place order</button>
      </form>
    </section>
  );
}

function OrdersPage() {
  const { token, user } = useAuth();
  const { showToast } = useToasts();
  const [tab, setTab] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadOrders() {
    if (!token) return;
    setLoading(true);
    const path = ['seller', 'admin', 'superadmin'].includes(user.role) ? '/orders/store' : '/orders/my';
    api<Order[]>(path, {}, token)
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOrders();
  }, [token, user.role]);

  async function updateStatus(id: number, status: string) {
    if (!token) return;
    try {
      await api(`/orders/${id}/status/`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }, token);
      showToast('Order status updated');
      loadOrders();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed', 'error');
    }
  }

  const filtered = orders.filter((order) => tab === 'all' || order.status.toLowerCase().includes(tab));
  const sellerView = ['seller', 'admin', 'superadmin'].includes(user.role);

  return (
    <section>
      <LoadingBar active={loading} />
      {error ? <ErrorBox message={error} /> : null}
      <div className="tab-strip">
        {['all', 'pending', 'shipped', 'delivered', 'cancelled'].map((value) => (
          <button key={value} className={`tab-button ${tab === value ? 'active' : ''}`} onClick={() => setTab(value)}>
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
      <div className="surface-card">
        <table className="table">
          <thead>
            <tr><th>Order ID</th><th>Date</th><th>Products</th><th>Total</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id}>
                <td className="mono-cell">#{order.id}</td>
                <td>{formatDate(order.created_at)}</td>
                <td>{order.items.length} items</td>
                <td className="mono-cell">{formatMoney(order.total)}</td>
                <td><StatusBadge status={order.status} /></td>
                <td>
                  {sellerView ? (
                    <select className="inline-select" value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}>
                      {[order.status, 'pending', 'отправлен', 'shipped', 'доставлено', 'delivered', 'cancelled'].filter((value, index, array) => array.indexOf(value) === index).map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  ) : order.status.toLowerCase().includes('deliver') ? (
                    <a href={`/products/${order.items[0]?.product_id || ''}`} className="inline-link">Leave review</a>
                  ) : (
                    <span className="muted-text">Details</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FavouritesPage() {
  const { token } = useAuth();
  const { showToast } = useToasts();
  const [items, setItems] = useState<Array<{ id: number; product_id: number; product: Product }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    if (!token) return;
    setLoading(true);
    api<Array<{ id: number; product_id: number; product: Product }>>('/favorites/', {}, token)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load favourites'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [token]);

  async function remove(id: number) {
    if (!token) return;
    try {
      await api(`/favorites/${id}`, { method: 'DELETE' }, token);
      showToast('Removed from favourites');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove', 'error');
    }
  }

  return (
    <section>
      <LoadingBar active={loading} />
      {error ? <ErrorBox message={error} /> : null}
      {items.length ? (
        <div className="products-grid">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} isFavourite onToggleFavourite={() => remove(item.id)} />
          ))}
        </div>
      ) : <EmptyState icon="ti-heart-off" title="No favourite products yet" />}
    </section>
  );
}

function ProfilePage() {
  const { token, user } = useAuth();
  const { showToast } = useToasts();
  const [profile, setProfile] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [storeReport, setStoreReport] = useState<StoreReport | null>(null);
  const [form, setForm] = useState({ username: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [topUp, setTopUp] = useState({ user_id: '', amount: '' });

  function load() {
    if (!token) return;
    setLoading(true);
    Promise.all([
      api<ProfileResponse>('/users/me', {}, token),
      ['admin', 'superadmin'].includes(user.role) ? api<any[]>('/users/', {}, token).catch(() => []) : Promise.resolve([]),
      api<PaymentHistoryItem[]>('/payments/my/history', {}, token).catch(() => []),
      ['seller', 'admin', 'superadmin'].includes(user.role) ? api<StoreReport>('/payments/store/report', {}, token).catch(() => null) : Promise.resolve(null),
    ])
      .then(([me, userList, paymentHistory, report]) => {
        setProfile(me);
        setUsers(userList);
        setPayments(paymentHistory);
        setStoreReport(report);
        setForm({ username: me.username || '', email: me.email || '', phone: me.phone || '' });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [token, user.role]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await api('/users/me', {
        method: 'PUT',
        body: JSON.stringify(form),
      }, token);
      showToast('Profile updated');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    }
  }

  async function submitTopUp(event: FormEvent) {
    event.preventDefault();
    if (!token || !topUp.user_id) return;
    try {
      await api(`/users/${topUp.user_id}/topup`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(topUp.amount) }),
      }, token);
      showToast('Balance topped up');
      setModalOpen(false);
      setTopUp({ user_id: '', amount: '' });
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Top up failed', 'error');
    }
  }

  return (
    <section className="profile-grid">
      <LoadingBar active={loading} />
      {error ? <ErrorBox message={error} /> : null}
      <div className="surface-card">
        <div className="profile-avatar">{(profile?.username || user.sub || 'GU').slice(0, 2).toUpperCase()}</div>
        <h2 className="profile-name">{profile?.username || user.sub}</h2>
        <p className="role-pill">{profile?.role || user.role}</p>
        <div className="balance-panel">
          <span>Current balance</span>
          <strong>{formatMoney(profile?.balance || 0)}</strong>
        </div>
        {['admin', 'superadmin'].includes(user.role) ? (
          <button className="primary-button wide" onClick={() => setModalOpen(true)}>Top up balance</button>
        ) : null}
      </div>
      <div className="surface-card">
        <div className="surface-head"><h3>Edit profile</h3></div>
        <form className="page-form" onSubmit={save}>
          <label>Username<input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} /></label>
          <label>Email<input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
          <label>Phone<input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></label>
          <button className="secondary-button" type="submit">Save changes</button>
        </form>
      </div>
      <div className="surface-card">
        <div className="surface-head"><h3>Payment history</h3></div>
        <div className="stack-list">
          {payments.length ? payments.slice(0, 8).map((item, index) => (
            <div key={`${item.created_at || 'row'}-${index}`} className="review-row">
              <div>
                <strong>{item.operation_type || 'operation'}</strong>
                <p>{item.description || 'Balance operation'}</p>
              </div>
              <span className="mono-cell">{formatMoney(item.amount)}</span>
            </div>
          )) : <EmptyState icon="ti-cash-off" title="No payment history returned by API" />}
        </div>
      </div>
      {storeReport ? (
        <div className="surface-card">
          <div className="surface-head"><h3>Store finance</h3></div>
          <div className="summary-block">
            <div className="summary-row"><span>Total income</span><strong className="mono-cell">{formatMoney(storeReport.total_income || 0)}</strong></div>
            <div className="summary-row"><span>Period income</span><strong className="mono-cell">{formatMoney(storeReport.period_income || 0)}</strong></div>
            {(storeReport.top_products || []).length ? (
              <div className="stack-list compact-list">
                {(storeReport.top_products || []).map((item, index) => (
                  <div key={index} className="review-row">
                    <div>
                      <strong>{item.name || `Product #${item.product_id || index + 1}`}</strong>
                      <p>Revenue contribution</p>
                    </div>
                    <span className="mono-cell">{formatMoney(item.revenue || 0)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <Modal open={modalOpen} title="Top up balance" onClose={() => setModalOpen(false)}>
        <form className="page-form modal-body-stack" onSubmit={submitTopUp}>
          <label>User
            <select value={topUp.user_id} onChange={(event) => setTopUp((current) => ({ ...current, user_id: event.target.value }))}>
              <option value="">Select user</option>
              {users.map((item) => <option key={item.id} value={item.id}>{item.username} · {item.email}</option>)}
            </select>
          </label>
          <label>Amount<input value={topUp.amount} onChange={(event) => setTopUp((current) => ({ ...current, amount: event.target.value }))} /></label>
          <button className="primary-button" type="submit">Apply top up</button>
        </form>
      </Modal>
    </section>
  );
}

function NotificationsPage() {
  const { token } = useAuth();
  const { notifications, markLocalRead, setNotifications } = useRealtime();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    if (!token) return;
    setLoading(true);
    api<NotificationItem[]>('/notifications/', {}, token)
      .then(setNotifications)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notifications'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [token]);

  async function markAllRead() {
    if (!token) return;
    await Promise.all(notifications.filter((item) => !item.is_read).map((item) => api(`/notifications/${item.id}/read/`, { method: 'PUT' }, token)));
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
  }

  return (
    <section className="surface-card">
      <LoadingBar active={loading} />
      <div className="surface-head">
        <h3>Notifications</h3>
        <button className="secondary-button" onClick={markAllRead}>Mark all as read</button>
      </div>
      {error ? <ErrorBox message={error} /> : null}
      <div className="stack-list">
        {notifications.length ? notifications.map((item) => (
          <button key={item.id} className={`notification-row static ${item.is_read ? '' : 'unread'}`} onClick={() => markLocalRead(item.id)}>
            <div>
              <p>{item.message}</p>
              <span>{formatDate(item.created_at)}</span>
            </div>
            <span className={`notification-dot ${item.is_read ? 'read' : ''}`} />
          </button>
        )) : <EmptyState icon="ti-bell-off" title="No notifications found" />}
      </div>
    </section>
  );
}

function ChatPage() {
  const { token, user } = useAuth();
  const { showToast } = useToasts();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChat, setActiveChat] = useState<ChatSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [manualChat, setManualChat] = useState({ store_id: '', receiver_id: '' });
  const [socketState, setSocketState] = useState('offline');
  const [error, setError] = useState('');
  const historyLoadedRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    api<ChatSummary[]>('/chat/my-chats', {}, token)
      .then((data) => {
        setChats(data);
        if (data[0]) setActiveChat(data[0]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load chats'));
  }, [token]);

  useEffect(() => {
    if (!token || !activeChat) return;
    historyLoadedRef.current = false;
    api<ChatMessage[]>(`/chat/history/${activeChat.store_id}/${activeChat.other_user_id}`, {}, token)
      .then((data) => {
        setMessages(data);
        historyLoadedRef.current = true;
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load messages'));
  }, [activeChat, token]);

  useEffect(() => {
    if (!token || !activeChat) return;
    const socket = new WebSocket(`ws://localhost:8000/ws/chat/${activeChat.store_id}/${activeChat.other_user_id}?token=${token}`);
    setSocketState('connecting');
    socket.onopen = () => setSocketState('online');
    socket.onclose = () => setSocketState('offline');
    socket.onmessage = (event) => {
      if (!historyLoadedRef.current) return;
      const [sender, ...rest] = event.data.split(':');
      const nextMessage = {
        sender_id: Number(sender.trim()) || 0,
        receiver_id: activeChat.other_user_id,
        store_id: activeChat.store_id,
        message: rest.join(':').trim(),
      };
      setMessages((current) => {
        const last = current[current.length - 1];
        if (last && last.sender_id === nextMessage.sender_id && last.message === nextMessage.message) {
          return current;
        }
        return [...current, nextMessage];
      });
    };
    return () => socket.close();
  }, [activeChat, token]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!token || !activeChat || !message.trim()) return;
    try {
      const created = await api<ChatMessage>('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          receiver_id: activeChat.other_user_id,
          store_id: activeChat.store_id,
          message,
        }),
      }, token);
      if (socketState !== 'online') {
        setMessages((current) => [...current, created]);
      }
      setMessage('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message', 'error');
    }
  }

  function startManualChat(event: FormEvent) {
    event.preventDefault();
    if (!manualChat.store_id || !manualChat.receiver_id) return;
    setActiveChat({
      store_id: Number(manualChat.store_id),
      other_user_id: Number(manualChat.receiver_id),
      other_username: `User #${manualChat.receiver_id}`,
    });
  }

  return (
    <section className="chat-layout">
      <div className="surface-card">
        <div className="surface-head"><h3>Dialogs</h3></div>
        <form className="page-form compact-form" onSubmit={startManualChat}>
          <label>Store ID<input value={manualChat.store_id} onChange={(event) => setManualChat((current) => ({ ...current, store_id: event.target.value }))} /></label>
          <label>User ID<input value={manualChat.receiver_id} onChange={(event) => setManualChat((current) => ({ ...current, receiver_id: event.target.value }))} /></label>
          <button className="secondary-button" type="submit">Open chat</button>
        </form>
        <div className="stack-list">
          {chats.length ? chats.map((chat) => (
            <button key={`${chat.store_id}-${chat.other_user_id}`} className={`chat-summary ${activeChat?.store_id === chat.store_id && activeChat?.other_user_id === chat.other_user_id ? 'active' : ''}`} onClick={() => setActiveChat(chat)}>
              <strong>{chat.other_username || `User #${chat.other_user_id}`}</strong>
              <span>Store #{chat.store_id}</span>
            </button>
          )) : <EmptyState icon="ti-messages-off" title="No chats yet" />}
        </div>
      </div>
      <div className="surface-card">
        <div className="surface-head">
          <h3>{activeChat ? `Store #${activeChat.store_id}` : 'Realtime chat'}</h3>
          <span className={`socket-pill ${socketState}`}>{socketState}</span>
        </div>
        {error ? <ErrorBox message={error} /> : null}
        <div className="chat-messages">
          {messages.length ? messages.map((item, index) => (
            <div key={`${item.sender_id}-${index}-${item.message}`} className={`chat-bubble ${item.sender_id === user.user_id ? 'mine' : ''}`}>
              <span>{item.message}</span>
            </div>
          )) : <EmptyState icon="ti-message-circle-off" title="Select a chat to start messaging" />}
        </div>
        <form className="chat-form" onSubmit={send}>
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message..." />
          <button className="primary-button" type="submit">Send</button>
        </form>
      </div>
    </section>
  );
}

function AdminUsersPage() {
  const { token } = useAuth();
  const { showToast } = useToasts();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');

  function load() {
    if (!token) return;
    api<any[]>('/users/', {}, token).then(setUsers).catch(() => setUsers([]));
  }

  useEffect(() => { load(); }, [token]);

  async function topUp(event: FormEvent) {
    event.preventDefault();
    if (!token || !selectedUser) return;
    try {
      await api(`/users/${selectedUser.id}/topup`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount) }),
      }, token);
      showToast('Balance updated');
      setModalOpen(false);
      setAmount('');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Top up failed', 'error');
    }
  }

  async function changeRole(id: number, role: string) {
    if (!token) return;
    try {
      await api(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }, token);
      showToast('Role updated');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Role update failed', 'error');
    }
  }

  const filtered = users.filter((item) => `${item.username} ${item.email}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <section>
      <div className="admin-banner">Admin view — manage users and balances</div>
      <div className="toolbar">
        <div className="search-wrap inline-search">
          <i className="ti ti-search" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users..." />
        </div>
      </div>
      <div className="surface-card">
        <table className="table">
          <thead><tr><th>User</th><th>Role</th><th>Balance</th><th>Orders</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="user-row">
                    <div className="small-avatar">{item.username.slice(0, 2).toUpperCase()}</div>
                    <div><strong>{item.username}</strong><span>{item.email}</span></div>
                  </div>
                </td>
                <td><span className="role-pill">{item.role}</span></td>
                <td className="mono-cell">{formatMoney(item.balance || 0)}</td>
                <td>{item.orders_count || '—'}</td>
                <td className="actions-row">
                  <button className="secondary-button" onClick={() => { setSelectedUser(item); setModalOpen(true); }}>+ Top up</button>
                  {item.role !== 'superadmin' ? (
                    <select className="inline-select" value={item.role} onChange={(event) => changeRole(item.id, event.target.value)}>
                      {['user', 'seller', 'admin'].map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} title="Top up balance" onClose={() => setModalOpen(false)}>
        <form className="page-form modal-body-stack" onSubmit={topUp}>
          <p>{selectedUser?.username}</p>
          <label>Amount<input value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
          <button className="primary-button" type="submit">Apply</button>
        </form>
      </Modal>
    </section>
  );
}

function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    api<Store[]>('/stores/').then(setStores).catch(() => setStores([]));
  }, []);

  return (
    <section className="surface-card">
      <div className="surface-head"><h3>All stores</h3></div>
      <table className="table">
        <thead><tr><th>Name</th><th>Owner</th><th>Products</th><th>Revenue</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {stores.map((store) => (
            <tr key={store.id}>
              <td>{store.name}</td>
              <td>{store.user?.username || `User #${store.user_id}`}</td>
              <td>{store.products?.length || 0}</td>
              <td className="mono-cell">{formatMoney((store.products?.length || 0) * 100)}</td>
              <td><StatusBadge status={store.is_active ? 'active' : 'suspended'} /></td>
              <td><button className="secondary-button">{store.is_active ? 'Suspend' : 'Activate'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function AdminNotificationsPage() {
  const { token } = useAuth();
  const { showToast } = useToasts();
  const [form, setForm] = useState({ user_id: '', message: '' });
  const [sent, setSent] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!token) return;
    api<NotificationItem[]>('/notifications/', {}, token).then(setSent).catch(() => setSent([]));
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await api('/notifications/', {
        method: 'POST',
        body: JSON.stringify({ user_id: Number(form.user_id), message: form.message }),
      }, token);
      showToast('Notification sent');
      setForm({ user_id: '', message: '' });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send notification', 'error');
    }
  }

  return (
    <section className="two-column-grid">
      <div className="surface-card">
        <div className="surface-head"><h3>Send notification</h3></div>
        <form className="page-form" onSubmit={submit}>
          <label>User ID<input value={form.user_id} onChange={(event) => setForm((current) => ({ ...current, user_id: event.target.value }))} /></label>
          <label>Message<textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} rows={5} /></label>
          <button className="primary-button" type="submit">Send</button>
        </form>
      </div>
      <div className="surface-card">
        <div className="surface-head"><h3>Recent notifications</h3></div>
        <div className="stack-list">
          {sent.map((item) => (
            <div key={item.id} className="review-row">
              <div><strong>User #{item.user_id}</strong><p>{item.message}</p></div>
              <span>{formatDate(item.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AssistantPage() {
  const { token } = useAuth();
  const { showToast } = useToasts();
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; message: string }>>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    Promise.all([
      api<Product[]>('/products/?limit=20').catch(() => []),
      api<Store[]>('/stores/').catch(() => []),
    ]).then(([productsData, storesData]) => {
      setProducts(productsData);
      setStores(storesData);
    });
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    const nextMessage = message;
    setHistory((current) => [...current, { role: 'user', message: nextMessage }]);
    setMessage('');
    setLoading(true);
    try {
      const response = await api<{ reply: string }>('/ai/chat/', {
        method: 'POST',
        body: JSON.stringify({ message: nextMessage }),
      }, token || undefined);
      setHistory((current) => [...current, { role: 'assistant', message: response.reply }]);
    } catch (err) {
      const fallbackReply = localAssistantReply(nextMessage, products, stores);
      setHistory((current) => [...current, { role: 'assistant', message: fallbackReply }]);
      showToast('AI API unavailable, used local fallback', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="surface-card">
      <LoadingBar active={loading} />
      <div className="surface-head"><h3>Reception Bot</h3></div>
      <div className="chat-messages">
        {history.length ? history.map((item, index) => (
          <div key={index} className={`chat-bubble ${item.role === 'user' ? 'mine' : ''}`}>
            <span>{item.message}</span>
          </div>
        )) : <EmptyState icon="ti-sparkles" title="Ask about stores, products, discounts or your orders" />}
      </div>
      <form className="chat-form" onSubmit={submit}>
        <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Find a camera for travel and low light..." />
        <button className="primary-button" type="submit">Ask</button>
      </form>
    </section>
  );
}

function SellerStudioPage() {
  const { token } = useAuth();
  const { showToast } = useToasts();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [storeForm, setStoreForm] = useState({ name: '', description: '' });
  const [productForm, setProductForm] = useState({ category_id: '', name: '', description: '', price: '', stock: '' });
  const [variantForm, setVariantForm] = useState({ product_id: '', name: '', variant_type: '', value: '', price: '', stock: '' });
  const [discountForm, setDiscountForm] = useState({ code: '', percent: '', expires_at: '' });
  const [imageForm, setImageForm] = useState({ product_id: '', image_url: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    if (!token) return;
    setLoading(true);
    api<Store>('/stores/my', {}, token)
      .then(async (myStore) => {
        setStore(myStore);
        setStoreForm({ name: myStore.name, description: myStore.description });
        const [productsData, categoriesData, discountsData] = await Promise.all([
          api<Product[]>(`/products/?store_id=${myStore.id}`, {}, token),
          api<Category[]>('/categories/', {}, token).catch(() => []),
          api<Discount[]>(`/discounts/store/${myStore.id}`, {}, token).catch(() => []),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
        setDiscounts(discountsData);
        if (productsData[0]) {
          const imageData = await api<ProductImage[]>(`/product-images/${productsData[0].id}`, {}, token).catch(() => []);
          setImages(imageData);
        } else {
          setImages([]);
        }
        setError('');
      })
      .catch(() => {
        setStore(null);
        setProducts([]);
        setCategories([]);
        setDiscounts([]);
        setImages([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [token]);

  async function createStore(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await api('/stores/', {
        method: 'POST',
        body: JSON.stringify(storeForm),
      }, token);
      showToast('Store created');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Store action failed');
    }
  }

  async function saveStore(event: FormEvent) {
    event.preventDefault();
    if (!token || !store) return;
    try {
      await api(`/stores/${store.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...storeForm, logo: null }),
      }, token);
      showToast('Store updated');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Store update failed', 'error');
    }
  }

  async function createProduct(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await api('/products/', {
        method: 'POST',
        body: JSON.stringify({
          category_id: Number(productForm.category_id),
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
        }),
      }, token);
      showToast('Product created');
      setProductForm({ category_id: '', name: '', description: '', price: '', stock: '' });
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Product creation failed', 'error');
    }
  }

  async function createVariant(event: FormEvent) {
    event.preventDefault();
    if (!token || !variantForm.product_id) return;
    try {
      await api(`/products/${variantForm.product_id}/variants`, {
        method: 'POST',
        body: JSON.stringify({
          name: variantForm.name,
          variant_type: variantForm.variant_type || null,
          value: variantForm.value || null,
          price: variantForm.price ? Number(variantForm.price) : null,
          stock: Number(variantForm.stock || 0),
        }),
      }, token);
      showToast('Variant added');
      setVariantForm({ product_id: '', name: '', variant_type: '', value: '', price: '', stock: '' });
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Variant creation failed', 'error');
    }
  }

  async function createDiscount(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await api('/discounts/', {
        method: 'POST',
        body: JSON.stringify({
          code: discountForm.code,
          percent: Number(discountForm.percent),
          expires_at: discountForm.expires_at || null,
        }),
      }, token);
      showToast('Discount created');
      setDiscountForm({ code: '', percent: '', expires_at: '' });
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Discount creation failed', 'error');
    }
  }

  async function createImage(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await api('/product-images/', {
        method: 'POST',
        body: JSON.stringify({
          product_id: Number(imageForm.product_id),
          image_url: imageForm.image_url,
        }),
      }, token);
      showToast('Image attached');
      setImageForm({ product_id: '', image_url: '' });
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Image attach failed', 'error');
    }
  }

  return (
    <section>
      <LoadingBar active={loading} />
      {error ? <ErrorBox message={error} /> : null}
      {!store ? (
        <div className="surface-card form-card">
          <div className="surface-head"><h3>Create your store</h3></div>
          <form className="page-form" onSubmit={createStore}>
            <label>Name<input value={storeForm.name} onChange={(event) => setStoreForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label>Description<textarea rows={4} value={storeForm.description} onChange={(event) => setStoreForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <button className="primary-button" type="submit">Create store</button>
          </form>
        </div>
      ) : (
        <div className="studio-grid">
          <div className="surface-card">
            <div className="surface-head"><h3>Store settings</h3></div>
            <form className="page-form" onSubmit={saveStore}>
              <label>Name<input value={storeForm.name} onChange={(event) => setStoreForm((current) => ({ ...current, name: event.target.value }))} /></label>
              <label>Description<textarea rows={4} value={storeForm.description} onChange={(event) => setStoreForm((current) => ({ ...current, description: event.target.value }))} /></label>
              <button className="secondary-button" type="submit">Save store</button>
            </form>
          </div>

          <div className="surface-card">
            <div className="surface-head"><h3>Create product</h3></div>
            <form className="page-form" onSubmit={createProduct}>
              <label>Category
                <select value={productForm.category_id} onChange={(event) => setProductForm((current) => ({ ...current, category_id: event.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label>Name<input value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} /></label>
              <label>Description<textarea rows={4} value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} /></label>
              <div className="two-inline-fields">
                <label>Price<input value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} /></label>
                <label>Stock<input value={productForm.stock} onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))} /></label>
              </div>
              <button className="primary-button" type="submit">Create product</button>
            </form>
          </div>

          <div className="surface-card">
            <div className="surface-head"><h3>Add variant</h3></div>
            <form className="page-form" onSubmit={createVariant}>
              <label>Product
                <select value={variantForm.product_id} onChange={(event) => setVariantForm((current) => ({ ...current, product_id: event.target.value }))}>
                  <option value="">Select product</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
              </label>
              <label>Name<input value={variantForm.name} onChange={(event) => setVariantForm((current) => ({ ...current, name: event.target.value }))} /></label>
              <div className="two-inline-fields">
                <label>Type<input value={variantForm.variant_type} onChange={(event) => setVariantForm((current) => ({ ...current, variant_type: event.target.value }))} /></label>
                <label>Value<input value={variantForm.value} onChange={(event) => setVariantForm((current) => ({ ...current, value: event.target.value }))} /></label>
              </div>
              <div className="two-inline-fields">
                <label>Variant price<input value={variantForm.price} onChange={(event) => setVariantForm((current) => ({ ...current, price: event.target.value }))} /></label>
                <label>Stock<input value={variantForm.stock} onChange={(event) => setVariantForm((current) => ({ ...current, stock: event.target.value }))} /></label>
              </div>
              <button className="secondary-button" type="submit">Add variant</button>
            </form>
          </div>

          <div className="surface-card">
            <div className="surface-head"><h3>Create discount</h3></div>
            <form className="page-form" onSubmit={createDiscount}>
              <label>Code<input value={discountForm.code} onChange={(event) => setDiscountForm((current) => ({ ...current, code: event.target.value }))} /></label>
              <div className="two-inline-fields">
                <label>Percent<input value={discountForm.percent} onChange={(event) => setDiscountForm((current) => ({ ...current, percent: event.target.value }))} /></label>
                <label>Expires at<input type="datetime-local" value={discountForm.expires_at} onChange={(event) => setDiscountForm((current) => ({ ...current, expires_at: event.target.value }))} /></label>
              </div>
              <button className="secondary-button" type="submit">Create discount</button>
            </form>
          </div>

          <div className="surface-card">
            <div className="surface-head"><h3>Attach product image</h3></div>
            <form className="page-form" onSubmit={createImage}>
              <label>Product
                <select value={imageForm.product_id} onChange={(event) => setImageForm((current) => ({ ...current, product_id: event.target.value }))}>
                  <option value="">Select product</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
              </label>
              <label>Image URL<input value={imageForm.image_url} onChange={(event) => setImageForm((current) => ({ ...current, image_url: event.target.value }))} /></label>
              <button className="secondary-button" type="submit">Attach image</button>
            </form>
          </div>

          <div className="surface-card">
            <div className="surface-head"><h3>Current store data</h3></div>
            <div className="summary-block">
              <div className="summary-row"><span>Products</span><strong>{products.length}</strong></div>
              <div className="summary-row"><span>Discounts</span><strong>{discounts.length}</strong></div>
              <div className="summary-row"><span>Images loaded</span><strong>{images.length}</strong></div>
              <div className="stack-list compact-list">
                {products.map((product) => (
                  <div key={product.id} className="review-row">
                    <div>
                      <strong>{product.name}</strong>
                      <p>{product.category?.name || 'Category'} · stock {product.stock}</p>
                    </div>
                    <span className="mono-cell">{formatMoney(product.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/products'} replace />;
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<AppShell />}>
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/stores/:id" element={<StoreDetailPage />} />

            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/favourites" element={<FavouritesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
            </Route>

            <Route element={<SellerRoute />}>
              <Route path="/seller/orders" element={<OrdersPage />} />
              <Route path="/seller/studio" element={<SellerStudioPage />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/stores" element={<AdminStoresPage />} />
              <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}
