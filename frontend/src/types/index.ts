export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'OWNER' | 'STAFF';
  is_active: boolean;
  created_at: string;
  addresses?: Address[];
}

export interface Address {
  id: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductImage {
  id: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
}

export interface ProductSpec {
  id?: string;
  spec_name: string;
  spec_value: string;
}

export interface Review {
  id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  title?: string;
  comment: string;
  created_at: string;
}

export interface Product {
  id: string;
  category_id?: string;
  name: string;
  slug: string;
  sku: string;
  brand?: string;
  short_description?: string;
  description: string;
  features?: string;
  price: number; // in paise (₹1 = 100 paise)
  sale_price?: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_published: boolean;
  is_featured: boolean;
  is_archived: boolean;
  weight_grams?: number;
  package_dimensions?: string;
  package_contents?: string;
  compatibility_info?: string;
  warranty_info?: string;
  return_eligible: boolean;
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  category?: Category;
  images: ProductImage[];
  specs: ProductSpec[];
  reviews: Review[];
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
  line_total_paise: number;
}

export interface Cart {
  id: string;
  session_token?: string;
  items: CartItem[];
  subtotal_paise: number;
  total_items: number;
}

export interface WishlistItem {
  id: string;
  product_id: string;
  product: Product;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  minimum_order: number;
  usage_limit: number;
  times_used: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
}

export interface OrderItem {
  id: string;
  product_id?: string;
  sku_snapshot: string;
  name_snapshot: string;
  unit_price_paise: number;
  quantity: number;
  tax_amount_paise: number;
  line_total_paise: number;
  image_url_snapshot?: string;
}

export interface Payment {
  id: string;
  gateway: string;
  gateway_order_id?: string;
  gateway_payment_id?: string;
  amount_paise: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface Shipment {
  id: string;
  carrier: string;
  tracking_number: string;
  tracking_url?: string;
  status: string;
  shipped_at: string;
  delivered_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED';
  payment_method: 'ONLINE' | 'COD';
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUND_PENDING' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
  cod_collected: boolean;
  address_snapshot: {
    recipient_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  subtotal_paise: number;
  discount_paise: number;
  shipping_paise: number;
  tax_paise: number;
  total_paise: number;
  coupon_code?: string;
  cancellation_reason?: string;
  return_reason?: string;
  notes?: string;
  created_at: string;
  items: OrderItem[];
  payments: Payment[];
  shipments: Shipment[];
}

export interface QuoteResponse {
  subtotal_paise: number;
  discount_paise: number;
  shipping_paise: number;
  tax_paise: number;
  total_paise: number;
  coupon_code?: string;
  coupon_message?: string;
  is_cod_eligible: boolean;
  estimated_delivery_days: number;
}

export interface DashboardStats {
  total_orders: number;
  paid_revenue_paise: number;
  pending_orders: number;
  cod_pending_count: number;
  cod_pending_paise: number;
  total_products: number;
  low_stock_count: number;
  recent_orders: Order[];
  best_sellers: Array<{
    product_id?: string;
    name: string;
    sku: string;
    total_quantity: number;
    total_revenue_paise: number;
  }>;
  order_status_counts: Record<string, number>;
  payment_method_counts: Record<string, number>;
}

export interface SalesReport {
  period: string;
  total_orders: number;
  total_revenue_paise: number;
  average_order_value_paise: number;
  by_date: Array<{ date: string; orders: number; revenue_paise: number }>;
  by_payment_method: Record<string, number>;
  by_status: Record<string, number>;
}

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  orders_count: number;
  total_spent_paise: number;
}

export interface NotificationLog {
  id: string;
  order_id?: string;
  channel: string;
  recipient: string;
  template_key: string;
  status: string;
  provider_message_id?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

export interface BannerItem {
  id: string | number;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  priceNote?: string;
  tagColor?: string;
  featuredProductSku?: string;
}

export interface StoreSettings {
  store_name: string;
  currency: string;
  currency_symbol: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  default_shipping_paise: number;
  free_shipping_threshold_paise: number;
  tax_rate_percent: number;
  cod_enabled: boolean;
  cod_max_limit_paise: number;
  return_window_days: number;
  email_notifications_enabled: boolean;
  whatsapp_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  promotional_banners?: string;
}
