import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Sun, Moon, LogOut, Package, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useThemeStore } from '../../store/themeStore';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, role, logout } = useAuthStore();
  const { cart, setIsOpen: setCartOpen } = useCartStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLinks = () => (
    <>
      <Link to="/products" className="text-sm font-medium hover:text-brand-500 transition-colors">Products</Link>
      <Link to="/categories" className="text-sm font-medium hover:text-brand-500 transition-colors">Categories</Link>
      {isAuthenticated && (
        <Link to="/favorites" className="text-sm font-medium hover:text-brand-500 transition-colors">Favorites</Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full glass border-b">
      <div className="page-container flex h-16 items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center shadow-glow">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <span className="font-bold text-xl hidden sm:inline-block gradient-text">Elevate</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <NavLinks />
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
          </Button>

          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" className="relative rounded-full" onClick={() => setCartOpen(true)}>
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                    {cartItemCount}
                  </span>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full border shadow-sm">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card border-none">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(role === 'admin' || role === 'superadmin') && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                        <ShieldCheck className="mr-2 h-4 w-4 text-brand-500" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>Orders</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
              <Button onClick={() => navigate('/register')} className="bg-brand-500 hover:bg-brand-600 shadow-glow">Sign Up</Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] glass border-l-white/20">
              <SheetHeader>
                <SheetTitle className="text-left flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">E</span>
                  </div>
                  <span className="font-bold text-xl gradient-text">Elevate</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-8">
                <div className="flex flex-col space-y-3" onClick={() => setMobileMenuOpen(false)}>
                  <NavLinks />
                </div>
                
                {!isAuthenticated && (
                  <div className="flex flex-col space-y-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <Button variant="outline" className="w-full justify-center" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Log in</Button>
                    <Button className="w-full justify-center bg-brand-500" onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}>Sign Up</Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
