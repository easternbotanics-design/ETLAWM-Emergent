import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer-dark font-inter" data-testid="footer">
      {/* Footer Marquee */}
      <div className="bg-[#F5F5F0] py-4 overflow-hidden border-t border-black/5 whitespace-nowrap mb-20">
        <div className="flex animate-marquee text-black font-medium text-sm gap-12">
           {[1, 2, 3, 4].map(i => (
             <React.Fragment key={i}>
                <span>100% SATISFACTION GUARANTEE</span>
                <span className="opacity-30">•</span>
                <span>MADE IN INDIA</span>
                <span className="opacity-30">•</span>
                <span>CRUELTY FREE</span>
                <span className="opacity-30">•</span>
                <span>NO SYNTHETIC FRAGRANCE</span>
                <span className="opacity-30">•</span>
             </React.Fragment>
           ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col gap-20">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            {/* Logo Section */}
            <div className="footer-logo-large">
              ETLAWM.
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-16 md:gap-24">
              <div className="flex flex-col gap-6">
                <h4 className="text-white font-bold text-sm uppercase tracking-widest">Shop</h4>
                <ul className="flex flex-col gap-3 text-gray-400 text-sm">
                  <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
                  <li><Link to="/categories" className="hover:text-white transition-colors">Collections</Link></li>
                  <li><Link to="/best-sellers" className="hover:text-white transition-colors">Best Sellers</Link></li>
                  <li><Link to="/new-arrivals" className="hover:text-white transition-colors">New Arrivals</Link></li>
                </ul>
              </div>

              <div className="flex flex-col gap-6">
                <h4 className="text-white font-bold text-sm uppercase tracking-widest">Support</h4>
                <ul className="flex flex-col gap-3 text-gray-400 text-sm">
                  <li><Link to="/account" className="hover:text-white transition-colors">My Profile</Link></li>
                  <li><Link to="/orders" className="hover:text-white transition-colors">Track Order</Link></li>
                  <li><Link to="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
                  <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
                </ul>
              </div>

              <div className="flex flex-col gap-6 col-span-2 md:col-span-1">
                <h4 className="text-white font-bold text-sm uppercase tracking-widest">Contact</h4>
                <ul className="flex flex-col gap-4 text-gray-400 text-sm">
                  <li className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span>Pure Botanical Hub, <br/>Indiranagar, Bangalore, <br/>Karnataka 560038</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="w-4 h-4" />
                    <span>hello@etlawm.com</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="w-4 h-4" />
                    <span>+91 98765 43210</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Socials & Copyright */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-gray-500 text-xs">
            <div className="flex items-center gap-8">
              <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
                <Instagram className="w-4 h-4" /> Instagram
              </a>
              <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
                <Facebook className="w-4 h-4" /> Facebook
              </a>
              <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
                <Twitter className="w-4 h-4" /> Twitter
              </a>
            </div>
            <div className="flex items-center gap-6">
              <span>© 2026 ETLAWM HERBALS. All rights reserved.</span>
              <div className="flex gap-4 underline underline-offset-4">
                <Link to="/privacy">Privacy</Link>
                <Link to="/terms">Terms</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;