import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Heart, Menu, X, LogOut } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const cartCount = getCartCount();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link to="/" className="font-display text-2xl font-semibold tracking-tighter hover:text-accent transition-colors" data-testid="logo-link">
            ETLAWM
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            <Link
              to="/shop"
              className="text-[11px] font-medium uppercase tracking-[0.2em] hover:text-accent transition-colors"
              data-testid="shop-link"
            >
              Shop
            </Link>
            <Link
              to="/categories"
              className="text-[11px] font-medium uppercase tracking-[0.2em] hover:text-accent transition-colors"
              data-testid="categories-link"
            >
              Collection
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-8">
            {user ? (
              <>
                <Link
                  to="/wishlist"
                  className="relative hover:text-accent transition-colors"
                  data-testid="wishlist-link"
                >
                  <Heart className="w-5 h-5 stroke-[1.5px]" />
                </Link>
                <Link
                  to="/cart"
                  className="relative hover:text-accent transition-colors"
                  data-testid="cart-link"
                >
                  <ShoppingCart className="w-5 h-5 stroke-[1.5px]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold" data-testid="cart-count">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hover:text-accent transition-colors outline-none" data-testid="user-menu-trigger">
                      <User className="w-5 h-5 stroke-[1.5px]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-md border-border shadow-sm">
                    <DropdownMenuItem onClick={() => navigate('/account')} data-testid="account-menu-item" className="text-xs py-3">
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')} data-testid="orders-menu-item" className="text-xs py-3">
                      Your Orders
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="admin-menu-item" className="text-xs py-3">
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout} data-testid="logout-menu-item" className="text-xs py-3 text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="hover:bg-transparent hover:text-accent text-[11px] uppercase tracking-[0.2em] font-medium"
                  data-testid="login-button"
                >
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden hover:text-accent transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 stroke-[1.5px]" /> : <Menu className="w-6 h-6 stroke-[1.5px]" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-8 border-t border-border animate-in fade-in slide-in-from-top-4 duration-300" data-testid="mobile-menu">
            <div className="flex flex-col gap-8">
              <Link
                to="/shop"
                className="text-xs font-medium uppercase tracking-[0.2em] hover:text-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link
                to="/categories"
                className="text-xs font-medium uppercase tracking-[0.2em] hover:text-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Collection
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;