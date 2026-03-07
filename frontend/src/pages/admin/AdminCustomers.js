import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Users, Mail, ShoppingBag, Eye } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/customers`, {
        withCredentials: true
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="mb-12">
          <h1 className="font-display text-5xl mb-2">Customer Management</h1>
          <p className="text-neutral-600">{filteredCustomers.length} registered customers</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border border-neutral-200 p-6">
            <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2">Total Customers</p>
            <p className="text-3xl font-bold">{customers.length}</p>
          </div>
          <div className="border border-neutral-200 p-6">
            <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2">Active Buyers</p>
            <p className="text-3xl font-bold text-green-600">
              {customers.filter(c => c.total_orders > 0).length}
            </p>
          </div>
          <div className="border border-neutral-200 p-6">
            <p className="text-xs uppercase tracking-widest text-neutral-600 mb-2">Total Revenue</p>
            <p className="text-3xl font-bold">
              ₹{customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 border border-neutral-300 rounded-none p-4"
            />
          </div>
        </div>

        {/* Customers Table */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto mb-6 text-neutral-400" />
            <p className="text-neutral-600">No customers found</p>
          </div>
        ) : (
          <div className="border border-neutral-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="text-left p-4 text-xs uppercase tracking-widest">Customer</th>
                    <th className="text-left p-4 text-xs uppercase tracking-widest">Email</th>
                    <th className="text-left p-4 text-xs uppercase tracking-widest">Role</th>
                    <th className="text-left p-4 text-xs uppercase tracking-widest">Orders</th>
                    <th className="text-left p-4 text-xs uppercase tracking-widest">Total Spent</th>
                    <th className="text-left p-4 text-xs uppercase tracking-widest">Joined</th>
                    <th className="text-right p-4 text-xs uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.user_id} className="border-t border-neutral-200 hover:bg-neutral-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {customer.picture ? (
                            <img 
                              src={customer.picture}
                              alt={customer.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                              <span className="text-sm font-medium">{(customer.name || 'U')[0].toUpperCase()}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{customer.name || 'Unknown'}</p>
                            <p className="text-xs text-neutral-400">{customer.user_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3 text-neutral-400" />
                          {customer.email}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 ${
                          customer.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {customer.role || 'user'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-neutral-400" />
                          <span className="font-medium">{customer.total_orders || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`font-medium ${customer.total_spent > 0 ? 'text-green-600' : 'text-neutral-400'}`}>
                          ₹{(customer.total_spent || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-neutral-600">
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end">
                          <Link 
                            to={`/admin/customers/${customer.user_id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm border border-neutral-300 hover:bg-black hover:text-white transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;
