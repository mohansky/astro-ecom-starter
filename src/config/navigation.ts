import { DashboardIcon } from '../components/Icons/DashboardIcon';
import { AnalyticsIcon } from '../components/Icons/AnalyticsIcon';
import { OrdersIcon } from '../components/Icons/OrdersIcon';
import { CustomersIcon } from '../components/Icons/CustomersIcon';
import { ProductsIcon } from '../components/Icons/ProductsIcon';
import { DiscountsIcon } from '../components/Icons/DiscountsIcon';
import { SettingsIcon } from '../components/Icons/SettingsIcon';
import { UsersIcon } from '../components/Icons/UsersIcon';

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
}

export const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: DashboardIcon,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: AnalyticsIcon,
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: OrdersIcon,
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: CustomersIcon,
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: ProductsIcon,
  },
  {
    name: 'Discounts',
    href: '/admin/discounts',
    icon: DiscountsIcon,
  },
];

export const settingsItems: NavItem[] = [
  {
    name: 'Profile Settings',
    href: '/admin/profile-settings',
    icon: SettingsIcon,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: UsersIcon,
    adminOnly: true,
  },
];
