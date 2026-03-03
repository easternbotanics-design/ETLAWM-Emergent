import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-24" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <h3 className="font-display text-3xl mb-6">ETLAWM</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Luxury beauty and cosmetics for the modern individual.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs uppercase tracking-widest mb-6 text-gold">Shop</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/shop" className="text-sm hover:text-gold transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-sm hover:text-gold transition-colors">
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs uppercase tracking-widest mb-6 text-gold">Customer Care</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/account" className="text-sm hover:text-gold transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-sm hover:text-gold transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs uppercase tracking-widest mb-6 text-gold">Connect</h4>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gold transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-gold transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-gold transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-400">
            © 2026 ETLAWM. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs text-neutral-400">
            <a href="#" className="hover:text-gold transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gold transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;