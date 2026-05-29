import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, LayoutGrid, List as ListIcon, X, Filter } from 'lucide-react';
import { productsApi } from '../../api/products';
import { categoriesApi } from '../../api/categories';
import ProductCard from '../components/products/ProductCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { ITEMS_PER_PAGE, SORT_OPTIONS } from '../../lib/constants';
import { useDebounce } from '../../hooks/useDebounce'; // Will create this

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const categoryId = searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined;
  const minPrice = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined;
  const maxPrice = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined;
  const sortBy = searchParams.get('sort_by') || 'id';
  const order = (searchParams.get('order') as 'asc' | 'desc') || 'asc';
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;

  // Sync debounced search to URL
  useEffect(() => {
    if (debouncedSearch) {
      searchParams.set('search', debouncedSearch);
    } else {
      searchParams.delete('search');
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  }, [debouncedSearch, setSearchParams]);

  // Queries
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', debouncedSearch, categoryId, minPrice, maxPrice, sortBy, order, page],
    queryFn: () => productsApi.getAll({
      search: debouncedSearch || undefined,
      category_id: categoryId,
      min_price: minPrice,
      max_price: maxPrice,
      sort_by: sortBy,
      order,
      skip: (page - 1) * ITEMS_PER_PAGE,
      limit: ITEMS_PER_PAGE,
    }),
  });

  const updateFilters = (key: string, value: string | null) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    if (key !== 'page') searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchParams(new URLSearchParams());
    setIsMobileFiltersOpen(false);
  };

  const FiltersContent = () => (
    <div className="space-y-8">
      {/* Search */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Search</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..." 
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          <div 
            className={`cursor-pointer text-sm py-1 transition-colors ${!categoryId ? 'text-brand-500 font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            onClick={() => updateFilters('category_id', null)}
          >
            All Categories
          </div>
          {categories?.map(cat => (
            <div 
              key={cat.id}
              className={`cursor-pointer text-sm py-1 transition-colors ${categoryId === cat.id ? 'text-brand-500 font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              onClick={() => updateFilters('category_id', cat.id.toString())}
            >
              {cat.name}
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Price Range</h3>
        <div className="flex items-center space-x-2">
          <Input 
            type="number" 
            placeholder="Min" 
            value={minPrice || ''}
            onChange={(e) => updateFilters('min_price', e.target.value)}
            className="w-full"
          />
          <span className="text-gray-400">-</span>
          <Input 
            type="number" 
            placeholder="Max" 
            value={maxPrice || ''}
            onChange={(e) => updateFilters('max_price', e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={clearFilters}>
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="page-container py-8 md:py-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">All Products</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {products ? `Showing ${products.length} results` : 'Loading products...'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto w-full md:w-auto">
          {/* Mobile Filter Toggle */}
          <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden flex-1 shrink-0">
                <Filter className="mr-2 h-4 w-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="mb-6">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <FiltersContent />
            </SheetContent>
          </Sheet>

          <Select 
            value={`${sortBy}-${order}`} 
            onValueChange={(val) => {
              const [s, o] = val.split('-');
              updateFilters('sort_by', s);
              updateFilters('order', o);
            }}
          >
            <SelectTrigger className="w-[180px] hidden sm:flex shrink-0">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(opt => (
                <React.Fragment key={opt.value}>
                  <SelectItem value={`${opt.value}-asc`}>{opt.label} (Asc)</SelectItem>
                  <SelectItem value={`${opt.value}-desc`}>{opt.label} (Desc)</SelectItem>
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shrink-0">
            <button 
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-500' : 'text-gray-500'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-500' : 'text-gray-500'}`}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 glass-card p-6">
            <div className="flex items-center mb-6 text-lg font-bold">
              <SlidersHorizontal className="mr-2 h-5 w-5" /> Filters
            </div>
            <FiltersContent />
          </div>
        </aside>

        {/* Product Grid/List */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "flex flex-col gap-6"
            }>
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`glass-card ${viewMode === 'list' ? 'flex h-48' : 'h-[400px]'}`}>
                  <div className={`skeleton ${viewMode === 'list' ? 'w-48 h-full rounded-l-2xl' : 'h-[250px] w-full rounded-t-2xl'}`}></div>
                  <div className="p-4 space-y-3 flex-1">
                    <div className="skeleton h-5 w-3/4"></div>
                    <div className="skeleton h-4 w-full"></div>
                    <div className="skeleton h-4 w-5/6"></div>
                    <div className="skeleton h-6 w-1/4 mt-auto pt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products?.length === 0 ? (
            <div className="glass-card py-20 px-4 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filters or search query.</p>
              <Button onClick={clearFilters}>Clear All Filters</Button>
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in" 
                : "flex flex-col gap-6 animate-fade-in"
              }>
                {products?.map(product => (
                  viewMode === 'grid' ? (
                    <ProductCard key={product.id} product={product} />
                  ) : (
                    <div key={product.id} className="glass-card flex flex-col sm:flex-row h-auto sm:h-48 overflow-hidden group">
                      <div className="w-full sm:w-48 h-48 sm:h-full shrink-0 bg-gray-100 dark:bg-gray-800 relative">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=512`}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-xl">{product.name}</h3>
                          <span className="font-bold text-xl text-brand-500">${product.price.toFixed(2)}</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{product.description}</p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center text-yellow-500 text-sm">
                            <Star className="h-4 w-4 fill-current mr-1" />
                            <span>{product.rating.toFixed(1)}</span>
                          </div>
                          <Button disabled={product.stock === 0} className="rounded-full px-6 shadow-glow">
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Pagination */}
              {products && products.length > 0 && (
                <div className="mt-12 flex justify-center items-center space-x-2">
                  <Button 
                    variant="outline" 
                    disabled={page === 1}
                    onClick={() => updateFilters('page', (page - 1).toString())}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 font-medium">Page {page}</span>
                  <Button 
                    variant="outline"
                    disabled={products.length < ITEMS_PER_PAGE}
                    onClick={() => updateFilters('page', (page + 1).toString())}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
