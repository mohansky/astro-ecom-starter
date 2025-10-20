import React, { useState, useEffect, useRef } from 'react';
import { useOrdersChart } from '../../hooks/useAnalytics';
import { Chart, registerables } from 'chart.js';
import { QueryProvider } from '@/providers/QueryProvider';

// Register Chart.js components
Chart.register(...registerables);

function OrdersChartContent() {
  const [days, setDays] = useState(365);
  const [showRevenue, setShowRevenue] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const { data, isLoading, error } = useOrdersChart(days);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Create new chart
    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.data.map((d) => d.date),
        datasets: [
          {
            label: showRevenue ? 'Revenue (₹)' : 'Orders',
            data: data.data.map((d) =>
              showRevenue ? d.revenue : d.orderCount
            ),
            borderColor: showRevenue
              ? 'rgb(54, 162, 235)'
              : 'rgb(255, 206, 86)',
            backgroundColor: showRevenue
              ? 'rgba(54, 162, 235, 0.2)'
              : 'rgba(255, 206, 86, 0.2)',
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                if (value === null) return '';
                return showRevenue
                  ? `Revenue: ₹${value.toLocaleString('en-IN')}`
                  : `Orders: ${value}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data, showRevenue]);

  const getDateRangeDescription = (days: number) => {
    switch (days) {
      case 7:
        return 'Last 7 days';
      case 30:
        return 'Last 30 days';
      case 90:
        return 'Last 90 days';
      case 365:
        return 'Last 12 months';
      default:
        return `Last ${days} days`;
    }
  };

  return (
    <>
      {/* Stats */}
      <div className="bg-base-100 stats border-0 shadow-none flex flex-col md:flex-row gap-4 mb-5">
        <div className="stat bg-base-200 rounded-sm">
          <p className="text-xs opacity-50">Total Orders</p>
          <h2 className="text-xl font-bold text-warning">
            {isLoading ? '-' : data?.totalOrders || 0}
          </h2>
          <p className="text-xs opacity-50">{getDateRangeDescription(days)}</p>
        </div>

        <div className="stat bg-base-200 rounded-sm">
          <p className="text-xs opacity-50">Total Revenue</p>
          <h2 className="text-xl font-bold text-info">
            {isLoading
              ? '-'
              : `₹${(data?.totalRevenue || 0).toLocaleString('en-IN')}`}
          </h2>
          <p className="text-xs opacity-50">{getDateRangeDescription(days)}</p>
        </div>

        <div className="stat bg-base-200 rounded-sm">
          <p className="text-xs opacity-50">Avg Orders/Month</p>
          <h2 className="text-xl font-bold text-accent">
            {isLoading ? '-' : Math.round(data?.avgOrdersPerMonth || 0)}
          </h2>
          <p className="text-xs opacity-50">12 month average</p>
        </div>
      </div>

      {/* Chart Card */}
      <div className="card bg-base-100 shadow-sm w-full">
        <div className="card-body">
          <h2 className="text-md mb-4">Orders Received</h2>

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

          {!isLoading && !error && (
            <>
              <div className="flex flex-wrap gap-2">
                <div className="flex flex-wrap gap-2">
                  {[7, 30, 90, 365].map((d) => (
                    <button
                      key={d}
                      className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setDays(d)}
                    >
                      {d === 7
                        ? '7D'
                        : d === 30
                          ? '1M'
                          : d === 90
                            ? '3M'
                            : '1Y'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-accent btn-sm"
                    onClick={() => setShowRevenue(!showRevenue)}
                  >
                    {showRevenue ? 'Show Orders' : 'Show Revenue'}
                  </button>
                </div>
              </div>
              <div className="h-80 w-full">
                <canvas ref={chartRef}></canvas>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function OrdersChart() {
  return (
    <QueryProvider>
      <OrdersChartContent />
    </QueryProvider>
  );
}
