import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Heart, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const cartCount = getCartCount();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[1001] transition-all duration-300 ${
        isScrolled ? 'glass h-20 shadow-sm' : 'bg-transparent h-24'
      }`} 
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo Section */}
          <div className="flex-1 flex items-center">
            <Link to="/" className="flex flex-col items-start leading-none group" data-testid="logo-link">
              <span className={`text-2xl font-bold tracking-tighter transition-colors ${
                isScrolled ? 'text-black' : 'text-black'
              } group-hover:text-accent-color`}>
                ETLAWM.
              </span>
              <span className="text-[7px] uppercase tracking-[0.3em] text-gray-500 font-bold mt-1">Herbal Rituals</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-10 flex-[2] justify-center">
            <Link
              to="/shop"
              className="text-[12px] font-semibold uppercase tracking-[0.1em] hover:text-accent-color transition-colors flex items-center gap-1"
              data-testid="shop-link"
            >
              Shop All
            </Link>
            <Link
              to="/categories"
              className="text-[12px] font-semibold uppercase tracking-[0.1em] hover:text-accent-color transition-colors flex items-center gap-1"
              data-testid="categories-link"
            >
              Collections <ChevronDown className="w-3 h-3 opacity-30" />
            </Link>
             <Link
              to="/ritual"
              className="text-[12px] font-semibold uppercase tracking-[0.1em] hover:text-accent-color transition-colors"
            >
              The Ritual
            </Link>
            <Link
              to="/science"
              className="text-[12px] font-semibold uppercase tracking-[0.1em] hover:text-accent-color transition-colors"
            >
              Science
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex-1 flex items-center justify-end gap-6">
            <Link
              to="/wishlist"
              className="relative hover:text-accent-color transition-colors group"
              data-testid="wishlist-link"
            >
              <Heart className="w-5 h-5 stroke-[1.8px] group-hover:scale-110 transition-transform" />
            </Link>
            
            <Link
              to="/cart"
              className="relative hover:text-accent-color transition-colors group"
              data-testid="cart-link"
            >
              <ShoppingCart className="w-5 h-5 stroke-[1.8px] group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm" data-testid="cart-count">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hover:text-accent-color transition-colors outline-none group" data-testid="user-menu-trigger">
                    <User className="w-5 h-5 stroke-[1.8px] group-hover:scale-110 transition-transform" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-4 p-2 rounded-xl border border-black/5 shadow-xl bg-white/95 backdrop-blur-lg">
                  <div className="px-3 py-4 border-b border-black/5 mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Signed in as</p>
                    <p className="text-xs font-semibold truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('/account')} className="text-xs py-3 cursor-pointer rounded-lg hover:bg-black/5 font-medium">
                    Account Overview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')} className="text-xs py-3 cursor-pointer rounded-lg hover:bg-black/5 font-medium">
                    Order History
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="text-xs py-3 cursor-pointer rounded-lg hover:bg-black/5 text-accent-color font-bold">
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-xs py-3 cursor-pointer rounded-lg hover:bg-red-50 text-red-600 font-bold mt-2">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="hidden md:block">
                <Button
                  className="bg-black text-white hover:bg-black/80 rounded-full px-6 py-4 text-[11px] uppercase tracking-[0.2em] font-bold h-auto border-none shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  data-testid="login-button"
                >
                  Join Ritual
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden hover:text-accent-color transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Sidebar (Simplified) */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-24 bg-white z-[1000] animate-in fade-in slide-in-from-right duration-300" data-testid="mobile-menu">
            <div className="flex flex-col p-10 gap-8 h-full">
              <Link to="/shop" className="text-3xl font-bold tracking-tighter" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
              <Link to="/categories" className="text-3xl font-bold tracking-tighter" onClick={() => setMobileMenuOpen(false)}>Collections</Link>
              <Link to="/ritual" className="text-3xl font-bold tracking-tighter" onClick={() => setMobileMenuOpen(false)}>Rituals</Link>
              <Link to="/science" className="text-3xl font-bold tracking-tighter" onClick={() => setMobileMenuOpen(false)}>Science</Link>
              
              <div className="mt-auto pb-10 space-y-6">
                {!user && (
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full bg-black text-white rounded-full py-6 text-sm font-bold uppercase tracking-widest">Sign In</Button>
                    </Link>
                )}
                <div className="flex gap-6 text-gray-400">
                    <Heart className="w-6 h-6" />
                    <User className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;