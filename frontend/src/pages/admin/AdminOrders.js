import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Package } from 'lucide-react';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/orders`, {
        withCredentials: true
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
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
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="font-display text-5xl mb-2">Orders Management</h1>
          <p className="text-neutral-600">{filteredOrders.length} orders</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by order ID or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 border border-neutral-300 rounded-none p-4"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border border-neutral-300 rounded-none p-4">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 mx-auto mb-6 text-neutral-400" />
              <p className="text-neutral-600">No orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.order_id} className="border border-neutral-200 p-6">
                <div className="flex flex-col md:flex-row justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-neutral-600 mb-1">
                      Order ID: {order.order_id}
                    </p>
                    <p className="text-sm text-neutral-600">
                      User ID: {order.user_id}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusUpdate(order.order_id, value)}
                    >
                      <SelectTrigger className={`w-[180px] ${getStatusColor(order.status)} border-0 rounded-none`}>
                        <SelectValue />
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

                {/* Order Items */}
                <div className="border-t border-neutral-200 pt-4 mb-4">
                  <p className="text-xs uppercase tracking-widest mb-3">Order Items</p>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.product_name} {item.variant_name ? `(${item.variant_name})` : ''} x {item.quantity}
                        </span>
                        <span>Rs.{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="border-t border-neutral-200 pt-4 mb-4">
                  <p className="text-xs uppercase tracking-widest mb-3">Shipping Address</p>
                  <p className="text-sm text-neutral-700">
                    {order.shipping_address.name}<br />
                    {order.shipping_address.address}<br />
                    {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}<br />
                    Phone: {order.shipping_address.phone}
                  </p>
                </div>

                {/* Total */}
                <div className="border-t border-neutral-200 pt-4 flex justify-between items-center">
                  <span className="text-xs uppercase tracking-widest">Total Amount</span>
                  <span className="text-2xl font-medium">Rs.{order.total_amount.toFixed(2)}</span>
                </div>

                {order.payment_id && (
                  <p className="text-xs text-neutral-600 mt-2">
                    Payment ID: {order.payment_id}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;