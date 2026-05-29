import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../lib/utils';
import { Product } from '../../lib/types';
import { ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="group glass-card overflow-hidden flex flex-col h-full">
      <Link to={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=512`}
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        {product.stock === 0 && (
          <div className="absolute top-2 right-2 bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded">
            Out of Stock
          </div>
        )}
      </Link>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/products/${product.id}`} className="hover:text-brand-500 transition-colors">
            <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
          </Link>
          <div className="flex items-center text-yellow-500 text-sm">
            <Star className="h-4 w-4 fill-current mr-1" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-grow">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-lg">{formatPrice(product.price)}</span>
          <button 
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-colors disabled:opacity-50"
            disabled={product.stock === 0}
            onClick={(e) => {
              e.preventDefault();
              // Add to cart logic will go here
            }}
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
