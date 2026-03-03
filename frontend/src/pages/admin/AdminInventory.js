import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'text-red-600', icon: TrendingDown };
    if (stock < 10) return { label: 'Low Stock', color: 'text-yellow-600', icon: AlertTriangle };
    if (stock < 30) return { label: 'In Stock', color: 'text-blue-600', icon: TrendingUp };
    return { label: 'Well Stocked', color: 'text-green-600', icon: Package };
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
          <h1 className="font-display text-5xl mb-2">Inventory Management</h1>
          <p className="text-neutral-600">Monitor stock levels across all products</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="border border-neutral-200 p-6">
            <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2">Total Products</p>
            <p className="text-3xl font-bold">{products.length}</p>
          </div>
          <div className="border border-green-200 p-6">
            <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2">Well Stocked</p>
            <p className="text-3xl font-bold text-green-600">
              {products.filter(p => {
                const total = p.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                return total >= 30;
              }).length}
            </p>
          </div>
          <div className="border border-yellow-200 p-6">
            <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2">Low Stock</p>
            <p className="text-3xl font-bold text-yellow-600">
              {products.filter(p => {
                const total = p.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                return total > 0 && total < 10;
              }).length}
            </p>
          </div>
          <div className="border border-red-200 p-6">
            <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2">Out of Stock</p>
            <p className="text-3xl font-bold text-red-600">
              {products.filter(p => {
                const total = p.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                return total === 0;
              }).length}
            </p>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="border border-neutral-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="text-left p-4 text-xs uppercase tracking-widest">Product</th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest">Category</th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest">Variants</th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest">Total Stock</th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                  const status = getStockStatus(totalStock);
                  const StatusIcon = status.icon;

                  return (
                    <tr key={product.product_id} className="border-t border-neutral-200">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.images?.[0] || 'https://images.unsplash.com/photo-1617416430402-8c131ef45227'}
                            alt={product.name}
                            className="w-12 h-12 object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-neutral-600">{product.product_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{product.category}</td>
                      <td className="p-4">
                        {product.variants && product.variants.length > 0 ? (
                          <div className="space-y-1">
                            {product.variants.map((variant) => (
                              <div key={variant.variant_id} className="text-sm">
                                <span className="text-neutral-600">{variant.name}:</span>{' '}
                                <span className={variant.stock < 10 ? 'text-red-600 font-medium' : ''}>
                                  {variant.stock}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-400">No variants</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-lg font-medium ${status.color}`}>
                          {totalStock}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className={`flex items-center gap-2 ${status.color}`}>
                          <StatusIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">{status.label}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;
