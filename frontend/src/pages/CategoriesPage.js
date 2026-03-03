import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
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
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12" data-testid="categories-page">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-5xl md:text-6xl mb-12">Shop by Category</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category}
              to={`/shop?category=${category}`}
              className="group border border-neutral-200 p-12 hover:border-black transition-all duration-300"
              data-testid={`category-${category}`}
            >
              <h2 className="font-display text-3xl mb-4 group-hover:text-gold transition-colors">
                {category}
              </h2>
              <span className="text-xs uppercase tracking-widest text-neutral-600 group-hover:text-black transition-colors">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
