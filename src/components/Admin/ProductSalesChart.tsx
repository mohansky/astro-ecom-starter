import React, { useState, useEffect, useRef } from 'react';
import { useProductSales } from '../../hooks/useAnalytics';
import { Chart, registerables } from 'chart.js';
import { QueryProvider } from '@/providers/QueryProvider';

// Register Chart.js components
Chart.register(...registerables);

function ProductSalesChartContent() {
  const [days, setDays] = useState(365);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const { data, isLoading, error } = useProductSales(days);

  useEffect(() => {
    if (!data || !chartRef.current || !data.data.length) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Take top 10 products
    const topProducts = data.data.slice(0, 10);

    // Generate colors
    const colors = [
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 206, 86)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)',
      'rgb(199, 199, 199)',
      'rgb(83, 102, 255)',
      'rgb(255, 99, 255)',
      'rgb(99, 255, 132)',
    ];

    // Create new chart
    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: topProducts.map((p) => p.productName),
        datasets: [
          {
            label: 'Revenue (₹)',
            data: topProducts.map((p) => p.totalRevenue),
            backgroundColor: colors.slice(0, topProducts.length),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                if (value === null) return '';
                const product = topProducts[context.dataIndex];
                return [
                  `Revenue: ₹${value.toLocaleString('en-IN')}`,
                  `Quantity: ${product.totalQuantity}`,
                ];
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data]);

  const getDateRangeDescription = (days: number) => {
    switch (days) {
      case 7:
        return 'Last 7 days';
      case 30:
        return 'Last 30 days';
      case 90:
        return 'Last 90 days';
      case 365:
        return 'Last year';
      default:
        return `Last ${days} days`;
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm w-full">
      <div className="card-body">
        <h2 className="text-md mb-4">Product Sales Distribution</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {[7, 30, 90, 365].map((d) => (
            <button
              key={d}
              className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setDays(d)}
            >
              {d === 7 ? '7D' : d === 30 ? '1M' : d === 90 ? '3M' : '1Y'}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span>Failed to load chart data</span>
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            {data.data.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-base-content/70 text-center">
                  No product sales data available
                </p>
              </div>
            ) : (
              <>
                <div className="h-80 w-full">
                  <canvas ref={chartRef}></canvas>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="stat bg-base-200 rounded-lg p-4">
                    <p className="text-xs opacity-50">Top Product</p>
                    <h3 className="text-sm text-primary">
                      {data.topProduct?.name || '-'}
                    </h3>
                    <p className="text-xs opacity-50">
                      ₹{(data.topProduct?.revenue || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="stat bg-base-200 rounded-lg p-4">
                    <p className="text-xs opacity-50">Total Products</p>
                    <h3 className="text-sm text-info">
                      {data.totalProducts || 0}
                    </h3>
                    <p className="text-xs opacity-50">
                      {getDateRangeDescription(days)}
                    </p>
                  </div>
                  <div className="stat bg-base-200 rounded-lg p-4">
                    <p className="text-xs opacity-50">Total Sales</p>
                    <h3 className="text-sm text-accent">
                      ₹{(data.totalRevenue || 0).toLocaleString('en-IN')}
                    </h3>
                    <p className="text-xs opacity-50">
                      {getDateRangeDescription(days)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function ProductSalesChart() {
  return (
    <QueryProvider>
      <ProductSalesChartContent />
    </QueryProvider>
  );
}
