import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Mail, ShieldCheck, Truck, Clock } from 'lucide-react';
import { productsApi } from '../../api/products';
import { categoriesApi } from '../../api/categories';
import { Product, Category } from '../../lib/types';
import ProductCard from '../components/products/ProductCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productsApi.getAll({ limit: 8, sort_by: 'rating', order: 'desc' }),
          categoriesApi.getAll()
        ]);
        setFeaturedProducts(productsRes);
        setCategories(categoriesRes.slice(0, 4)); // Show top 4 categories
      } catch (error) {
        console.error('Failed to fetch home page data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-50 dark:bg-surface-darker py-20 sm:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 dark:opacity-5 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-accent-500/20 mix-blend-multiply"></div>
        
        <div className="page-container relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-sm font-medium text-brand-600 dark:text-brand-400 mb-8 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-brand-500 mr-2 animate-pulse"></span>
            New Spring Collection 2026
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Elevate Your <br className="hidden sm:block" />
            <span className="gradient-text">Everyday Lifestyle</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Discover premium products curated for modern living. Uncompromising quality, exceptional design, delivered directly to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/products">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full shadow-glow">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/categories">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-md">
                Browse Categories
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center p-6 glass-card">
              <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 text-brand-500">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Free Fast Shipping</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">On all orders over $100. Delivered in 2-3 business days.</p>
            </div>
            <div className="flex flex-col items-center p-6 glass-card">
              <div className="w-12 h-12 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mb-4 text-accent-500">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Secure Payments</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">100% secure payment processing with top-tier encryption.</p>
            </div>
            <div className="flex flex-col items-center p-6 glass-card">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-500">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">24/7 Support</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Our dedicated team is here to help you anytime, anywhere.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Shop by Category</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Find exactly what you're looking for</p>
            </div>
            <Link to="/categories" className="hidden sm:flex items-center text-brand-500 font-medium hover:text-brand-600">
              View All Categories <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton aspect-square rounded-2xl"></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {categories.map((category, idx) => (
                <Link key={category.id} to={`/products?category_id=${category.id}`} className="group relative rounded-2xl overflow-hidden aspect-square">
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    idx === 0 ? 'from-orange-400 to-rose-400' : 
                    idx === 1 ? 'from-blue-400 to-indigo-500' : 
                    idx === 2 ? 'from-emerald-400 to-teal-500' : 
                    'from-purple-400 to-pink-500'
                  } opacity-80 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{category.name}</h3>
                    <p className="text-white/80 text-sm hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                      Explore collection
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50 dark:bg-surface-darker">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Trending Now</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Our most popular products this week</p>
            </div>
            <Link to="/products" className="hidden sm:flex items-center text-brand-500 font-medium hover:text-brand-600">
              View All Products <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass-card h-[400px]">
                  <div className="skeleton h-[250px] w-full rounded-t-2xl"></div>
                  <div className="p-4 space-y-3">
                    <div className="skeleton h-4 w-3/4"></div>
                    <div className="skeleton h-4 w-full"></div>
                    <div className="skeleton h-6 w-1/4 mt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="page-container text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-16">Loved by Thousands</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sarah M.", text: "The quality of these products is simply unmatched. I've completely upgraded my setup and couldn't be happier.", rating: 5 },
              { name: "David K.", text: "Fast shipping and excellent customer service. The packaging was beautiful too. Will definitely shop here again.", rating: 5 },
              { name: "Elena R.", text: "I'm extremely picky, but Elevate exceeded my expectations. Premium feel without the ridiculous markup.", rating: 4 }
            ].map((review, i) => (
              <div key={i} className="glass-card p-8 text-left relative mt-8">
                <div className="absolute -top-6 left-8 w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white font-bold text-xl border-4 border-white dark:border-gray-900 shadow-sm">
                  {review.name.charAt(0)}
                </div>
                <div className="flex items-center text-yellow-500 mb-4 mt-2">
                  {[...Array(review.rating)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic mb-6">"{review.text}"</p>
                <p className="font-semibold">{review.name}</p>
                <p className="text-sm text-gray-500">Verified Buyer</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-600 dark:bg-brand-900"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djI2SDI0VjM0SDZWMjRoMThWMEgzNnYyNGgxOHYxMEgzNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="page-container relative z-10">
          <div className="max-w-3xl mx-auto glass-card bg-white/10 dark:bg-black/20 border-white/20 p-8 sm:p-12 text-center rounded-3xl backdrop-blur-xl">
            <Mail className="h-12 w-12 text-white mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Join Our Newsletter</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="h-12 bg-white/90 border-transparent focus:bg-white text-gray-900 placeholder:text-gray-500"
                required
              />
              <Button type="submit" size="lg" className="h-12 bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shrink-0">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
