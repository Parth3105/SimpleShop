// src/pages/ProductFeed.jsx
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { fetchProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import useDebounce from '../hooks/useDebounce';
import { useCheckout } from '../store/CheckoutContext';
import { saveProductSnapshot } from '../services/db.js';

export default function ProductFeed() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [isLoading, setIsLoading] = useState(true);

  const { state, dispatch } = useCheckout();
  const cart = state.cart;

  // Debounce: Wait 300ms.
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const baseProducts = await fetchProducts();
      
      const bloatedDataset = Array.from({ length: 50 }).flatMap((_, index) => 
        baseProducts.map(item => ({
          ...item,
          id: `${item.id}-${index}` 
        }))
      );
      
      setProducts(bloatedDataset);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const categories = useMemo(() => {
    return ['all', ...new Set(products.map(p => p.category))];
  }, [products]);

  const processedProducts = useMemo(() => {
    return products
      .filter(product => {
        return product.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      })
      .filter(product => {
        return selectedCategory === 'all' || product.category === selectedCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating-desc') return b.rating.rate - a.rating.rate;
        if (sortBy === 'rating-asc') return a.rating.rate - b.rating.rate;
        if (sortBy === 'name-asc') return a.title.localeCompare(b.title);
        if (sortBy === 'name-desc') return b.title.localeCompare(a.title);
        return 0;
      });
  }, [products, debouncedSearchQuery, selectedCategory, sortBy]);

  const handleUpdateQuantity = useCallback(async (product, newQuantity) => {
    await saveProductSnapshot(product);
    
    dispatch({ 
      type: 'UPDATE_CART', 
      payload: { productId: product.id, quantity: newQuantity } 
    });
  }, [dispatch]);

  // Virtualization: Setup the scroll container and virtualizer
  const scrollContainerRef = useRef(null);
  
  const rowVirtualizer = useVirtualizer({
    count: processedProducts.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 160, // Estimated pixel height of each card on mobile
    overscan: 5, // Render 5 items outside the visible window to prevent flickering when scrolling fast
  });

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <header className="shrink-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6 shadow-sm">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              placeholder="Search 1,000 products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="grow pl-4 pr-4 py-2 bg-slate-100 border-transparent rounded-lg sm:rounded-full text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
            
            <div className="flex gap-2">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-1/2 sm:w-auto px-3 py-2 bg-slate-100 border-transparent rounded-lg sm:rounded-full text-sm focus:bg-white outline-none cursor-pointer capitalize"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-1/2 sm:w-auto px-3 py-2 bg-slate-100 border-transparent rounded-lg sm:rounded-full text-sm focus:bg-white outline-none cursor-pointer"
              >
                <option value="default">Sort by...</option>
                <option value="rating-desc">Rating: High to Low</option>
                <option value="rating-asc">Rating: Low to High</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main 
        ref={scrollContainerRef}
        className="grow overflow-y-auto px-4 sm:px-6 pt-6 pb-20 sm:pb-8 w-full"
      >
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-20 text-slate-500">Loading massive dataset...</div>
          ) : (
            <>
              <div className="text-sm text-slate-500 mb-4">
                Showing {processedProducts.length} items
              </div>
              
              {/* Virtualized List Container */}
              <div 
                className="w-full relative"
                style={{ 
                  height: `${rowVirtualizer.getTotalSize()}px` 
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const product = processedProducts[virtualItem.index];
                  return (
                    <div
                      key={virtualItem.key}
                      className="absolute top-0 left-0 w-full pb-4"
                      style={{
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualItem.index}
                    >
                      <ProductCard 
                        product={product} 
                        quantity={cart[product.id]}
                        onUpdateQuantity={handleUpdateQuantity}
                      />
                    </div>
                  );
                })}
              </div>

              {processedProducts.length === 0 && (
                <div className="text-center py-20 text-slate-500">No products found.</div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}