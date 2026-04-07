import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

const ProductCard = ({ product, onAddToWishlist }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

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
    : 10; // Default to 10 if no variants

  const isOutOfStock = totalStock <= 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (isOutOfStock) {
      toast.error('This product is currently out of stock');
      return;
    }

    let selectedVariantId = null;
    if (product.variants && product.variants.length > 0) {
      const inStockVariants = product.variants.filter(v => v.stock > 0);
      if (inStockVariants.length > 0) {
        const cheapest = inStockVariants.reduce((a, b) => a.price < b.price ? a : b);
        selectedVariantId = cheapest.variant_id;
      } else {
        toast.error('All variants are out of stock');
        return;
      }
    }

    try {
      await addToCart(product.product_id, selectedVariantId, 1);
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className="group font-inter relative" data-testid={`product-card-${product.product_id}`}>
      <Link to={`/product/${product.product_id}`} className="block">
        <div className="aspect-[3/4] overflow-hidden mb-6 bg-[#F2F2F4] relative rounded-3xl transition-transform duration-500 group-hover:scale-[0.98]">
          <img
            src={primaryImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-1000 ease-out ${secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
            data-testid="product-image"
          />
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} alternate`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-1000 ease-out group-hover:scale-105"
            />
          )}
          
          {isOutOfStock && (
            <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-[10px] uppercase tracking-widest z-10 font-bold rounded-full">
              Sold Out
            </div>
          )}

          {/* Quick Add Overlay */}
          {!isOutOfStock && (
            <button
               onClick={handleAddToCart}
               className="absolute right-4 bottom-4 w-12 h-12 bg-white text-black hover:bg-black hover:text-white transition-all duration-300 rounded-full flex items-center justify-center shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 z-20"
               title="Quick Add"
            >
               <Plus className="w-6 h-6" />
            </button>
          )}

          {/* Wishlist Button Overlay */}
          {onAddToWishlist && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToWishlist(product.product_id);
              }}
              className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 hover:bg-white text-black transition-all duration-300 rounded-full opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 z-20"
              data-testid="wishlist-button"
            >
              <Heart className="w-4 h-4" />
            </button>
          )}
        </div>
      </Link>

      <div className="space-y-1 text-left px-2">
        <div className="flex justify-between items-start gap-4">
            <Link to={`/product/${product.product_id}`}>
                <h3 className="text-base font-bold tracking-tight text-gray-900 group-hover:text-accent-color transition-colors duration-300" data-testid="product-name">
                    {product.name}
                </h3>
            </Link>
            <p className="font-bold text-sm text-gray-900 whitespace-nowrap" data-testid="product-price">
                ₹{displayPrice.toFixed(0)}
            </p>
        </div>
        <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold" data-testid="product-category">{product.category}</p>
        
        {/* Rating Placeholder as per target repo */}
        <div className="flex items-center gap-0.5 mt-2 text-black">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
            <span className="text-[10px] text-gray-400 font-bold ml-1.5">(4.9)</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;