import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCheckout } from '../store/CheckoutContext';
import { saveProductSnapshot, db } from '../services/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { generateCartHash, generateIdempotencyKey } from '../utils/security.js';
import { fetchProducts } from '../services/api.js';

export default function CartPage() {
  const { state, dispatch } = useCheckout();
  const isLocked = state.status === 'LOCKED_BY_OTHER_TAB';
  const navigate = useNavigate();

  const [isValidating, setIsValidating] = useState(false);

  const productIdsInCart = Object.keys(state.cart);
  
  const dbProducts = useLiveQuery(
    () => {
      if (productIdsInCart.length === 0) return [];
      return db.product_snapshots.where('id').anyOf(productIdsInCart).toArray();
    },
    [state.cart]
  ) || [];

  const cartItems = useMemo(() => {
    return dbProducts.map(product => ({
      id: product.id,
      product: product,
      quantity: state.cart[product.id] || 0
    })).filter(item => item.quantity > 0);
  }, [state.cart, dbProducts]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [cartItems]);

  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const handleUpdateQuantity = useCallback(async (product, newQuantity) => {
    await saveProductSnapshot(product);
    
    dispatch({ 
      type: 'UPDATE_CART', 
      payload: { productId: product.id, quantity: newQuantity } 
    });
  }, [dispatch]);

  const handleProceedToCheckout = async () => {
    // Ensure cart isn't empty
    if (Object.keys(state.cart).length === 0) return;

    setIsValidating(true);
    try {
      const freshProducts = await fetchProducts();
      let isStale = false;

      // Compare our local DB snapshots against the fresh API data
      for (const localProduct of dbProducts) {
        
        // Because of dataset bloat, our local IDs look like "1-42". 
        // Extract the base ID (e.g., 1) to find the real product in the Fake Store API.
        const baseId = parseInt(String(localProduct.id).split('-')[0], 10);
        const freshProduct = freshProducts.find(p => p.id === baseId);

        // If the server price differs from our local DB price, the cart is stale
        if (freshProduct && freshProduct.price !== localProduct.price) {
          isStale = true;
          await saveProductSnapshot({ ...localProduct, price: freshProduct.price });
        }
      }

      if (isStale) {
        dispatch({
          type: 'ORDER_INCONSISTENT',
          payload: 'Some prices have changed since you added them. We have updated your cart with the latest prices. Please review.'
        });
        return;
      }
    } catch (error) {
      console.error("Failed to validate fresh snapshot:", error);
      dispatch({
        type: 'ORDER_INCONSISTENT',
        payload: 'We could not verify the current prices. Please check your connection and try again.'
      });
    } finally {
      setIsValidating(false); 
    }

    const idempotencyKey = generateIdempotencyKey();

    const cartHash = generateCartHash(state.cart, dbProducts);

    dispatch({ 
      type: 'VALIDATE_CHECKOUT', 
      payload: { idempotencyKey, cartHash } 
    });

    navigate('/checkout');
  };

  return (
    <div className="grow bg-slate-50 px-4 sm:px-6 py-8 pb-32 sm:pb-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Your Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
            <p className="text-slate-500 mb-4">Your cart is completely empty.</p>
            <Link to="/" className="inline-block bg-slate-900 text-white px-6 py-2 rounded-full font-medium hover:bg-slate-800 transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="grow flex flex-col gap-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-lg p-2 shrink-0">
                    <img src={item.product.image} alt={item.product.title} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="grow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm sm:text-base line-clamp-2">{item.product.title}</h3>
                      <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider">{item.product.category}</p>
                    </div>
                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="hidden sm:block text-lg font-bold text-slate-900 w-24 text-right">
                        ${item.product.price.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <button 
                          onClick={() => handleUpdateQuantity(item.product, item.quantity - 1)}
                          disabled={isLocked}
                          className={`w-8 h-8 flex items-center justify-center rounded-md shadow-sm ${isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-medium text-slate-800 text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.product, item.quantity + 1)}
                          disabled={isLocked}
                          className={`w-8 h-8 flex items-center justify-center rounded-md shadow-sm ${isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:w-80 shrink-0">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
                <div className="flex flex-col gap-3 text-sm text-slate-600 border-b border-slate-100 pb-4 mb-4">
                  <div className="flex justify-between"><span>Items ({totalItems}):</span><span className="font-medium text-slate-900">${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Shipping:</span><span className="text-green-600 font-medium">Free</span></div>
                  <div className="flex justify-between"><span>Estimated Tax (8%):</span><span className="font-medium text-slate-900">${(subtotal * 0.08).toFixed(2)}</span></div>
                </div>
                <div className="flex justify-between items-end mb-6">
                  <span className="font-bold text-slate-900">Total:</span>
                  <span className="text-2xl font-bold text-slate-900">${(subtotal * 1.08).toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleProceedToCheckout}
                  disabled={isLocked || isValidating}
                  className={`w-full py-3 rounded-xl font-bold shadow-sm transition-all flex justify-center items-center gap-2 ${(isLocked || isValidating) ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'}`}
                >
                  {isValidating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                      Verifying Prices...
                    </>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>

                {(state.status === 'ORDER_INCONSISTENT' || state.status === 'LOCKED_BY_OTHER_TAB') && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    ⚠️ {state.errorReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}