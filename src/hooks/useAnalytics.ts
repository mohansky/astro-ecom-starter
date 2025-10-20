import { useQuery } from '@tanstack/react-query';

interface StatsData {
  period: string;
  orderCount: number;
  totalRevenue: number;
}

interface OrdersChartData {
  date: string;
  orderCount: number;
  revenue: number;
}

interface OrdersAnalyticsResponse {
  data: OrdersChartData[];
  totalOrders: number;
  totalRevenue: number;
  avgOrdersPerMonth: number;
}

interface ProductSalesData {
  productName: string;
  totalRevenue: number;
  totalQuantity: number;
}

interface ProductSalesResponse {
  data: ProductSalesData[];
  topProduct: {
    name: string;
    revenue: number;
  };
  totalProducts: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  itemCount: number;
  createdAt: string;
}

// Query Keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  ordersChart: (days: number) => [...analyticsKeys.all, 'orders-chart', days] as const,
  productSales: (days: number) => [...analyticsKeys.all, 'product-sales', days] as const,
  recentOrders: (limit: number) => [...analyticsKeys.all, 'recent-orders', limit] as const,
};

// Format period label based on the format
function formatPeriodLabel(period: string, days: number): string {
  if (days <= 7) {
    // Daily format: 2025-01-15 -> "15 Jan" or just "15"
    const [year, month, day] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  } else if (days <= 30) {
    // Weekly format: 2025-W03 -> "Week 3"
    const weekNum = period.split('-W')[1];
    return `Week ${parseInt(weekNum, 10)}`;
  } else {
    // Monthly format: 2025-01 -> "Jan"
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  }
}

// Generate complete date range with zero values for missing periods
function fillMissingPeriods(statsData: StatsData[], days: number): StatsData[] {
  const now = new Date();
  const periods: StatsData[] = [];
  const dataMap = new Map(statsData.map(d => [d.period, d]));

  if (days <= 7) {
    // Generate last 7 days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      // Format to match SQL: YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const period = `${year}-${month}-${day}`;
      periods.push(dataMap.get(period) || { period, orderCount: 0, totalRevenue: 0 });
    }
  } else if (days <= 30) {
    // Generate last ~4-5 weeks
    const weeksCount = Math.ceil(days / 7);
    for (let i = weeksCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7));
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      const period = `${year}-W${String(week).padStart(2, '0')}`;
      periods.push(dataMap.get(period) || { period, orderCount: 0, totalRevenue: 0 });
    }
  } else {
    // Generate months based on actual SQL date range (days back from now)
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Get all unique month periods from start date to now
    const monthsSet = new Set<string>();
    const currentDate = new Date(startDate);

    while (currentDate <= now) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const period = `${year}-${month}`;
      monthsSet.add(period);

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Convert to sorted array and generate periods
    const monthPeriods = Array.from(monthsSet).sort();
    console.log('Generating months for', days, 'days back. Periods:', monthPeriods);

    for (const period of monthPeriods) {
      console.log(`Period ${period}:`, 'Has data:', dataMap.has(period));
      periods.push(dataMap.get(period) || { period, orderCount: 0, totalRevenue: 0 });
    }
  }

  return periods;
}

// Get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Fetch orders chart data
async function fetchOrdersChartData(days: number): Promise<OrdersAnalyticsResponse> {
  const response = await fetch(`/api/orders/monthly-stats?days=${days}`);

  if (!response.ok) {
    throw new Error('Failed to fetch orders analytics data');
  }

  const statsData: StatsData[] = await response.json();

  // Debug logging
  console.log('Days filter:', days);
  console.log('API returned periods:', statsData.map(d => d.period));

  // Fill in missing periods with zero values
  const completeData = fillMissingPeriods(statsData, days);

  console.log('Complete periods generated:', completeData.map(d => d.period));

  // Calculate totals
  const totalOrders = completeData.reduce((sum, d) => sum + d.orderCount, 0);
  const totalRevenue = completeData.reduce((sum, d) => sum + d.totalRevenue, 0);
  const avgOrdersPerMonth = completeData.length > 0 ? totalOrders / completeData.length : 0;

  // Transform to expected format with formatted labels
  const data: OrdersChartData[] = completeData.map(d => ({
    date: formatPeriodLabel(d.period, days),
    orderCount: d.orderCount,
    revenue: d.totalRevenue,
  }));

  return {
    data,
    totalOrders,
    totalRevenue,
    avgOrdersPerMonth,
  };
}

// Hook: useOrdersChart
export function useOrdersChart(days: number = 365) {
  return useQuery({
    queryKey: analyticsKeys.ordersChart(days),
    queryFn: () => fetchOrdersChartData(days),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch product sales data
async function fetchProductSalesData(days: number): Promise<ProductSalesResponse> {
  const response = await fetch(`/api/orders/product-sales?days=${days}`);

  if (!response.ok) {
    throw new Error('Failed to fetch product sales data');
  }

  const productSales: ProductSalesData[] = await response.json();

  // Calculate totals and find top product
  const totalRevenue = productSales.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalProducts = productSales.length;
  const topProduct = productSales.length > 0
    ? { name: productSales[0].productName, revenue: productSales[0].totalRevenue }
    : { name: '-', revenue: 0 };

  return {
    data: productSales,
    topProduct,
    totalProducts,
    totalRevenue,
  };
}

// Hook: useProductSales
export function useProductSales(days: number = 365) {
  return useQuery({
    queryKey: analyticsKeys.productSales(days),
    queryFn: () => fetchProductSalesData(days),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch recent orders
async function fetchRecentOrders(limit: number): Promise<RecentOrder[]> {
  const response = await fetch(`/api/orders/recent?limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch recent orders');
  }

  return response.json();
}

// Hook: useRecentOrders
export function useRecentOrders(limit: number = 10) {
  return useQuery({
    queryKey: analyticsKeys.recentOrders(limit),
    queryFn: () => fetchRecentOrders(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
