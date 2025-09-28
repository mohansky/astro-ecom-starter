export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export interface CustomerOrder {
  id: number;
  date: string;
  total: number;
  status: string;
  itemCount: number;
}

export interface CustomerDetail extends Customer {
  orders: CustomerOrder[];
}

export interface CustomersResponse {
  success: boolean;
  customers: Customer[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}