import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Plus, Star, Eye } from 'lucide-react';
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

  const pName = product.name?.toLowerCase() || '';
  const isHairOil = pName.includes('oil') && (pName.includes('herbal') || pName.includes('hair') || pName.includes('nourishing') || pName.includes('etlawm'));
  
  const hasGeminiImage = product.images?.[0]?.includes('Gemini_Generated_Image');

  const primaryImage = (isHairOil || hasGeminiImage)
    ? '/assets/etlawm-hair-oil.png'
    : (product.images && product.images.length > 0 ? product.images[0] : '/assets/etlawm-hair-oil.png');

  const secondaryImage = product.images && product.images.length > 1
    ? product.images[1]
    : null;

  const totalStock = product.variants && product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : 10;

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
    <div
      className="group relative"
      data-testid={`product-card-${product.product_id}`}
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      {/* Image container */}
      <Link to={`/product/${product.product_id}`} className="block">
        <div
          className="relative overflow-hidden mb-5"
          style={{
            aspectRatio: '3/4',
            borderRadius: '24px',
            background: '#F2F2F0',
            transition: 'border-radius 0.5s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Primary image */}
          <img
            src={primaryImage}
            alt={product.name}
            className={`w-full h-full object-contain transition-all duration-700 ease-out ${
              secondaryImage
                ? 'group-hover:opacity-0'
                : 'group-hover:scale-[1.04]'
            }`}
            style={{ 
              mixBlendMode: 'multiply',
              padding: '1.5rem'
            }}
            data-testid="product-image"
          />

          {/* Secondary image (swap on hover) */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} alternate`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out group-hover:scale-[1.04]"
            />
          )}

          {/* Sold Out badge */}
          {isOutOfStock && (
            <div className="absolute top-3 left-3 bg-black text-white px-3 py-1.5 text-[9px] uppercase tracking-widest z-10 font-bold rounded-full shadow-md">
              Sold Out
            </div>
          )}

          {/* Hover overlay — action buttons */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 50%)' }}
          />

          {/* Quick Add button */}
          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400 ease-out z-20 flex items-center gap-2 bg-white text-black text-[11px] font-bold uppercase tracking-widest px-5 py-3 rounded-full shadow-xl hover:bg-black hover:text-white whitespace-nowrap"
              title="Quick Add to Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Quick Add
            </button>
          )}

          {/* Top-right floating buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-20 translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-400 ease-out">
            {/* Wishlist */}
            {onAddToWishlist && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToWishlist(product.product_id);
                }}
                className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-110 transition-all duration-200"
                data-testid="wishlist-button"
                title="Add to Wishlist"
              >
                <Heart className="w-4 h-4" />
              </button>
            )}
            {/* Quick view */}
            <Link
              to={`/product/${product.product_id}`}
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-110 transition-all duration-200"
              title="View Product"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Link>

      {/* Product info */}
      <div className="px-1 space-y-2">
        {/* Category */}
        <p
          className="text-[10px] uppercase tracking-[0.15em] font-bold"
          style={{ color: '#C8A97A' }}
          data-testid="product-category"
        >
          {product.category}
        </p>

        {/* Name + Price row */}
        <div className="flex justify-between items-start gap-3">
          <Link to={`/product/${product.product_id}`}>
            <h3
              className="text-sm font-bold tracking-tight text-gray-900 hover:text-gray-600 transition-colors duration-200 leading-snug"
              data-testid="product-name"
            >
              {product.name}
            </h3>
          </Link>
          <p className="font-bold text-sm text-gray-900 whitespace-nowrap" data-testid="product-price">
            ₹{displayPrice?.toFixed(0)}
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="w-3 h-3 fill-current text-black" />
            ))}
          </div>
          <span className="text-[10px] text-gray-400 font-bold">(4.9)</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;