import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from './ui/button';

const ProductCard = ({ product, onAddToWishlist }) => {
  const displayPrice = product.variants && product.variants.length > 0
    ? Math.min(...product.variants.map(v => v.price))
    : product.base_price;

  const primaryImage = product.images && product.images.length > 0
    ? product.images[0]
    : 'https://images.unsplash.com/photo-1617416430402-8c131ef45227';

  return (
    <div className="group relative" data-testid={`product-card-${product.product_id}`}>
      <Link to={`/product/${product.product_id}`}>
        <div className="aspect-[3/4] overflow-hidden mb-6 bg-neutral-100">
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            data-testid="product-image"
          />
        </div>
      </Link>

      {/* Wishlist Button */}
      {onAddToWishlist && (
        <button
          onClick={() => onAddToWishlist(product.product_id)}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-3 hover:bg-black hover:text-white transition-colors duration-300"
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