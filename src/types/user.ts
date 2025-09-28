export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  emailVerified: boolean;
  image?: string;
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
  lastLoginAt?: string;
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