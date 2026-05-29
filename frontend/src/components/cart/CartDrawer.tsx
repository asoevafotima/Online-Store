import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { formatPrice } from '../../lib/utils';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';

const CartDrawer: React.FC = () => {
  const { cart, isOpen, setIsOpen, updateItem, removeItem, isLoading } = useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  const cartTotal = cart?.items.reduce((total, item) => total + (item.subtotal || 0), 0) || 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 glass">
        <SheetHeader className="p-6 border-b border-gray-200 dark:border-gray-800">
          <SheetTitle className="flex items-center">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Your Cart
            <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
              {cart?.items.length || 0} items
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold">Your cart is empty</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-[250px]">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Button 
                onClick={() => { setIsOpen(false); navigate('/products'); }}
                className="mt-4"
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 glass-card-static rounded-2xl relative group">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${item.product_id}&background=random&size=200`} 
                      alt="Product" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start pr-6">
                      <h4 className="font-semibold text-sm sm:text-base line-clamp-2">Product #{item.product_id}</h4>
                      <p className="font-bold whitespace-nowrap ml-2">{formatPrice(item.subtotal)}</p>
                    </div>
                    
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg h-8 sm:h-10">
                        <button 
                          className="w-8 sm:w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-l-lg disabled:opacity-50"
                          onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}
                          disabled={isLoading}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 sm:w-10 text-center font-medium text-sm">
                          {item.quantity}
                        </span>
                        <button 
                          className="w-8 sm:w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-r-lg disabled:opacity-50"
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          disabled={isLoading}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors sm:hidden"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="gradient-text">{formatPrice(cartTotal)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full h-14 text-lg rounded-xl shadow-glow" 
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>
            <Button 
              variant="ghost" 
              className="w-full mt-2" 
              onClick={() => { setIsOpen(false); navigate('/cart'); }}
            >
              View Cart Page
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
