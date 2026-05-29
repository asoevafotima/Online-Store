import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Github, Mail, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 dark:bg-surface-darker border-t border-gray-200 dark:border-gray-800 pt-16 pb-8">
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 xl:gap-12 mb-12">
          
          {/* Brand Col */}
          <div className="flex flex-col space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="font-bold text-xl gradient-text">Elevate</span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
              Premium quality products delivered right to your door. Experience modern shopping with Elevate.
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-brand-500 transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-brand-500 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-brand-500 transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-brand-500 transition-colors"><Github size={20} /></a>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Shop</h3>
            <ul className="space-y-3">
              <li><Link to="/products" className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400 transition-colors">All Products</Link></li>
              <li><Link to="/categories/electronics" className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400 transition-colors">Electronics</Link></li>
              <li><Link to="/categories/clothing" className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400 transition-colors">Clothing</Link></li>
              <li><Link to="/categories/home" className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400 transition-colors">Home & Garden</Link></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400 transition-colors">Track Order</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400 transition-colors">Returns & Refunds</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-sm text-gray-500 dark:text-gray-400">
                <MapPin size={18} className="text-brand-500 mt-0.5 shrink-0" />
                <span>123 Innovation Drive, Tech City, TC 10010</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                <Phone size={18} className="text-brand-500 shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                <Mail size={18} className="text-brand-500 shrink-0" />
                <span>support@elevate.com</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Elevate E-Commerce. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0 text-sm text-gray-500 dark:text-gray-400">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>PayPal</span>
            <span>Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
