import React from 'react';
import type { Product as DBProduct } from '@/lib/db';

interface ProductCardProps {
  product: DBProduct;
  r2BucketUrl?: string;
  onAddToCart?: (product: DBProduct) => void;
}

export function ProductCard({
  product,
  r2BucketUrl = 'https://pub-67b76734f5b543b9925c0870089929bb.r2.dev',
  onAddToCart,
}: ProductCardProps) {
  const categoryClass =
    product.category === 'Macrame'
      ? 'badge-error'
      : product.category === 'Stitching'
        ? 'badge-accent'
        : '';

  const displayImage =
    product.mainImage ||
    (product.images && product.images.length > 0 ? product.images[0] : null);
  const imageUrl = displayImage
    ? `${r2BucketUrl}/products/${product.slug}/${displayImage}`
    : null;

  const finalPrice = product.price || product.mrp;
  const showDiscount = product.mrp && finalPrice < product.mrp;
  const discountPercent = showDiscount
    ? Math.round(((product.mrp - finalPrice) / product.mrp) * 100)
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onAddToCart) {
      onAddToCart(product);
    } else {
      // Fallback to localStorage cart
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find((item: any) => item.id === product.id);

        if (existingItem) {
          existingItem.quantity = (existingItem.quantity || 0) + 1;
        } else {
          cart.push({
            id: product.id,
            name: product.name,
            price: finalPrice,
            weight: product.weight || 0,
            gstPercentage: product.gstPercentage || 5,
            taxInclusive: product.taxInclusive || false,
            image: displayImage
              ? `/products/${product.slug}/${displayImage}`
              : '',
            quantity: 1,
          });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(
          new CustomEvent('cart:updated', { detail: { cart } })
        );

        // Visual feedback
        const button = e.currentTarget as HTMLButtonElement;
        const originalText = button.innerHTML;
        button.textContent = 'Added!';
        button.classList.add('btn-success');

        setTimeout(() => {
          button.innerHTML = originalText;
          button.classList.remove('btn-success');
        }, 1000);
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    }
  };

  return (
    <div className="card bg-base-100">
      <a
        href={`/shop/${product.slug}`}
        className="product-link"
        title={`View ${product.name} details`}
      >
        <figure className="relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="object-cover w-full h-auto rounded-md border border-primary"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center w-full aspect-square bg-base-200">
              <div className="text-center">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-base-content/70">No image available</p>
              </div>
            </div>
          )}
          <div
            className={`badge absolute bottom-2 right-2 z-10 ${categoryClass}`}
          >
            {product.category}
          </div>
          {product.featured && (
            <div className="badge badge-warning absolute top-2 left-2 z-10">
              Featured
            </div>
          )}
        </figure>
        <div className="card-body">
          <div className="tooltip" data-tip={product.name}>
            <h2 className="card-title line-clamp-1 text-sm">{product.name}</h2>
          </div>
          <div className="mb-2">
            {showDiscount ? (
              <div className="flex flex-col">
                <span className="font-medium text-lg">
                  {formatCurrency(finalPrice)}
                </span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs opacity-60 line-through">
                    {formatCurrency(product.mrp)}
                  </span>
                  <span className="text-xs text-success">
                    {discountPercent}% off
                  </span>
                </div>
              </div>
            ) : (
              <span className="font-medium text-lg">
                {formatCurrency(finalPrice)}
              </span>
            )}
          </div>
          <p className="line-clamp-2 mb-2 text-sm">
            {product.description || 'No description available'}
          </p>
          <div className="card-actions flex justify-center items-center gap-4 w-full m-0 px-4">
            <a
              href={`/shop/${product.slug}`}
              className="btn font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 delay-150 duration-300 ease-in-out bg-transparent text-primary border border-primary hover:bg-primary hover:text-neutral-content hover:opacity-80 text-base px-4 py-2 flex-1 view-details-btn"
              title={`View details for ${product.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              View Details
            </a>
            <button
              className="btn btn-primary flex-1"
              onClick={handleAddToCart}
              aria-label="Add to cart"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </a>
    </div>
  );
}
