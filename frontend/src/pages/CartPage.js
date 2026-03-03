import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateCartItem, removeFromCart, fetchCart } = useCart();
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCartDetails();
  }, [cart]);

  const loadCartDetails = async () => {
    if (!cart.items || cart.items.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const productPromises = cart.items.map(item =>
        axios.get(`${API_URL}/api/products/${item.product_id}`)
      );
      const responses = await Promise.all(productPromises);
      const productsMap = {};
      responses.forEach(response => {
        productsMap[response.data.product_id] = response.data;
      });
      setProducts(productsMap);
    } catch (error) {
      console.error('Failed to load cart details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, variantId, newQuantity) => {
    try {
      await updateCartItem(productId, variantId, newQuantity);
    } catch (error) {
      toast.error('Failed to update cart');
    }
  };

  const handleRemoveItem = async (productId, variantId) => {
    try {
      await removeFromCart(productId, variantId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const calculateTotal = () => {
    return cart.items.reduce((total, item) => {
      const product = products[item.product_id];
      if (!product) return total;

      let price = product.base_price;
      if (item.variant_id) {
        const variant = product.variants?.find(v => v.variant_id === item.variant_id);
        if (variant) price = variant.price;
      }

      return total + (price * item.quantity);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6" data-testid="empty-cart">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="font-display text-4xl mb-6">Your Cart is Empty</h1>
          <p className="text-neutral-600 mb-8">Start adding some beautiful products to your cart.</p>
          <Link to="/shop">
            <Button className="bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-all duration-300 rounded-none px-12 py-6 uppercase tracking-widest text-xs">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12" data-testid="cart-page">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-5xl md:text-6xl mb-12" data-testid="cart-title">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart.items.map((item) => {
              const product = products[item.product_id];
              if (!product) return null;

              const variant = item.variant_id
                ? product.variants?.find(v => v.variant_id === item.variant_id)
                : null;

              const price = variant?.price || product.base_price;
              const image = product.images?.[0] || 'https://images.unsplash.com/photo-1617416430402-8c131ef45227';

              return (
                <div
                  key={`${item.product_id}-${item.variant_id || 'default'}`}
                  className="flex gap-6 p-6 border border-neutral-200"
                  data-testid={`cart-item-${item.product_id}`}
                >
                  <Link to={`/product/${product.product_id}`} className="w-24 h-24 flex-shrink-0">
                    <img
                      src={image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1">
                    <Link to={`/product/${product.product_id}`}>
                      <h3 className="text-lg mb-1 hover:text-gold transition-colors" data-testid="cart-item-name">
                        {product.name}
                      </h3>
                    </Link>
                    {variant && (
                      <p className="text-sm text-neutral-600 mb-2">{variant.name}</p>
                    )}
                    <p className="text-lg font-medium" data-testid="cart-item-price">₹{price.toFixed(2)}</p>

                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                          className="w-8 h-8 border border-neutral-300 hover:border-black transition-colors flex items-center justify-center"
                          data-testid="decrease-cart-quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center" data-testid="cart-item-quantity">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                          className="w-8 h-8 border border-neutral-300 hover:border-black transition-colors flex items-center justify-center"
                          data-testid="increase-cart-quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.product_id, item.variant_id)}
                        className="ml-auto text-neutral-600 hover:text-red-600 transition-colors"
                        data-testid="remove-cart-item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="border border-neutral-200 p-8 sticky top-32" data-testid="order-summary">
              <h2 className="text-2xl font-display mb-8">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Subtotal</span>
                  <span data-testid="subtotal">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t border-neutral-200 pt-4 flex justify-between text-xl font-medium">
                  <span>Total</span>
                  <span data-testid="total">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/checkout')}
                className="w-full bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-all duration-300 rounded-none px-8 py-6 uppercase tracking-widest text-xs"
                data-testid="proceed-to-checkout"
              >
                Proceed to Checkout
              </Button>

              <Link to="/shop" className="block text-center mt-6 text-sm hover:text-gold transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;