import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`${API_URL}/api/products/${productId}`, {
        withCredentials: true
      });
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="font-display text-5xl mb-2">Products</h1>
            <p className="text-neutral-600">{filteredProducts.length} products</p>
          </div>
          <Link to="/admin/products/new">
            <Button className="bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-all duration-300 rounded-none px-8 py-4 uppercase tracking-widest text-xs">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 border border-neutral-300 rounded-none p-4"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="border border-neutral-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="text-left p-4 text-xs uppercase tracking-widest">Product</th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest">Category</th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest">Price</th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest">Stock</th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest">Featured</th>
                  <th className="text-right p-4 text-xs uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                  return (
                    <tr key={product.product_id} className="border-t border-neutral-200">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.images?.[0] || 'https://images.unsplash.com/photo-1617416430402-8c131ef45227'}
                            alt={product.name}
                            className="w-16 h-16 object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-neutral-600">{product.product_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{product.category}</td>
                      <td className="p-4">Rs.{product.base_price.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={totalStock < 10 ? 'text-red-600 font-medium' : ''}>
                          {totalStock} units
                        </span>
                      </td>
                      <td className="p-4">
                        {product.featured ? (
                          <span className="text-gold">★ Yes</span>
                        ) : (
                          <span className="text-neutral-400">No</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Link to={`/admin/products/${product.product_id}`}>
                            <button className="p-2 hover:bg-neutral-100 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(product.product_id)}
                            className="p-2 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

export default AdminProducts;