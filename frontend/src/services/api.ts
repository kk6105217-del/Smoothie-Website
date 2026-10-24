import {
  User, Address, Category, Product, ProductListResponse, Cart, WishlistItem,
  Order, QuoteResponse, DashboardStats, SalesReport, CustomerSummary,
  NotificationLog, StoreSettings, Coupon
} from '../types';

const API_BASE = '/api/v1';

// Session token generator for guest carts
function getGuestSessionToken(): string {
  let token = localStorage.getItem('diy_guest_session');
  if (!token) {
    token = 'gst_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('diy_guest_session', token);
  }
  return token;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('diy_token');
  const sessionToken = getGuestSessionToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-Token': sessionToken,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Something went wrong';
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    request<{ access_token: string; role: string; user_id: string; name: string; email: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; role: string; user_id: string; name: string; email: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  getMe: () => request<User>('/users/me'),
  updateProfile: (data: { name?: string; phone?: string }) =>
    request<User>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  listAddresses: () => request<Address[]>('/users/addresses'),
  createAddress: (data: Omit<Address, 'id' | 'created_at'>) =>
    request<Address>('/users/addresses', { method: 'POST', body: JSON.stringify(data) }),
  deleteAddress: (id: string) =>
    request<{ message: string }>(`/users/addresses/${id}`, { method: 'DELETE' }),

  // Categories & Products
  listCategories: () => request<Category[]>('/categories'),
  listProducts: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, v.toString());
      }
    });
    const qs = searchParams.toString();
    return request<ProductListResponse>(`/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (slug: string) => request<Product>(`/products/${slug}`),
  addReview: (productId: string, data: { rating: number; title?: string; comment: string }) =>
    request<any>(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),

  // Cart & Wishlist
  getCart: () => request<Cart>('/cart'),
  addToCart: (productId: string, quantity: number = 1) =>
    request<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity, session_token: getGuestSessionToken() }),
    }),
  updateCartItem: (itemId: string, quantity: number) =>
    request<Cart>(`/cart/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  removeCartItem: (itemId: string) =>
    request<Cart>(`/cart/items/${itemId}`, { method: 'DELETE' }),
  getWishlist: () => request<WishlistItem[]>('/cart/wishlist'),
  toggleWishlist: (productId: string) =>
    request<{ saved: boolean; message: string }>('/cart/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    }),

  // Checkout & Pricing
  getQuote: (data: { items: Array<{ product_id: string; quantity: number }>; pincode?: string; coupon_code?: string }) =>
    request<QuoteResponse>('/checkout/quote', { method: 'POST', body: JSON.stringify(data) }),
  applyCoupon: (code: string, subtotalPaise: number) =>
    request<{ is_valid: boolean; code: string; discount_paise: number; message: string }>('/checkout/coupons/apply', {
      method: 'POST',
      body: JSON.stringify({ code, cart_subtotal_paise: subtotalPaise }),
    }),

  // Orders
  createOrder: (data: any) =>
    request<{ order: Order; gateway_data?: any }>('/orders', {
      method: 'POST',
      body: JSON.stringify({ ...data, session_token: getGuestSessionToken() }),
    }),
  listMyOrders: (page: number = 1) =>
    request<{ items: Order[]; total: number; page: number; total_pages: number }>(`/orders?page=${page}`),
  getOrder: (identifier: string) => request<Order>(`/orders/${identifier}`),
  cancelOrder: (orderId: string, reason: string) =>
    request<Order>(`/orders/${orderId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  requestReturn: (orderId: string, reason: string) =>
    request<Order>(`/orders/${orderId}/return-requests`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getOrderTracking: (orderId: string) => request<any[]>(`/orders/${orderId}/tracking`),

  // Payments
  verifyPayment: (data: { order_id: string; gateway_order_id: string; gateway_payment_id: string; gateway_signature?: string }) =>
    request<{ success: boolean; message: string; payment_status: string; order_status: string }>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Store Settings
  getSettings: () => request<StoreSettings>('/settings'),

  // Owner Administration
  admin: {
    getDashboard: () => request<DashboardStats>('/admin/dashboard'),
    listProducts: (params: Record<string, any> = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, v.toString());
        }
      });
      const qs = searchParams.toString();
      return request<ProductListResponse>(`/admin/products${qs ? `?${qs}` : ''}`);
    },
    createProduct: (data: any) => request<Product>('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id: string, data: any) =>
      request<Product>(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    archiveProduct: (id: string) =>
      request<Product>(`/admin/products/${id}`, { method: 'DELETE' }),
    publishProduct: (id: string, is_published: boolean) =>
      request<Product>(`/admin/products/${id}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ is_published }),
      }),
    uploadProductImages: async (id: string, files: FileList | File[] | File) => {
      const token = localStorage.getItem('diy_token');
      const formData = new FormData();
      if (files instanceof FileList || Array.isArray(files)) {
        Array.from(files).forEach((f) => formData.append('files', f));
      } else {
        formData.append('file', files);
      }
      const res = await fetch(`${API_BASE}/admin/products/${id}/images`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload product image(s)');
      return res.json() as Promise<Product>;
    },
    listCategories: () => request<Category[]>('/admin/categories'),
    createCategory: (data: any) =>
      request<Category>('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id: string, data: any) =>
      request<Category>(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteCategory: (id: string) =>
      request<{ message: string }>(`/admin/categories/${id}`, { method: 'DELETE' }),
    listOrders: (params: Record<string, any> = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, v.toString());
        }
      });
      const qs = searchParams.toString();
      return request<{ items: Order[]; total: number; page: number; total_pages: number }>(`/admin/orders${qs ? `?${qs}` : ''}`);
    },
    getOrder: (id: string) => request<Order>(`/admin/orders/${id}`),
    updateOrderStatus: (id: string, data: { status: string; notes?: string; cod_collected?: boolean }) =>
      request<Order>(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    addShipment: (orderId: string, data: { carrier: string; tracking_number: string; tracking_url?: string; status?: string }) =>
      request<Order>(`/admin/orders/${orderId}/shipments`, { method: 'POST', body: JSON.stringify(data) }),
    listCustomers: () => request<CustomerSummary[]>('/admin/customers'),
    listCoupons: () => request<Coupon[]>('/admin/coupons'),
    createCoupon: (data: any) => request<Coupon>('/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
    updateCoupon: (id: string, data: any) => request<Coupon>(`/admin/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteCoupon: (id: string) => request<{ message: string }>(`/admin/coupons/${id}`, { method: 'DELETE' }),
    getSalesReport: (days: number = 30) => request<SalesReport>(`/admin/reports/sales?days=${days}`),
    getNotifications: (channel?: string) =>
      request<NotificationLog[]>(`/admin/notifications${channel ? `?channel=${channel}` : ''}`),
    getAuditLogs: () => request<any[]>('/admin/audit-logs'),
    updateSettings: (settings: Record<string, string>) =>
      request<StoreSettings>('/settings/admin', { method: 'PATCH', body: JSON.stringify({ settings }) }),
    uploadImage: async (file: File) => {
      const token = localStorage.getItem('diy_token');
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/admin/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload image');
      return res.json() as Promise<{ url: string; filename: string }>;
    },
  },
};
