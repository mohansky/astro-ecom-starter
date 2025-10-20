import React, { useState, useEffect, useCallback } from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/db';

interface ShopProductGridProps {
  initialProducts: Product[];
  initialCategory?: string;
  categories: string[];
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function ShopProductGrid({ initialProducts, initialCategory = '', categories }: ShopProductGridProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<Pagination>({
    total: initialProducts.length,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  const categoryVariants = [
    { name: 'All', value: '' },
    ...categories.map((cat) => ({ name: cat, value: cat })),
  ];

  const loadProducts = useCallback(async (searchQuery: string, categoryFilter: string, pageLimit: number, offset: number) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: pageLimit.toString(),
        offset: offset.toString(),
      });

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      if (categoryFilter.trim()) {
        params.set('category', categoryFilter.trim());
      }

      const response = await fetch(`/api/shop/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load products');
      }

      setProducts(data.products || []);
      setPagination(data.pagination);

      // Update URL without page reload
      const newUrl = new URL(window.location.href);
      if (categoryFilter) {
        newUrl.searchParams.set('category', categoryFilter);
      } else {
        newUrl.searchParams.delete('category');
      }

      if (searchQuery) {
        newUrl.searchParams.set('search', searchQuery);
      } else {
        newUrl.searchParams.delete('search');
      }

      window.history.replaceState({}, '', newUrl);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') {
        loadProducts(search, category, limit, 0);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    loadProducts(search, newCategory, limit, 0);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    loadProducts(search, category, newLimit, 0);
  };

  const handleClear = () => {
    setSearch('');
    setCategory('');
    loadProducts('', '', limit, 0);
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      loadProducts(search, category, limit, pagination.offset - pagination.limit);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      loadProducts(search, category, limit, pagination.offset + pagination.limit);
    }
  };

  const resultsText = () => {
    if (pagination.total === 0) return 'No products found';
    const start = pagination.offset + 1;
    const end = Math.min(pagination.offset + pagination.limit, pagination.total);
    return `Showing ${start}-${end} of ${pagination.total} products`;
  };

  return (
    <div className="space-y-6">
      {/* Category Buttons */}
      <div className="flex flex-wrap">
        {categoryVariants.map((item) => {
          const isActive = item.value === category;
          return (
            <button
              key={item.value}
              onClick={() => handleCategoryChange(item.value)}
              className={`mb-4 mr-3 px-4 py-2 text-sm font-semibold rounded-lg inline-block cursor-pointer ${
                isActive
                  ? 'bg-black text-white'
                  : 'bg-muted hover:bg-black hover:text-white focus:bg-black focus:text-white'
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input input-bordered w-full"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="select select-bordered"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
          <button onClick={handleClear} className="btn btn-outline">
            Clear
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted">
            Try adjusting your search criteria or browse different categories
          </p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && products.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs text-muted">{resultsText()}</p>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={pagination.offset === 0}
                className="btn btn-sm btn-outline"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={!pagination.hasMore}
                className="btn btn-sm btn-outline"
              >
                Next
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
