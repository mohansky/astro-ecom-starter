export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  couponCode?: string;
  couponDiscount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone?: string;
  };
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  productSku?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrdersResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats?: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
  };
  error?: string;
}