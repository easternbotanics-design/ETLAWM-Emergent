import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Mail, ShoppingBag, CreditCard, Calendar, Eye } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminCustomerDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchCustomer = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/customers/${userId}`, {
        withCredentials: true
      });
      setCustomer(response.data);
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      toast.error('Failed to load customer details');
      if (error.response?.status === 404) {
        navigate('/admin/customers');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-neutral-100 text-neutral-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <p className="text-neutral-600">Customer not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/customers')}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            {customer.picture ? (
              <img 
                src={customer.picture}
                alt={customer.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center">
                <span className="text-2xl font-medium">{(customer.name || 'U')[0].toUpperCase()}</span>
              </div>
            )}
            <div>
              <h1 className="font-display text-4xl">{customer.name || 'Unknown'}</h1>
              <div className="flex items-center gap-2 mt-1 text-neutral-600">
                <Mail className="w-4 h-4" />
                <span>{customer.email}</span>
                <span className={`text-xs px-2 py-0.5 ml-2 ${
                  customer.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {customer.role || 'user'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="border border-neutral-200 p-6">
            <div className="flex items-center gap-2 text-neutral-600 mb-2">
              <ShoppingBag className="w-4 h-4" />
              <p className="text-xs uppercase tracking-widest">Total Orders</p>
            </div>
            <p className="text-3xl font-bold">{customer.total_orders || 0}</p>
          </div>
          <div className="border border-neutral-200 p-6">
            <div className="flex items-center gap-2 text-neutral-600 mb-2">
              <CreditCard className="w-4 h-4" />
              <p className="text-xs uppercase tracking-widest">Total Spent</p>
            </div>
            <p className="text-3xl font-bold text-green-600">₹{(customer.total_spent || 0).toFixed(2)}</p>
          </div>
          <div className="border border-neutral-200 p-6">
            <div className="flex items-center gap-2 text-neutral-600 mb-2">
              <Calendar className="w-4 h-4" />
              <p className="text-xs uppercase tracking-widest">Member Since</p>
            </div>
            <p className="text-lg font-medium">
              {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
            </p>
          </div>
          <div className="border border-neutral-200 p-6">
            <div className="flex items-center gap-2 text-neutral-600 mb-2">
              <p className="text-xs uppercase tracking-widest">Avg. Order Value</p>
            </div>
            <p className="text-3xl font-bold">
              ₹{customer.total_orders > 0 ? (customer.total_spent / customer.total_orders).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {/* Order History */}
        <div>
          <h2 className="font-display text-2xl mb-6">Order History</h2>
          {(!customer.orders || customer.orders.length === 0) ? (
            <div className="text-center py-16 border border-neutral-200">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
              <p className="text-neutral-600">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customer.orders.map((order) => (
                <div key={order.order_id} className="border border-neutral-200 p-6 hover:border-neutral-400 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-neutral-600 mb-1">
                        {order.order_id}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2 md:mt-0">
                      <span className={`text-xs px-3 py-1 ${getStatusColor(order.status)} capitalize`}>
                        {order.status}
                      </span>
                      <Link 
                        to={`/admin/orders/${order.order_id}`}
                        className="flex items-center gap-1 text-sm border border-neutral-300 px-3 py-1 hover:bg-black hover:text-white transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Link>
                    </div>
                  </div>
                  <div className="border-t border-neutral-100 pt-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="text-sm bg-neutral-50 px-3 py-1">
                          {item.product_name} {item.variant_name ? `(${item.variant_name})` : ''} × {item.quantity}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">
                        {order.shipping_address?.city}, {order.shipping_address?.state}
                      </span>
                      <span className="text-lg font-medium">₹{order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerDetail;
