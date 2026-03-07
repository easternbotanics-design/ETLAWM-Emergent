import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from './ui/button';

const ProductCard = ({ product, onAddToWishlist }) => {
  const displayPrice = product.variants && product.variants.length > 0
    ? Math.min(...product.variants.map(v => v.price))
    : product.base_price;

  const secondaryImage = product.images && product.images.length > 1
    ? product.images[1]
    : null;

  const totalStock = product.variants && product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : 0;

  const isOutOfStock = totalStock <= 0 && product.variants && product.variants.length > 0;

  return (
    <div className="group relative" data-testid={`product-card-${product.product_id}`}>
      <Link to={`/product/${product.product_id}`}>
        <div className="aspect-[3/4] overflow-hidden mb-6 bg-neutral-100 relative">
          <img
            src={primaryImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-700 ${secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
            data-testid="product-image"
          />
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} alternate`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
            />
          )}
          
          {isOutOfStock && (
            <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-[10px] uppercase tracking-widest z-10">
              Out of Stock
            </div>
          )}
        </div>
      </Link>

      {/* Wishlist Button */}
      {onAddToWishlist && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToWishlist(product.product_id);
          }}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-3 hover:bg-black hover:text-white transition-colors duration-300 z-10"
          data-testid="wishlist-button"
        >
          <Heart className="w-5 h-5" />
        </button>
      )}

      <div className="space-y-2">
        <Link to={`/product/${product.product_id}`}>
          <h3 className="font-body text-lg group-hover:text-gold transition-colors" data-testid="product-name">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-neutral-600" data-testid="product-category">{product.category}</p>
        <p className="font-body text-lg" data-testid="product-price">
          ₹{displayPrice.toFixed(2)}
          {product.variants && product.variants.length > 1 && (
            <span className="text-sm text-neutral-500 ml-2">onwards</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;