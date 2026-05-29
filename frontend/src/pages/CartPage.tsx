import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { formatPrice } from '../../lib/utils';
import { Button } from '../components/ui/button';

const CartPage: React.FC = () => {
  const { cart, updateItem, removeItem, clearCart, isLoading } = useCartStore();
  const navigate = useNavigate();

  const cartTotal = cart?.items.reduce((total, item) => total + (item.subtotal || 0), 0) || 0;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="page-container py-20 flex flex-col items-center justify-center text-center">
        <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-8">
          <ShoppingBag className="h-16 w-16 text-gray-400" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          Looks like you haven't added anything to your cart yet. Discover our premium collection now!
        </p>
        <Link to="/products">
          <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-glow">
            Start Shopping <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => clearCart()} disabled={isLoading}>
          <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-2/3 space-y-6">
          {cart.items.map((item) => (
            <div key={item.id} className="glass-card flex flex-col sm:flex-row gap-6 p-6 items-center">
              <Link to={`/products/${item.product_id}`} className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img 
                  src={`https://ui-avatars.com/api/?name=${item.product_id}&background=random&size=200`} 
                  alt={`Product ${item.product_id}`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </Link>
              
              <div className="flex flex-col flex-1 w-full text-center sm:text-left">
                <Link to={`/products/${item.product_id}`} className="font-semibold text-lg hover:text-brand-500 transition-colors line-clamp-1 mb-1">
                  Product #{item.product_id}
                </Link>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Premium Quality Item</p>
                
                <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl h-10 w-32">
                    <button 
                      className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-l-xl disabled:opacity-50"
                      onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                      disabled={isLoading}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button 
                      className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-r-xl disabled:opacity-50"
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <span className="font-bold text-xl">{formatPrice(item.subtotal)}</span>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-6">
            <Link to="/products" className="inline-flex items-center text-brand-500 font-medium hover:text-brand-600 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="glass-card p-8 sticky top-24">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Subtotal ({cart.items.length} items)</span>
                <span className="font-medium">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Shipping Estimate</span>
                <span className="font-medium">{cartTotal > 100 ? 'Free' : '$10.00'}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Tax Estimate</span>
                <span className="font-medium">{formatPrice(cartTotal * 0.08)}</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mb-8">
              <div className="flex justify-between items-end">
                <span className="font-bold text-lg">Total</span>
                <span className="text-3xl font-bold gradient-text">
                  {formatPrice(cartTotal + (cartTotal > 100 ? 0 : 10) + (cartTotal * 0.08))}
                </span>
              </div>
            </div>
            
            <Button 
              size="lg" 
              className="w-full h-14 text-lg rounded-xl shadow-glow"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </Button>
            
            <div className="mt-6 flex items-center justify-center space-x-4 text-gray-400">
              <span className="text-sm">Secure Checkout</span>
              {/* Add payment icons here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
