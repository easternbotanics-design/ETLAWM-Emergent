import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-24" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <h3 className="font-display text-2xl font-semibold tracking-tighter">ETLAWM</h3>
            <p className="text-[13px] text-primary-foreground/70 leading-relaxed font-light">
              Pure herbal excellence. We craft minimalist hair and face care routines for the conscious individual, using nature's most potent botanicals.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] mb-8 font-semibold text-accent/80">Shop</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/shop" className="text-[13px] hover:text-accent transition-colors font-light">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-[13px] hover:text-accent transition-colors font-light">
                  Collection
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] mb-8 font-semibold text-accent/80">Support</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/account" className="text-[13px] hover:text-accent transition-colors font-light">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-[13px] hover:text-accent transition-colors font-light">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] mb-8 font-semibold text-accent/80">Connect</h4>
            <div className="flex gap-6">
              <a href="#" className="hover:text-accent transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5 stroke-[1.5px]" />
              </a>
              <a href="#" className="hover:text-accent transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5 stroke-[1.5px]" />
              </a>
              <a href="#" className="hover:text-accent transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5 stroke-[1.5px]" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-12 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] text-primary-foreground/50 tracking-wide font-light">
            © 2026 ETLAWM HERBALS. All rights reserved.
          </p>
          <div className="flex gap-10 text-[11px] text-primary-foreground/50 tracking-wide font-light">
            <a href="#" className="hover:text-accent transition-colors">Privacy</a>
            <a href="#" className="hover:text-accent transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;