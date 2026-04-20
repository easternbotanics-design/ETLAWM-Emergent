import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone, ArrowRight } from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="footer-dark font-inter" data-testid="footer">

      {/* Top marquee strip */}
      <div className="bg-[#F5F5F0] py-3 overflow-hidden border-t border-black/5 whitespace-nowrap">
        <div className="flex animate-marquee text-black font-semibold text-[11px] tracking-[0.12em] uppercase gap-12">
          {[1, 2, 3, 4].map(i => (
            <React.Fragment key={i}>
              <span>100% Satisfaction Guarantee</span>
              <span className="opacity-25">◆</span>
              <span>Made in India</span>
              <span className="opacity-25">◆</span>
              <span>Cruelty Free</span>
              <span className="opacity-25">◆</span>
              <span>No Synthetic Fragrance</span>
              <span className="opacity-25">◆</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-12">

        {/* Top row: brand + newsletter */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 pb-16 border-b border-white/8">

          {/* Brand block */}
          <div className="max-w-xs">
            <div className="text-white font-bold tracking-tighter text-3xl mb-3">ETLAWM.</div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-5">Herbal Rituals</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Pure botanical formulas crafted with traditional herbal wisdom and modern science — for hair that truly thrives.
            </p>
          </div>

          {/* Newsletter */}
          <div className="w-full max-w-md">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-2">Stay in the Ritual</h4>
            <p className="text-gray-500 text-xs mb-5 leading-relaxed">
              New launches, rituals, and exclusive offers — straight to your inbox.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-3 text-green-400 text-sm font-semibold py-3">
                <span className="text-lg">✓</span> You're in — welcome to the ritual.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="newsletter-input flex-1 text-sm"
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-white text-black text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-full hover:bg-[#C8A97A] hover:text-white transition-all duration-300 whitespace-nowrap"
                >
                  Subscribe <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Middle row: links + contact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 py-16 border-b border-white/8">

          {/* Shop */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Shop</h4>
            <ul className="flex flex-col gap-3.5">
              {[
                { label: 'All Products', to: '/shop' },
                { label: 'Collections', to: '/categories' },
                { label: 'Best Sellers', to: '/shop' },
                { label: 'New Arrivals', to: '/shop' },
              ].map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-gray-400 text-sm hover:text-white transition-colors duration-200 hover:translate-x-0.5 inline-block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Company</h4>
            <ul className="flex flex-col gap-3.5">
              {[
                { label: 'Our Story', to: '/about' },
                { label: 'The Science', to: '/science' },
                { label: 'The Ritual', to: '/ritual' },
                { label: 'Sustainability', to: '/about' },
              ].map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-gray-400 text-sm hover:text-white transition-colors duration-200 hover:translate-x-0.5 inline-block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Support</h4>
            <ul className="flex flex-col gap-3.5">
              {[
                { label: 'My Account', to: '/account' },
                { label: 'Track Order', to: '/orders' },
                { label: 'FAQs', to: '/faq' },
                { label: 'Shipping & Returns', to: '/shipping' },
              ].map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-gray-400 text-sm hover:text-white transition-colors duration-200 hover:translate-x-0.5 inline-block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Contact</h4>
            <ul className="flex flex-col gap-5">
              <li>
                <a href="tel:+916239551893" className="flex items-start gap-3 group">
                  <Phone className="w-4 h-4 text-[#C8A97A] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400 text-sm group-hover:text-white transition-colors">
                    +91 62395 51893
                  </span>
                </a>
              </li>
              <li>
                <a href="mailto:info@etlawm.com" className="flex items-start gap-3 group">
                  <Mail className="w-4 h-4 text-[#C8A97A] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400 text-sm group-hover:text-white transition-colors">
                    info@etlawm.com
                  </span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#C8A97A] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400 text-sm leading-relaxed">
                    Manipur, India
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row: socials + copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10">

          {/* Socials */}
          <div className="flex items-center gap-5">
            {[
              { icon: <Instagram className="w-4 h-4" />, label: 'Instagram', href: '#' },
              { icon: <Facebook className="w-4 h-4" />, label: 'Facebook', href: '#' },
              { icon: <Twitter className="w-4 h-4" />, label: 'Twitter', href: '#' },
            ].map(s => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-200"
              >
                {s.icon}
              </a>
            ))}
          </div>

          {/* Copyright + legal */}
          <div className="flex flex-col md:flex-row items-center gap-4 text-gray-600 text-xs">
            <span>© 2026 ETLAWM. All rights reserved.</span>
            <div className="flex gap-5">
              <Link to="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-gray-400 transition-colors">Terms of Use</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
