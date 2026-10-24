import {
  User,
  Category,
  Product,
  CartItem,
  Coupon,
  Order,
  Review,
  Banner,
  StoreSettings,
  Address,
  UpiPayment
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('vk_auth_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('vk_auth_token', token);
  } else {
    localStorage.removeItem('vk_auth_token');
  }
}

export function getGuestId(): string {
  let guestId = localStorage.getItem('vk_guest_id');
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('vk_guest_id', guestId);
  }
  return guestId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const guestId = getGuestId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-guest-id': guestId,
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If uploading FormData, delete Content-Type to allow browser boundary setting
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || (typeof data === 'string' ? data : 'An unexpected error occurred');
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ user: User; token: string; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    adminLogin: (credentials: { email: string; password: string }) =>
      request<{ user: User; token: string; message: string }>('/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    register: (userData: { full_name: string; email: string; password: string; phone?: string }) =>
      request<{ user: User; token: string; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      }),
    getMe: () => request<{ user: User }>('/auth/me'),
    updateProfile: (profile: { full_name: string; phone?: string }) =>
      request<{ message: string }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      }),
    changePassword: (passwords: { current_password: string; new_password: string }) =>
      request<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(passwords)
      }),
    forgotPassword: (email: string) =>
      request<{ message: string; resetToken?: string; info?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),
    resetPassword: (payload: { token: string; new_password: string }) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    getAddresses: () => request<{ addresses: Address[] }>('/auth/addresses'),
    addAddress: (address: Address) =>
      request<{ message: string; id: number }>('/auth/addresses', {
        method: 'POST',
        body: JSON.stringify(address)
      }),
    deleteAddress: (id: number) =>
      request<{ message: string }>(`/auth/addresses/${id}`, {
        method: 'DELETE'
      }),
  },

  // Categories
  categories: {
    getAll: () => request<{ categories: Category[] }>('/categories'),
    getAdminAll: () => request<{ categories: Category[] }>('/categories/all'),
    getBySlug: (slug: string) => request<{ category: Category }>(`/categories/${slug}`),
    create: (category: Partial<Category>) =>
      request<{ message: string; id: number }>('/categories', {
        method: 'POST',
        body: JSON.stringify(category)
      }),
    update: (id: number, category: Partial<Category>) =>
      request<{ message: string }>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(category)
      }),
    delete: (id: number) =>
      request<{ message: string }>(`/categories/${id}`, {
        method: 'DELETE'
      }),
  },

  // Products
  products: {
    getAll: (params: {
      q?: string;
      category?: string;
      brand?: string;
      min_price?: number;
      max_price?: number;
      in_stock?: boolean;
      rating?: number;
      featured?: boolean;
      sort?: string;
      page?: number;
      limit?: number;
    } = {}) => {
      const query = new URLSearchParams();
      if (params.q) query.append('q', params.q);
      if (params.category) query.append('category', params.category);
      if (params.brand) query.append('brand', params.brand);
      if (params.min_price) query.append('min_price', String(params.min_price));
      if (params.max_price) query.append('max_price', String(params.max_price));
      if (params.in_stock) query.append('in_stock', 'true');
      if (params.rating) query.append('rating', String(params.rating));
      if (params.featured) query.append('featured', 'true');
      if (params.sort) query.append('sort', params.sort);
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));

      return request<{
        products: Product[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>(`/products?${query.toString()}`);
    },
    getAdminAll: (params: { search?: string; category?: number | string; status?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.category) query.append('category', String(params.category));
      if (params.status) query.append('status', params.status);
      return request<{ products: Product[] }>(`/products/admin/all?${query.toString()}`);
    },
    getBySlug: (slug: string) => request<{ product: Product }>(`/products/${slug}`),
    create: (product: any) =>
      request<{ message: string; productId: number }>('/products', {
        method: 'POST',
        body: JSON.stringify(product)
      }),
    update: (id: number, product: any) =>
      request<{ message: string }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product)
      }),
    updateStock: (id: number, stock_quantity: number) =>
      request<{ message: string }>(`/products/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock_quantity })
      }),
    toggleStatus: (id: number, is_active: boolean) =>
      request<{ message: string }>(`/products/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active })
      }),
    delete: (id: number) =>
      request<{ message: string }>(`/products/${id}`, {
        method: 'DELETE'
      }),
  },

  // Cart
  cart: {
    get: () => request<{ items: CartItem[]; subtotal: number; count: number }>('/cart'),
    addItem: (productId: number, quantity: number = 1) =>
      request<{ message: string }>('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity })
      }),
    updateQuantity: (productId: number, quantity: number) =>
      request<{ message: string }>(`/cart/items/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity })
      }),
    removeItem: (productId: number) =>
      request<{ message: string }>(`/cart/items/${productId}`, {
        method: 'DELETE'
      }),
    clear: () =>
      request<{ message: string }>('/cart/clear', {
        method: 'DELETE'
      }),
    sync: (guestId: string, items: { product_id: number; quantity: number }[]) =>
      request<{ message: string }>('/cart/sync', {
        method: 'POST',
        body: JSON.stringify({ guest_id: guestId, items })
      }),
  },

  // Wishlist
  wishlist: {
    get: () => request<{ items: Product[] }>('/wishlist'),
    toggle: (productId: number) =>
      request<{ inWishlist: boolean; message: string }>('/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId })
      }),
    remove: (productId: number) =>
      request<{ message: string }>(`/wishlist/${productId}`, {
        method: 'DELETE'
      }),
  },

  // Orders
  orders: {
    create: (orderData: any) =>
      request<{
        message: string;
        order: {
          id: number;
          order_number: string;
          total_amount: number;
          payment_method: string;
          payment_status: string;
          order_status: string;
          shipping_fee: number;
          discount_amount: number;
        };
        notifications?: any;
      }>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      }),
    createRazorpayOrder: (orderId: number) =>
      request<{
        key: string;
        razorpay_order_id: string;
        amount: number;
        currency: string;
        order_number: string;
        is_mock: boolean;
        message?: string;
      }>('/orders/create-razorpay-order', {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId })
      }),
    verifyPayment: (payload: {
      order_id: number;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      is_mock?: boolean;
    }) =>
      request<{ message: string; order_number: string; notifications?: any }>('/orders/verify-payment', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    getMyOrders: () => request<{ orders: Order[] }>('/orders/my-orders'),
    getById: (id: number | string) => request<{ order: Order }>(`/orders/${id}`),
    track: (orderNumber: string, email?: string) =>
      request<{ order: Order }>(`/orders/track/${orderNumber}${email ? `?email=${encodeURIComponent(email)}` : ''}`),
    getAdminAll: (params: { status?: string; payment_status?: string; search?: string; page?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.status) q.append('status', params.status);
      if (params.payment_status) q.append('payment_status', params.payment_status);
      if (params.search) q.append('search', params.search);
      if (params.page) q.append('page', String(params.page));
      return request<{ orders: Order[]; total: number; page: number; totalPages: number }>(`/orders/admin/all?${q.toString()}`);
    },
    updateStatus: (id: number, data: { order_status?: string; payment_status?: string; tracking_number?: string; notes?: string }) =>
      request<{ message: string }>(`/orders/admin/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    retryNotification: (orderId: number, logId: number) =>
      request<{ message: string }>(`/orders/admin/${orderId}/retry-notification`, {
        method: 'POST',
        body: JSON.stringify({ log_id: logId })
      }),
    getNotifications: (orderId: number) =>
      request<{ logs: any[] }>(`/orders/admin/${orderId}/notifications`),
  },

  // Coupons
  coupons: {
    validate: (code: string, subtotal: number) =>
      request<{ valid: boolean; coupon: Coupon }>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal })
      }),
    getAdminAll: () => request<{ coupons: Coupon[] }>('/coupons/admin/all'),
    create: (coupon: Partial<Coupon>) =>
      request<{ message: string; id: number }>('/coupons/admin', {
        method: 'POST',
        body: JSON.stringify(coupon)
      }),
    update: (id: number, coupon: Partial<Coupon>) =>
      request<{ message: string }>(`/coupons/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify(coupon)
      }),
    delete: (id: number) =>
      request<{ message: string }>(`/coupons/admin/${id}`, {
        method: 'DELETE'
      }),
  },

  // Reviews
  reviews: {
    getByProduct: (productId: number) => request<{ reviews: Review[] }>(`/reviews/product/${productId}`),
    submit: (review: { product_id: number; rating: number; title?: string; comment: string; customer_name?: string }) =>
      request<{ message: string; reviewId: number }>('/reviews', {
        method: 'POST',
        body: JSON.stringify(review)
      }),
    getAdminAll: () => request<{ reviews: Review[] }>('/reviews/admin/all'),
    updateStatus: (id: number, status: 'approved' | 'rejected' | 'pending') =>
      request<{ message: string }>(`/reviews/admin/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),
    delete: (id: number) =>
      request<{ message: string }>(`/reviews/admin/${id}`, {
        method: 'DELETE'
      }),
  },

  // Banners
  banners: {
    getAll: () => request<{ banners: Banner[] }>('/banners'),
    getAdminAll: () => request<{ banners: Banner[] }>('/banners/admin/all'),
    create: (banner: Partial<Banner>) =>
      request<{ message: string; id: number }>('/banners/admin', {
        method: 'POST',
        body: JSON.stringify(banner)
      }),
    update: (id: number, banner: Partial<Banner>) =>
      request<{ message: string }>(`/banners/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify(banner)
      }),
    delete: (id: number) =>
      request<{ message: string }>(`/banners/admin/${id}`, {
        method: 'DELETE'
      }),
  },

  // Settings & Analytics
  settings: {
    get: () => request<{ settings: StoreSettings }>('/settings'),
    update: (settings: StoreSettings) =>
      request<{ message: string }>('/settings/admin', {
        method: 'PUT',
        body: JSON.stringify(settings)
      }),
    getAdminStats: () =>
      request<{
        stats: {
          total_sales: number;
          total_orders: number;
          pending_orders: number;
          completed_orders: number;
          cancelled_orders: number;
          total_products: number;
          low_stock_products: number;
          out_of_stock_products: number;
        };
        recentOrders: any[];
        bestSellers: any[];
        dailySales: any[];
      }>('/settings/admin/stats'),
  },

  // Upload
  upload: {
    single: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return request<{ url: string; filename: string; size: number }>('/upload', {
        method: 'POST',
        body: formData
      });
    },
    multiple: (files: File[]) => {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      return request<{ files: Array<{ url: string; filename: string; size: number }> }>('/upload/multiple', {
        method: 'POST',
        body: formData
      });
    }
  },

  // Contact
  contact: {
    send: (message: { name: string; email: string; phone?: string; subject?: string; message: string }) =>
      request<{ message: string }>('/contact', {
        method: 'POST',
        body: JSON.stringify(message)
      })
  },

  // UPI Payments
  upi: {
    getConfig: () =>
      request<{
        enabled: boolean;
        upi_id: string;
        payee_name: string;
        qr_image_url: string;
        owner_whatsapp: string;
      }>('/upi/config'),
    getAdminAll: (params: { status?: string; search?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.status) q.append('status', params.status);
      if (params.search) q.append('search', params.search);
      return request<{ payments: UpiPayment[]; stats: any }>(`/upi/admin/all?${q.toString()}`);
    },
    approve: (id: number) =>
      request<{ message: string }>(`/upi/admin/${id}/approve`, {
        method: 'POST'
      }),
    reject: (id: number, reason: string, notes?: string) =>
      request<{ message: string }>(`/upi/admin/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason, notes })
      }),
    updateNote: (id: number, admin_notes: string) =>
      request<{ message: string }>(`/upi/admin/${id}/note`, {
        method: 'PUT',
        body: JSON.stringify({ admin_notes })
      }),
    getAuditLogs: () =>
      request<{ logs: any[] }>('/upi/admin/audit-logs'),
  }
};
