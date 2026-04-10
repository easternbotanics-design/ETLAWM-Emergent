import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  ChevronRight, 
  Plus, 
  Minus,
  Check
} from 'lucide-react';
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
import { gsap } from 'gsap';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  
  const pageRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProduct();
    fetchReviews();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/products/${productId}`);
      setProduct(response.data);
      if (response.data.variants && response.data.variants.length > 0) {
        const stockedVariant = response.data.variants.find(v => v.stock > 0) || response.data.variants[0];
        setSelectedVariantId(stockedVariant.variant_id);
      }
      
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
      setAddingToCart(true);
      // Extra validation: ensure we have variantId if it exists
      const effectiveVariantId = selectedVariantId || (product.variants?.[0]?.variant_id);
      
      await addToCart(productId, effectiveVariantId, quantity);
      toast.success('Successfully added to your ritual', {
        icon: <Check className="w-4 h-4 text-green-500" />
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to add to cart';
      toast.error(errorMsg);
    } finally {
      setAddingToCart(false);
    }
  };

  const getAuthConfig = (extra = {}) => {
    const config = { withCredentials: true, ...extra };
    const storedToken = localStorage.getItem('etlawm_session_token');
    if (storedToken) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${storedToken}`,
      };
    }
    return config;
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Log in to save to wishlist');
      navigate('/login');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/wishlist/${productId}`,
        {},
        getAuthConfig()
      );
      toast.success('Saved to wishlist');
    } catch (error) {
      toast.error('Could not save to wishlist');
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
        getAuthConfig()
      );
      toast.success('Review shared! Thank you.');
      setReviewText('');
      setRating(5);
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-white">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) return null;

  const selectedVariantData = product.variants?.find(v => v.variant_id === selectedVariantId);
  const displayPrice = selectedVariantData?.price || product.base_price;
  const isOutOfStock = selectedVariantData && selectedVariantData.stock <= 0;
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div ref={pageRef} className="min-h-screen bg-white pt-24 font-inter">
      {/* Breadcrumbs */}
      <div className="container py-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gray-400 font-bold">
           <Link to="/" className="hover:text-black transition-colors">Home</Link>
           <ChevronRight className="w-3 h-3" />
           <Link to="/shop" className="hover:text-black transition-colors">Shop</Link>
           <ChevronRight className="w-3 h-3" />
           <span className="text-black">{product.name}</span>
        </div>
      </div>

      <section className="container pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* LEFT: Image Gallery */}
          <div className="lg:col-span-7 space-y-6">
            <div className="aspect-[3/4] overflow-hidden bg-[#F5F5F7] rounded-3xl group relative">
               <img
                src={
                  (product.name?.toLowerCase().includes('oil') && (product.name?.toLowerCase().includes('herbal') || product.name?.toLowerCase().includes('hair'))) ||
                  (product.images?.[mainImageIndex]?.includes('Gemini_Generated_Image'))
                  ? '/assets/etlawm-hair-oil.png' 
                  : (product.images?.[mainImageIndex] || '/assets/etlawm-hair-oil.png')
                }
                alt={product.name}
                className="w-full h-full object-cover"
               />
               {isOutOfStock && (
                 <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center">
                    <span className="bg-black text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest">Out of Stock</span>
                 </div>
               )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setMainImageIndex(idx)}
                    className={`aspect-square overflow-hidden bg-[#F5F5F7] rounded-xl border-2 transition-all ${mainImageIndex === idx ? 'border-black opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Details */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-black text-white text-[9px] font-bold uppercase tracking-widest rounded-full">{product.category}</span>
                <div className="flex items-center gap-1 text-black font-bold text-xs ml-2">
                   <Star className="w-3.5 h-3.5 fill-current" />
                   <span>{averageRating}</span>
                   <span className="text-gray-400">({reviews.length} reviews)</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
                {product.name}
              </h1>
              <p className="text-3xl font-bold text-gray-900">₹{displayPrice.toFixed(0)}</p>
            </div>

            <p className="text-gray-500 text-lg leading-relaxed">
              {product.description}
            </p>

            {/* Selection Grid */}
            <div className="space-y-8 pt-4">
               {product.variants && product.variants.length > 0 && (
                <div className="space-y-4">
                  <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400">Select Size</label>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((v) => (
                      <button
                        key={v.variant_id}
                        onClick={() => setSelectedVariantId(v.variant_id)}
                        className={`px-6 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                          selectedVariantId === v.variant_id 
                          ? 'border-black bg-black text-white' 
                          : 'border-gray-100 bg-[#F5F5F7] text-gray-500 hover:border-gray-200'
                        }`}
                        disabled={v.stock <= 0}
                      >
                        {v.name}
                        {v.stock <= 0 && <span className="ml-2 opacity-50 italic">(Sold Out)</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-end gap-6">
                <div className="space-y-4">
                    <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400">Quantity</label>
                    <div className="flex items-center bg-[#F5F5F7] rounded-2xl p-1 w-fit">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-bold text-sm tracking-widest">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingToCart}
                className={`h-16 flex-1 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${isOutOfStock ? 'bg-gray-100 text-gray-400' : 'bg-black text-white hover:bg-black/90 shadow-2xl shadow-black/10 hover:-translate-y-0.5 active:translate-y-0'}`}
              >
                {addingToCart ? 'Adding to your ritual...' : isOutOfStock ? 'Currently Unavailable' : 'Add to Cart'}
              </Button>
              <Button
                onClick={handleAddToWishlist}
                className="h-16 w-16 rounded-2xl border-2 border-gray-100 bg-white text-black hover:border-black transition-all flex items-center justify-center p-0"
              >
                <Heart className="w-6 h-6" />
              </Button>
            </div>

            {/* Benefits Minimal list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10 border-t border-gray-50">
               <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span>Dermatologically Tested</span>
               </div>
               <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                  <Truck className="w-5 h-5 text-gray-400" />
                  <span>Free Express Shipping</span>
               </div>
               <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                  <RotateCcw className="w-5 h-5 text-gray-400" />
                  <span>7 Day Easy Ritual Returns</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section - Modern Overhaul */}
      <section className="bg-[#F9F9FB] py-24">
        <div className="container max-w-4xl">
           <div className="flex items-center justify-between mb-16">
              <div>
                <h2 className="text-4xl font-bold tracking-tight mb-2">Experiences</h2>
                <div className="flex items-center gap-3">
                   <div className="flex text-black">
                      {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.floor(averageRating) ? 'fill-current' : 'text-gray-200'}`} />)}
                   </div>
                   <span className="text-sm font-bold">{averageRating} based on {reviews.length} reviews</span>
                </div>
              </div>
              {user && (
                <button className="text-sm font-bold underline underline-offset-8 decoration-gray-200 hover:decoration-black transition-colors">Write your experience</button>
              )}
           </div>

           {user && (
            <div className="mb-20 bg-white p-10 rounded-[32px] shadow-sm">
                <form onSubmit={handleSubmitReview} className="space-y-8">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Your Ritual Rating</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="hover:scale-110 transition-transform"
                        >
                          <Star className={`w-8 h-8 rounded-full ${star <= rating ? 'fill-black text-black' : 'text-gray-100'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      required
                      placeholder="How has this transformed your daily ritual?"
                      className="w-full border-none bg-gray-100 rounded-2xl p-6 h-32 focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>
                  <Button
                    type="submit"
                    loading={submittingReview}
                    className="bg-black text-white rounded-full px-10 py-6 text-[10px] font-bold uppercase tracking-widest"
                  >
                    Share Ritual
                  </Button>
                </form>
            </div>
          )}

          <div className="space-y-12">
            {reviews.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-bold italic underline decoration-gray-100">Be the first to share your experience</div>
            ) : (
              reviews.map((review) => (
                <div key={review.review_id} className="bg-white p-8 rounded-[24px] border border-gray-50 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{review.user_name}</p>
                      <div className="flex text-black gap-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-gray-100'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                      {new Date(review.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                    </span>
                  </div>
                  <p className="text-gray-600 leading-relaxed font-medium">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="container py-32 bg-white">
          <div className="flex justify-between items-end mb-16">
             <h2 className="text-4xl font-bold tracking-tight">Complete the Ritual</h2>
             <Link to="/shop" className="text-sm font-bold underline underline-offset-8 decoration-gray-200 hover:decoration-black transition-colors">See all rituals</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendations.map((rec) => {
              const recPrice = rec.variants && rec.variants.length > 0
                ? Math.min(...rec.variants.map(v => v.price))
                : rec.base_price;
              const recImage = rec.images?.[0] || 'https://images.unsplash.com/photo-1617416430402-8c131ef45227';

              return (
                <Link key={rec.product_id} to={`/product/${rec.product_id}`} className="group space-y-4">
                  <div className="aspect-[3/4] overflow-hidden bg-[#F5F5F7] rounded-3xl transition-transform duration-500 group-hover:scale-[0.98]">
                    <img
                      src={recImage}
                      alt={rec.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 group-hover:text-accent-color transition-colors">{rec.name}</h3>
                        <p className="font-bold text-sm">₹{recPrice.toFixed(0)}</p>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rec.category}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
