import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Star, ShieldCheck, Truck, RotateCcw, Heart, Share2, Minus, Plus } from 'lucide-react';
import { productsApi } from '../../api/products';
import { reviewsApi } from '../../api/reviews';
import { favoritesApi } from '../../api/favorites';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useToast } from '../../hooks/use-toast';
import { formatPrice, formatDateTime } from '../../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea'; // Need to create this
import ProductCard from '../components/products/ProductCard';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(3, 'Comment must be at least 3 characters'),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const { toast } = useToast();
  
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, comment: '' },
  });

  const ratingValue = watch('rating');

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId),
    enabled: !!productId,
  });

  const { data: reviews, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewsApi.getByProduct(productId),
    enabled: !!productId,
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: () => productsApi.getAll({ category_id: product?.category_id, limit: 4 }),
    enabled: !!product?.category_id,
  });

  // Mock images since backend doesn't seem to return an array of images directly in ProductRead 
  // (it uses a separate product-images route but let's assume we fetch them or generate placeholders)
  const images = [
    `https://ui-avatars.com/api/?name=${encodeURIComponent(product?.name || 'P')}&background=random&size=800`,
    `https://ui-avatars.com/api/?name=2&background=random&size=800`,
    `https://ui-avatars.com/api/?name=3&background=random&size=800`,
  ];

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Please login', description: 'You need to be logged in to add items to cart', variant: 'destructive' });
      return;
    }
    await addItem(productId, quantity);
    toast({ title: 'Added to cart', description: `${quantity}x ${product?.name} added to your cart` });
  };

  const handleAddFavorite = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Please login', description: 'You need to be logged in to add favorites', variant: 'destructive' });
      return;
    }
    try {
      await favoritesApi.add(productId);
      toast({ title: 'Added to favorites', description: `${product?.name} has been added to your favorites` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Could not add to favorites', variant: 'destructive' });
    }
  };

  const onSubmitReview = async (data: ReviewFormValues) => {
    try {
      setIsSubmittingReview(true);
      await reviewsApi.create({ product_id: productId, ...data });
      toast({ title: 'Review submitted', description: 'Thank you for your feedback!' });
      reset();
      refetchReviews();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to submit review', variant: 'destructive' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (productLoading) {
    return (
      <div className="page-container py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="skeleton aspect-square rounded-3xl"></div>
            <div className="flex gap-4">
              {[1, 2, 3].map(i => <div key={i} className="skeleton w-24 h-24 rounded-xl"></div>)}
            </div>
          </div>
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="skeleton h-10 w-3/4"></div>
            <div className="skeleton h-6 w-1/4"></div>
            <div className="skeleton h-8 w-1/3"></div>
            <div className="skeleton h-32 w-full mt-8"></div>
            <div className="skeleton h-14 w-full rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="page-container py-20 text-center text-2xl font-bold">Product not found</div>;
  }

  return (
    <div className="page-container py-8 md:py-12">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-brand-500">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-brand-500">Products</Link>
        <span className="mx-2">/</span>
        <Link to={`/products?category_id=${product.category_id}`} className="hover:text-brand-500">{product.category.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Product Top Section */}
      <div className="flex flex-col lg:flex-row gap-12 mb-20">
        
        {/* Image Gallery */}
        <div className="w-full lg:w-1/2">
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden mb-4 border border-gray-200 dark:border-gray-800">
            <img 
              src={images[activeImage]} 
              alt={product.name} 
              className="w-full h-full object-cover animate-fade-in"
              key={activeImage}
            />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-brand-500 shadow-glow' : 'border-transparent hover:border-brand-300'}`}
              >
                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-brand-500 tracking-wider uppercase">{product.category.name}</span>
              <div className="flex items-center text-yellow-500">
                <Star className="h-5 w-5 fill-current mr-1" />
                <span className="font-bold">{product.rating.toFixed(1)}</span>
                <span className="text-gray-500 ml-2 text-sm">({reviews?.length || 0} reviews)</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">{product.name}</h1>
            <p className="text-3xl font-bold gradient-text">{formatPrice(product.price)}</p>
          </div>

          <div className="prose prose-sm sm:prose-base dark:prose-invert text-gray-600 dark:text-gray-300 mb-8">
            <p>{product.description}</p>
          </div>

          <div className="space-y-6 border-t border-b border-gray-200 dark:border-gray-800 py-6 mb-8">
            <div className="flex items-center justify-between">
              <span className="font-medium">Availability</span>
              {product.stock > 0 ? (
                <span className="text-green-600 dark:text-green-400 font-medium flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  In Stock ({product.stock})
                </span>
              ) : (
                <span className="text-red-500 font-medium flex items-center">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                  Out of Stock
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="font-medium w-24">Quantity</span>
              <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg h-12 w-32">
                <button 
                  className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-l-lg disabled:opacity-50"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={product.stock === 0}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input 
                  type="number" 
                  className="w-12 h-full text-center bg-transparent border-none focus:ring-0 font-medium p-0"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                  disabled={product.stock === 0}
                />
                <button 
                  className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-r-lg disabled:opacity-50"
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  disabled={product.stock === 0}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button 
              size="lg" 
              className="flex-1 h-14 rounded-xl text-lg shadow-glow" 
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              Add to Cart
            </Button>
            <div className="flex gap-4">
              <Button variant="outline" size="icon" className="h-14 w-14 rounded-xl shrink-0" onClick={handleAddFavorite}>
                <Heart className="h-6 w-6" />
              </Button>
              <Button variant="outline" size="icon" className="h-14 w-14 rounded-xl shrink-0">
                <Share2 className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-brand-500" />
              <span>Free delivery on orders over $100</span>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-brand-500" />
              <span>30-day return policy</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-brand-500" />
              <span>2-year warranty included</span>
            </div>
          </div>

        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-20 pt-10 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-col md:flex-row gap-12">
          
          <div className="w-full md:w-1/3">
            <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl font-bold gradient-text">{product.rating.toFixed(1)}</div>
              <div>
                <div className="flex text-yellow-500 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < Math.round(product.rating) ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                  ))}
                </div>
                <div className="text-gray-500">Based on {reviews?.length || 0} reviews</div>
              </div>
            </div>

            {isAuthenticated ? (
              <form onSubmit={handleSubmit(onSubmitReview)} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl space-y-4">
                <h3 className="font-semibold text-lg">Write a Review</h3>
                <div>
                  <label className="block text-sm mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        className={`h-8 w-8 cursor-pointer transition-colors ${star <= ratingValue ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'}`}
                        onClick={() => setValue('rating', star)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <textarea 
                    placeholder="Share your thoughts about this product..." 
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-500 outline-none resize-none h-24"
                    {...register('comment')}
                  />
                  {errors.comment && <p className="text-red-500 text-sm mt-1">{errors.comment.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmittingReview}>
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </form>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl text-center">
                <p className="mb-4">Log in to write a review</p>
                <Link to="/login">
                  <Button variant="outline" className="w-full">Log In</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="w-full md:w-2/3">
            {reviews?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No reviews yet. Be the first to review this product!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews?.map(review => (
                  <div key={review.id} className="border-b border-gray-200 dark:border-gray-800 pb-6 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white font-bold">
                          U{review.user_id}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">User {review.user_id}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(review.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mt-3">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.filter(p => p.id !== productId).length > 0 && (
        <div className="pt-10 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-8">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.filter(p => p.id !== productId).slice(0, 4).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetailPage;
