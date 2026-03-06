import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, ShoppingBag, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/stats`, {
        withCredentials: true
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      if (error.response?.status === 403) {
        navigate('/shop');
      }
    } finally {
      setLoading(false);
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
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="font-display text-5xl mb-4">Admin Dashboard</h1>
          <p className="text-neutral-600">Manage your ETLAWM store</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Total Revenue</CardTitle>
              <TrendingUp className="w-4 h-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Rs.{stats?.total_revenue?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Total Orders</CardTitle>
              <ShoppingBag className="w-4 h-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_orders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Total Products</CardTitle>
              <Package className="w-4 h-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_products || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">Total Users</CardTitle>
              <Users className="w-4 h-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_users || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {stats?.low_stock_products && stats.low_stock_products.length > 0 && (
          <Card className="mb-12 border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.low_stock_products.map((product) => (
                  <div key={product.product_id} className="flex justify-between items-center p-4 bg-yellow-50 border border-yellow-200">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.variants?.map((variant) => (
                        variant.stock < 10 && (
                          <p key={variant.variant_id} className="text-sm text-neutral-600">
                            {variant.name}: {variant.stock} units remaining
                          </p>
                        )
                      ))}
                    </div>
                    <Link to={`/admin/products/${product.product_id}`} className="text-sm uppercase tracking-widest hover:text-gold">
                      Manage →
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/products" className="border border-neutral-200 p-8 hover:border-black transition-colors group">
            <Package className="w-8 h-8 mb-4 group-hover:text-gold transition-colors" />
            <h3 className="text-xl font-display mb-2">Manage Products</h3>
            <p className="text-sm text-neutral-600">Add, edit, or remove products from your catalog</p>
          </Link>

          <Link to="/admin/orders" className="border border-neutral-200 p-8 hover:border-black transition-colors group">
            <ShoppingBag className="w-8 h-8 mb-4 group-hover:text-gold transition-colors" />
            <h3 className="text-xl font-display mb-2">Manage Orders</h3>
            <p className="text-sm text-neutral-600">View and update order statuses</p>
          </Link>

          <Link to="/admin/inventory" className="border border-neutral-200 p-8 hover:border-black transition-colors group">
            <TrendingUp className="w-8 h-8 mb-4 group-hover:text-gold transition-colors" />
            <h3 className="text-xl font-display mb-2">Inventory Management</h3>
            <p className="text-sm text-neutral-600">Track and manage stock levels</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;