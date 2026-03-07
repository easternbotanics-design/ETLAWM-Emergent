import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Mail, Phone, MapPin, CreditCard, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/orders/${orderId}`, {
        withCredentials: true
      });
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Failed to load order details');
      if (error.response?.status === 404) {
        navigate('/admin/orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await axios.put(
        `${API_URL}/api/admin/orders/${orderId}/status`,
        null,
        {
          params: { status: newStatus },
          withCredentials: true
        }
      );
      toast.success('Order status updated');
      fetchOrder();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      shipped: 'bg-purple-100 text-purple-800 border-purple-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-neutral-100 text-neutral-800 border-neutral-300';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      shipped: Truck,
      delivered: Package,
      cancelled: XCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <p className="text-neutral-600">Order not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display text-4xl mb-1">Order {order.order_id}</h1>
              <p className="text-neutral-600">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 border ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="text-sm font-medium capitalize">{order.status}</span>
              </div>
              <Select value={order.status} onValueChange={handleStatusUpdate}>
                <SelectTrigger className="w-[180px] border border-neutral-300 rounded-none">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <div className="border border-neutral-200 p-6">
              <h2 className="text-xs uppercase tracking-widest mb-6 font-medium">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 border-b border-neutral-100 last:border-0">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      {item.variant_name && (
                        <p className="text-sm text-neutral-500">Variant: {item.variant_name}</p>
                      )}
                      <p className="text-sm text-neutral-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-neutral-500">₹{item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-200 pt-4 mt-4 flex justify-between items-center">
                <span className="text-lg font-medium">Total</span>
                <span className="text-2xl font-bold">₹{order.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="border border-neutral-200 p-6">
              <h2 className="text-xs uppercase tracking-widest mb-6 font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Information
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500 mb-1">Payment ID</p>
                  <p className="font-mono">{order.payment_id || 'Not yet paid'}</p>
                </div>
                <div>
                  <p className="text-neutral-500 mb-1">Razorpay Order ID</p>
                  <p className="font-mono">{order.razorpay_order_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-neutral-500 mb-1">Amount</p>
                  <p className="font-medium">₹{order.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-neutral-500 mb-1">Payment Status</p>
                  <p className={`font-medium ${order.payment_id ? 'text-green-600' : 'text-yellow-600'}`}>
                    {order.payment_id ? 'Paid' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="border border-neutral-200 p-6">
              <h2 className="text-xs uppercase tracking-widest mb-6 font-medium">Customer</h2>
              <div className="flex items-center gap-3 mb-4">
                {order.customer_picture ? (
                  <img 
                    src={order.customer_picture}
                    alt={order.customer_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-lg font-medium">{(order.customer_name || 'U')[0].toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <p className="font-medium">{order.customer_name || 'Unknown'}</p>
                  <Link 
                    to={`/admin/customers/${order.user_id}`}
                    className="text-xs text-neutral-500 hover:text-black transition-colors underline"
                  >
                    View Customer Profile
                  </Link>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-neutral-600">
                  <Mail className="w-4 h-4" />
                  <span>{order.customer_email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                  <span className="text-xs text-neutral-400">ID: {order.user_id}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border border-neutral-200 p-6">
              <h2 className="text-xs uppercase tracking-widest mb-6 font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Shipping Address
              </h2>
              <div className="text-sm text-neutral-700 space-y-1">
                <p className="font-medium">{order.shipping_address.name}</p>
                <p>{order.shipping_address.address}</p>
                <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">
                  <Phone className="w-4 h-4" />
                  <span>{order.shipping_address.phone}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="border border-neutral-200 p-6">
              <h2 className="text-xs uppercase tracking-widest mb-6 font-medium">Order Timeline</h2>
              <div className="space-y-4">
                {['pending', 'confirmed', 'shipped', 'delivered'].map((step, idx) => {
                  const statuses = ['pending', 'confirmed', 'shipped', 'delivered'];
                  const currentIdx = statuses.indexOf(order.status);
                  const isCompleted = order.status !== 'cancelled' && idx <= currentIdx;
                  const isCancelled = order.status === 'cancelled';

                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        isCancelled ? 'bg-red-300' :
                        isCompleted ? 'bg-green-500' : 'bg-neutral-200'
                      }`} />
                      <span className={`text-sm capitalize ${
                        isCompleted ? 'text-black font-medium' : 'text-neutral-400'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
                {order.status === 'cancelled' && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm text-red-600 font-medium">Cancelled</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
