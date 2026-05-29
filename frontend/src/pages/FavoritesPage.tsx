import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { favoritesApi } from '../../api/favorites';
import { productsApi } from '../../api/products';
import { useCartStore } from '../../store/cartStore';
import { formatPrice } from '../../lib/utils';
import { Button } from '../components/ui/button';
import { useToast } from '../../hooks/use-toast';

const FavoritesPage: React.FC = () => {
  const { toast } = useToast();
  const { addItem } = useCartStore();

  const { data: favorites, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesApi.getAll,
  });

  // We need to fetch product details for each favorite since the favorite object just has product_id
  const { data: products } = useQuery({
    queryKey: ['favorite-products', favorites?.map(f => f.product_id)],
    queryFn: async () => {
      if (!favorites || favorites.length === 0) return [];
      const productPromises = favorites.map(f => productsApi.getById(f.product_id));
      return Promise.all(productPromises);
    },
    enabled: !!favorites && favorites.length > 0,
  });

  const handleRemove = async (id: number) => {
    try {
      await favoritesApi.remove(id);
      toast({ title: 'Removed', description: 'Item removed from favorites' });
      refetch();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not remove item', variant: 'destructive' });
    }
  };

  const handleAddToCart = async (productId: number) => {
    await addItem(productId, 1);
    toast({ title: 'Added to cart', description: 'Item added to your cart' });
  };

  return (
    <div className="page-container py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8 flex items-center">
        <Heart className="mr-3 h-8 w-8 text-brand-500 fill-brand-500/20" /> My Favorites
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card h-80 skeleton rounded-2xl"></div>
          ))}
        </div>
      ) : !favorites || favorites.length === 0 ? (
        <div className="glass-card py-20 text-center flex flex-col items-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <Heart className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">No favorites yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Save items you love to view them later.</p>
          <Link to="/products">
            <Button>Discover Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products?.map((product) => {
            const favorite = favorites.find(f => f.product_id === product.id);
            if (!favorite) return null;

            return (
              <div key={favorite.id} className="group glass-card overflow-hidden flex flex-col h-full relative">
                <button 
                  onClick={() => handleRemove(favorite.id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <Link to={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=512`}
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                
                <div className="p-4 flex flex-col flex-grow">
                  <Link to={`/products/${product.id}`} className="hover:text-brand-500 transition-colors mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                  </Link>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                    <span className="font-bold text-lg">{formatPrice(product.price)}</span>
                    <Button 
                      size="sm" 
                      className="rounded-full px-4 shadow-glow"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" /> Add
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
