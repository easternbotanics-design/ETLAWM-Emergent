import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products?featured=true`);
      if (Array.isArray(response.data)) {
        setFeaturedProducts(response.data.slice(0, 6));
      } else {
        console.error('Invalid response format:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWishlist = async (productId) => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
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

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1762764919450-560fd6515192"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        <div className="relative z-10 text-center text-white px-6">
          <h1 className="font-display text-6xl md:text-8xl mb-8 tracking-tight" data-testid="hero-title">
            Luxury Redefined
          </h1>
          <p className="text-base md:text-lg mb-12 tracking-wide max-w-2xl mx-auto" data-testid="hero-subtitle">
            Discover premium beauty and cosmetics crafted for the modern individual
          </p>
          <Link to="/shop">
            <Button
              className="bg-white text-black hover:bg-black hover:text-white hover:border-white border border-transparent transition-all duration-300 rounded-none px-12 py-6 uppercase tracking-widest text-xs"
              data-testid="shop-now-button"
            >
              Shop Now
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 md:py-32 px-6 md:px-12 max-w-7xl mx-auto" data-testid="featured-section">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl mb-4" data-testid="featured-title">
            Featured Collection
          </h2>
          <p className="text-sm uppercase tracking-widest text-neutral-600">
            Curated for you
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12" data-testid="featured-products-grid">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                onAddToWishlist={handleAddToWishlist}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-16">
          <Link to="/shop">
            <Button
              className="bg-transparent text-black border border-black hover:bg-black hover:text-white transition-all duration-300 rounded-none px-12 py-6 uppercase tracking-widest text-xs"
              data-testid="view-all-button"
            >
              View All Products
            </Button>
          </Link>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-24 md:py-32 bg-neutral-50" data-testid="brand-story-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1762522903557-891c8dc11f4b"
                alt="Brand Story"
                className="w-full h-[600px] object-cover"
              />
            </div>
            <div className="space-y-8">
              <h2 className="font-display text-4xl md:text-5xl">
                Our Philosophy
              </h2>
              <p className="text-base leading-relaxed text-neutral-700">
                ETLAWM represents the intersection of luxury and authenticity. Every product
                is carefully crafted to enhance your natural beauty while respecting the
                environment and your skin.
              </p>
              <p className="text-base leading-relaxed text-neutral-700">
                We believe in transparency, quality, and the power of nature combined with
                science to create transformative beauty experiences.
              </p>
              <Link to="/shop">
                <Button
                  className="bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-all duration-300 rounded-none px-8 py-4 uppercase tracking-widest text-xs"
                >
                  Explore Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;