import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Heart, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState({ product_ids: [] });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wishlist`, {
        withCredentials: true
      });
      setWishlist(response.data);

      if (response.data.product_ids.length > 0) {
        const productPromises = response.data.product_ids.map(id =>
          axios.get(`${API_URL}/api/products/${id}`)
        );
        const productResponses = await Promise.all(productPromises);
        setProducts(productResponses.map(r => r.data));
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await axios.delete(`${API_URL}/api/wishlist/${productId}`, {
        withCredentials: true
      });
      setProducts(products.filter(p => p.product_id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12" data-testid="wishlist-page">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-5xl md:text-6xl mb-12" data-testid="wishlist-title">My Wishlist</h1>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto mb-6 text-neutral-400" />
            <p className="text-neutral-600 mb-8">Your wishlist is empty.</p>
            <Link to="/shop">
              <Button className="bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-all duration-300 rounded-none px-12 py-6 uppercase tracking-widest text-xs">
                Discover Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
            {products.map((product) => {
              const displayPrice = product.variants && product.variants.length > 0
                ? Math.min(...product.variants.map(v => v.price))
                : product.base_price;

              const primaryImage = product.images && product.images.length > 0
                ? product.images[0]
                : 'https://images.unsplash.com/photo-1617416430402-8c131ef45227';

              return (
                <div key={product.product_id} className="group relative" data-testid={`wishlist-item-${product.product_id}`}>
                  <Link to={`/product/${product.product_id}`}>
                    <div className="aspect-[3/4] overflow-hidden mb-6 bg-neutral-100">
                      <img
                        src={primaryImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </Link>

                  <button
                    onClick={() => handleRemove(product.product_id)}
                    className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-3 hover:bg-red-600 hover:text-white transition-colors duration-300"
                    data-testid="remove-wishlist-item"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="space-y-2">
                    <Link to={`/product/${product.product_id}`}>
                      <h3 className="font-body text-lg group-hover:text-gold transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-neutral-600">{product.category}</p>
                    <p className="font-body text-lg">₹{displayPrice.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
