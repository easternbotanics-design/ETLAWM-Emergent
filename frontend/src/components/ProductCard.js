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

  const secondaryImage = product.images && product.images.length > 1
    ? product.images[1]
    : null;

  const totalStock = product.variants && product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : 0;

  const isOutOfStock = totalStock <= 0 && product.variants && product.variants.length > 0;

  return (
    <div className="group animate-fade-in" data-testid={`product-card-${product.product_id}`}>
      <Link to={`/product/${product.product_id}`}>
        <div className="aspect-[4/5] overflow-hidden mb-8 bg-secondary/20 relative rounded-px">
          <img
            src={primaryImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-1000 ease-out grayscale-[0.1] ${secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-105 group-hover:grayscale-0'}`}
            data-testid="product-image"
          />
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} alternate`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-1000 ease-out group-hover:scale-105 grayscale-[0.1] group-hover:grayscale-0"
            />
          )}
          
          {isOutOfStock && (
            <div className="absolute top-6 left-6 bg-primary/90 text-primary-foreground px-4 py-1.5 text-[9px] uppercase tracking-[0.2em] z-10 font-bold backdrop-blur-sm">
              Sold Out
            </div>
          )}

          {/* Quick Add Overlay (Optional, but keeping it clean) */}
          <div className="absolute inset-x-6 bottom-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20">
             <Button className="w-full bg-background/95 backdrop-blur-md text-primary hover:bg-primary hover:text-primary-foreground text-[9px] uppercase tracking-[0.2em] font-bold py-4 rounded-px border-none shadow-sm">
                Quick View
             </Button>
          </div>
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
          className="absolute top-6 right-6 bg-background/60 backdrop-blur-sm p-2.5 hover:bg-primary hover:text-primary-foreground transition-all duration-500 z-10 rounded-full opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
          data-testid="wishlist-button"
        >
          <Heart className="w-4 h-4 stroke-[1.5px]" />
        </button>
      )}

      <div className="space-y-3 px-1 text-center">
        <Link to={`/product/${product.product_id}`}>
          <h3 className="font-display text-[15px] tracking-tight text-primary/90 group-hover:text-accent transition-colors duration-300 font-medium" data-testid="product-name">
            {product.name}
          </h3>
        </Link>
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent/70 font-bold" data-testid="product-category">{product.category}</p>
        <p className="font-body text-[14px] text-primary/70" data-testid="product-price">
          ₹{displayPrice.toFixed(0)}
          {product.variants && product.variants.length > 1 && (
            <span className="text-[11px] text-primary/40 ml-1.5 align-middle">from</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;