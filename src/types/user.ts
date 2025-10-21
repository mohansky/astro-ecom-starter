export interface User {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role: 'admin' | 'user' | 'customer';
  emailVerified: boolean;
  image?: string | null;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
  isActive?: boolean;
}

export interface UsersResponse {
  success: boolean;
  users: User[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats?: {
    totalUsers: number;
    verifiedUsers: number;
    adminUsers: number;
    activeUsers: number;
  };
  error?: string;
}