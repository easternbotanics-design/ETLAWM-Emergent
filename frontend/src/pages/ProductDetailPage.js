import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products/${productId}`);
      setProduct(response.data);
      if (response.data.variants && response.data.variants.length > 0) {
        // Find first variant with stock, or default to first
        const stockedVariant = response.data.variants.find(v => v.stock > 0) || response.data.variants[0];
        setSelectedVariant(stockedVariant.variant_id);
      }
      
      // Fetch recommendations (same category products)
      const recsResponse = await axios.get(`${API_URL}/api/products?category=${response.data.category}`);
      const filtered = recsResponse.data.filter(p => p.product_id !== productId).slice(0, 4);
      setRecommendations(filtered);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reviews/${productId}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      await addToCart(productId, selectedVariant, quantity);
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
      navigate('/login');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/wishlist/${productId}`,
        {},
        { withCredentials: true }
      );
      toast.success('Added to wishlist');
    } catch (error) {
      toast.error('Failed to add to wishlist');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    try {
      setSubmittingReview(true);
      await axios.post(
        `${API_URL}/api/reviews`,
        {
          product_id: productId,
          rating,
          comment: reviewText
        },
        { withCredentials: true }
      );
      toast.success('Review submitted');
      setReviewText('');
      setRating(5);
      fetchReviews();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to submit review';
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const selectedVariantData = product.variants?.find(v => v.variant_id === selectedVariant);
  const displayPrice = selectedVariantData?.price || product.base_price;
  const isOutOfStock = selectedVariantData && selectedVariantData.stock <= 0;
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen pt-32 pb-24" data-testid="product-detail-page">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          {/* Product Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] overflow-hidden bg-neutral-100 relative">
              <img
                src={product.images?.[mainImageIndex] || 'https://images.unsplash.com/photo-1617416430402-8c131ef45227'}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-300"
                data-testid="product-detail-image"
              />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="bg-black text-white px-6 py-2 text-xs uppercase tracking-[0.2em]">Out of Stock</span>
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setMainImageIndex(idx)}
                    className={`aspect-square overflow-hidden bg-neutral-100 border-b-2 transition-all ${mainImageIndex === idx ? 'border-gold opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2" data-testid="product-category">
                {product.category}
              </p>
              <h1 className="font-display text-4xl md:text-5xl mb-4" data-testid="product-name">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(averageRating) ? 'fill-gold text-gold' : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-neutral-600">
                  {averageRating} ({reviews.length} reviews)
                </span>
              </div>
              <p className="text-3xl font-body mb-6" data-testid="product-price">₹{displayPrice.toFixed(2)}</p>
            </div>

            <p className="text-base leading-relaxed text-neutral-700" data-testid="product-description">
              {product.description}
            </p>

            {/* Variant Selection */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <label className="text-xs uppercase tracking-widest mb-3 block">Select Size</label>
                <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                  <SelectTrigger className="w-full border border-neutral-300 rounded-none p-4" data-testid="variant-selector">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {product.variants.map((variant) => (
                      <SelectItem key={variant.variant_id} value={variant.variant_id}>
                        {variant.name} - ₹{variant.price} ({variant.stock} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="text-xs uppercase tracking-widest mb-3 block">Quantity</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 border border-neutral-300 hover:border-black transition-colors flex items-center justify-center"
                  data-testid="decrease-quantity"
                >
                  -
                </button>
                <span className="text-lg w-12 text-center" data-testid="quantity-display">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 border border-neutral-300 hover:border-black transition-colors flex items-center justify-center"
                  data-testid="increase-quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 ${isOutOfStock ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' : 'bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent'} transition-all duration-300 rounded-none px-8 py-6 uppercase tracking-widest text-xs`}
                data-testid="add-to-cart-button"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button
                onClick={handleAddToWishlist}
                className="bg-transparent text-black border border-black hover:bg-black hover:text-white transition-all duration-300 rounded-none px-6 py-6"
                data-testid="add-to-wishlist-button"
              >
                <Heart className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-neutral-200 pt-16" data-testid="reviews-section">
          <h2 className="font-display text-3xl mb-8">Customer Reviews</h2>

          {/* Submit Review */}
          {user && (
            <form onSubmit={handleSubmitReview} className="mb-12 p-8 border border-neutral-200">
              <h3 className="text-xl mb-6">Write a Review</h3>
              <div className="mb-4">
                <label className="text-xs uppercase tracking-widest mb-3 block">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="hover:scale-110 transition-transform"
                      data-testid={`rating-star-${star}`}
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating ? 'fill-gold text-gold' : 'text-neutral-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs uppercase tracking-widest mb-3 block">Your Review</label>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                  rows={4}
                  className="w-full border border-neutral-300 p-4 rounded-none"
                  placeholder="Share your experience with this product..."
                  data-testid="review-textarea"
                />
              </div>
              <Button
                type="submit"
                disabled={submittingReview}
                className="bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-all duration-300 rounded-none px-8 py-4 uppercase tracking-widest text-xs"
                data-testid="submit-review-button"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-8">
            {reviews.length === 0 ? (
              <p className="text-neutral-600 text-center py-8">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.review_id} className="border-b border-neutral-200 pb-8" data-testid={`review-${review.review_id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-medium mb-1">{review.user_name}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'fill-gold text-gold' : 'text-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-neutral-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-neutral-700">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* You May Also Like */}
      {recommendations.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-24">
          <h2 className="font-display text-3xl mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendations.map((rec) => {
              const displayPrice = rec.variants && rec.variants.length > 0
                ? Math.min(...rec.variants.map(v => v.price))
                : rec.base_price;
              const primaryImage = rec.images?.[0] || 'https://images.unsplash.com/photo-1617416430402-8c131ef45227';

              return (
                <Link key={rec.product_id} to={`/product/${rec.product_id}`} className="group">
                  <div className="aspect-[3/4] overflow-hidden mb-4 bg-neutral-100">
                    <img
                      src={primaryImage}
                      alt={rec.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <h3 className="font-body text-lg mb-1 group-hover:text-gold transition-colors">
                    {rec.name}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-2">{rec.category}</p>
                  <p className="font-body text-lg">Rs.{displayPrice.toFixed(2)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
