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
    <div className="min-h-screen bg-botanical-light" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1608248597279-f99d160bfcbc"
            alt="Botanical Hero"
            className="w-full h-full object-cover scale-105 animate-fade-in"
          />
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        <div className="relative z-10 text-center text-primary px-6 animate-slide-up">
          <span className="text-[10px] uppercase tracking-[0.4em] mb-6 block font-semibold text-primary/60">The New Standard of Care</span>
          <h1 className="font-display text-5xl md:text-8xl mb-10 tracking-tighter" data-testid="hero-title">
            Herbal Rituals
          </h1>
          <p className="text-[15px] md:text-[17px] mb-14 tracking-tight max-w-xl mx-auto font-light leading-relaxed opacity-80" data-testid="hero-subtitle">
            Minimalist herbal oils and potent face serums crafted from nature's most effective botanicals. Pure, honest, and transformative.
          </p>
          <Link to="/shop">
            <Button
              className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-500 rounded-px px-14 py-7 uppercase tracking-[0.2em] text-[10px] font-semibold border-none"
              data-testid="shop-now-button"
            >
              Explore Collection
              <ArrowRight className="ml-3 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-32 md:py-48 px-6 md:px-12 max-w-7xl mx-auto" data-testid="featured-section">
        <div className="text-center mb-24">
          <span className="text-[10px] uppercase tracking-[0.3em] text-accent/80 font-bold mb-4 block">Essentials</span>
          <h2 className="font-display text-4xl md:text-5xl tracking-tighter" data-testid="featured-title">
             The Botanical Edit
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24" data-testid="featured-products-grid">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                onAddToWishlist={handleAddToWishlist}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-24">
          <Link to="/shop">
            <Button
              variant="outline"
              className="border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-500 rounded-px px-14 py-7 uppercase tracking-[0.2em] text-[10px] font-semibold"
              data-testid="view-all-button"
            >
              View Full Apothecary
            </Button>
          </Link>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-32 md:py-48 bg-secondary/30" data-testid="brand-story-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative group">
              <img
                src="https://images.unsplash.com/photo-1556228720-195a672e8a03"
                alt="Herbal Process"
                className="w-full h-[650px] object-cover grayscale-[0.2] transition-all duration-700 group-hover:grayscale-0"
              />
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-botanical-sage/20 -z-10 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-700"></div>
            </div>
            <div className="space-y-10">
              <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold">Our Philosophy</span>
              <h2 className="font-display text-4xl md:text-6xl tracking-tighter leading-[1.1]">
                Less is more, <br/> pure is better.
              </h2>
              <div className="space-y-6 text-[15px] leading-relaxed text-primary/80 font-light">
                <p>
                  ETLAWM was born from a desire to return to the essentials. In a world of complex ingredients, we find power in simplicity. Our herbal oils and serums are formulated with singular focus: to nourish without compromise.
                </p>
                <p>
                  Every drop of our ETLAWM Herbal Oil is infused with centuries of botanical wisdom, refined for the modern minimalist lifestyle. No fillers, no synthetic fragrances—just pure, potent nature.
                </p>
              </div>
              <Link to="/shop">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-500 rounded-px px-10 py-6 uppercase tracking-[0.2em] text-[10px] font-semibold"
                >
                  Our Origins
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