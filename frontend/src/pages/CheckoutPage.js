import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(false);

  const [shippingData, setShippingData] = useState({
    name: user?.name || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });

  useEffect(() => {
    if (!cart.items || cart.items.length === 0) {
      navigate('/cart');
      return;
    }
    loadCartDetails();
    loadRazorpayScript();
  }, [cart]);

  const loadCartDetails = async () => {
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
      console.error('Failed to load products:', error);
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

  const prepareOrderItems = () => {
    return cart.items.map(item => {
      const product = products[item.product_id];
      const variant = item.variant_id
        ? product.variants?.find(v => v.variant_id === item.variant_id)
        : null;

      return {
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        product_name: product.name,
        variant_name: variant?.name || null,
        price: variant?.price || product.base_price,
        quantity: item.quantity
      };
    });
  };

  const handleInputChange = (e) => {
    setShippingData({
      ...shippingData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!shippingData.name || !shippingData.address || !shippingData.city ||
        !shippingData.state || !shippingData.pincode || !shippingData.phone) {
      toast.error('Please fill all shipping details');
      return;
    }

    setLoading(true);

    try {
      const total = calculateTotal();
      const orderItems = prepareOrderItems();

      // Create order
      const orderResponse = await axios.post(
        `${API_URL}/api/orders/create`,
        {
          items: orderItems,
          total_amount: total,
          shipping_address: shippingData
        },
        { withCredentials: true }
      );

      const { order, razorpay_order } = orderResponse.data;

      // Initialize Razorpay payment
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || '',
        amount: razorpay_order.amount,
        currency: 'INR',
        order_id: razorpay_order.id,
        name: 'ETLAWM',
        description: 'Beauty & Cosmetics',
        handler: async function (response) {
          try {
            // Verify payment
            await axios.post(
              `${API_URL}/api/orders/${order.order_id}/verify`,
              {
                payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              { withCredentials: true }
            );

            toast.success('Payment successful!');
            await fetchCart();
            navigate(`/orders/${order.order_id}`);
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: shippingData.name,
          contact: shippingData.phone
        },
        theme: {
          color: '#000000'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', function () {
        toast.error('Payment failed. Please try again.');
      });

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  return (
    <div className=\"min-h-screen pt-32 pb-24 px-6 md:px-12\" data-testid=\"checkout-page\">
      <div className=\"max-w-6xl mx-auto\">
        <h1 className=\"font-display text-5xl md:text-6xl mb-12\" data-testid=\"checkout-title\">Checkout</h1>

        <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-12\">
          {/* Shipping Form */}
          <div className=\"lg:col-span-2\">
            <form onSubmit={handleSubmit} className=\"space-y-6\">
              <h2 className=\"text-2xl font-display mb-6\">Shipping Information</h2>

              <div>
                <Label htmlFor=\"name\" className=\"text-xs uppercase tracking-widest mb-2 block\">
                  Full Name
                </Label>
                <Input
                  id=\"name\"
                  name=\"name\"
                  value={shippingData.name}
                  onChange={handleInputChange}
                  required
                  className=\"border border-neutral-300 rounded-none p-4\"
                  data-testid=\"shipping-name\"
                />
              </div>

              <div>
                <Label htmlFor=\"phone\" className=\"text-xs uppercase tracking-widest mb-2 block\">
                  Phone Number
                </Label>
                <Input
                  id=\"phone\"
                  name=\"phone\"
                  type=\"tel\"
                  value={shippingData.phone}
                  onChange={handleInputChange}
                  required
                  className=\"border border-neutral-300 rounded-none p-4\"
                  data-testid=\"shipping-phone\"
                />
              </div>

              <div>
                <Label htmlFor=\"address\" className=\"text-xs uppercase tracking-widest mb-2 block\">
                  Address
                </Label>
                <Input
                  id=\"address\"
                  name=\"address\"
                  value={shippingData.address}
                  onChange={handleInputChange}
                  required
                  className=\"border border-neutral-300 rounded-none p-4\"
                  data-testid=\"shipping-address\"
                />
              </div>

              <div className=\"grid grid-cols-2 gap-6\">
                <div>
                  <Label htmlFor=\"city\" className=\"text-xs uppercase tracking-widest mb-2 block\">
                    City
                  </Label>
                  <Input
                    id=\"city\"
                    name=\"city\"
                    value={shippingData.city}
                    onChange={handleInputChange}
                    required
                    className=\"border border-neutral-300 rounded-none p-4\"
                    data-testid=\"shipping-city\"
                  />
                </div>

                <div>
                  <Label htmlFor=\"state\" className=\"text-xs uppercase tracking-widest mb-2 block\">
                    State
                  </Label>
                  <Input
                    id=\"state\"
                    name=\"state\"
                    value={shippingData.state}
                    onChange={handleInputChange}
                    required
                    className=\"border border-neutral-300 rounded-none p-4\"
                    data-testid=\"shipping-state\"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor=\"pincode\" className=\"text-xs uppercase tracking-widest mb-2 block\">
                  Pincode
                </Label>
                <Input
                  id=\"pincode\"
                  name=\"pincode\"
                  value={shippingData.pincode}
                  onChange={handleInputChange}
                  required
                  className=\"border border-neutral-300 rounded-none p-4\"
                  data-testid=\"shipping-pincode\"
                />
              </div>

              <Button
                type=\"submit\"
                disabled={loading}
                className=\"w-full bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-all duration-300 rounded-none px-8 py-6 uppercase tracking-widest text-xs\"
                data-testid=\"place-order-button\"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className=\"lg:col-span-1\">
            <div className=\"border border-neutral-200 p-8 sticky top-32\">
              <h2 className=\"text-2xl font-display mb-6\">Order Summary</h2>

              <div className=\"space-y-4 mb-6\">
                {cart.items.map((item) => {
                  const product = products[item.product_id];
                  if (!product) return null;

                  const variant = item.variant_id
                    ? product.variants?.find(v => v.variant_id === item.variant_id)
                    : null;

                  const price = variant?.price || product.base_price;

                  return (
                    <div key={`${item.product_id}-${item.variant_id || 'default'}`} className=\"flex justify-between text-sm\">
                      <span className=\"text-neutral-600\">
                        {product.name} {variant ? `(${variant.name})` : ''} x {item.quantity}
                      </span>
                      <span>₹{(price * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className=\"border-t border-neutral-200 pt-4 space-y-2\">
                <div className=\"flex justify-between\">
                  <span className=\"text-neutral-600\">Subtotal</span>
                  <span data-testid=\"checkout-subtotal\">₹{total.toFixed(2)}</span>
                </div>
                <div className=\"flex justify-between\">
                  <span className=\"text-neutral-600\">Shipping</span>
                  <span className=\"text-green-600\">Free</span>
                </div>
                <div className=\"border-t border-neutral-200 pt-4 flex justify-between text-xl font-medium\">
                  <span>Total</span>
                  <span data-testid=\"checkout-total\">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
