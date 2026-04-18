import { createContext, useReducer, useContext, useEffect, useState } from 'react';

export const FSM_STATES = {
  CART_READY: 'CART_READY',
  CHECKOUT_VALIDATED: 'CHECKOUT_VALIDATED',
  ORDER_SUBMITTED: 'ORDER_SUBMITTED',
  ORDER_SUCCESS: 'ORDER_SUCCESS',
  ORDER_FAILED: 'ORDER_FAILED',
  ORDER_INCONSISTENT: 'ORDER_INCONSISTENT',
  LOCKED_BY_OTHER_TAB: 'LOCKED_BY_OTHER_TAB'
};

const loadInitialState = () => {
  const savedFSM = sessionStorage.getItem('checkout_fsm');
  const savedCart = localStorage.getItem('simpleShop_cart_state');
  const parsedCart = savedCart ? JSON.parse(savedCart) : {};
  
  if (savedFSM) return { ...JSON.parse(savedFSM), cart: parsedCart };
  
  return {
    status: FSM_STATES.CART_READY,
    cart: parsedCart, 
    idempotencyKey: null,
    cartHash: null,
    errorReason: null,
  };
};

const checkoutReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_CART':
      // If locked by another tab, ignore the click entirely.
      if (state.status === FSM_STATES.LOCKED_BY_OTHER_TAB) return state;

      // If we are in the middle of checkout, throw inconsistency.
      if (state.status !== FSM_STATES.CART_READY && state.status !== FSM_STATES.ORDER_INCONSISTENT) {
        return { ...state, status: FSM_STATES.ORDER_INCONSISTENT, errorReason: 'You cannot modify the cart while a checkout is in progress.' };
      }
      
      const updatedCart = { ...state.cart };
      if (action.payload.quantity <= 0) {
        delete updatedCart[action.payload.productId];
      } else {
        updatedCart[action.payload.productId] = action.payload.quantity;
      }
      return { ...state, cart: updatedCart, status: FSM_STATES.CART_READY, errorReason: null };

    case 'RESET_CHECKOUT': {
      if (state.status !== FSM_STATES.ORDER_SUCCESS && 
          state.status !== FSM_STATES.ORDER_FAILED && 
          state.status !== FSM_STATES.ORDER_INCONSISTENT) {
        return state;
      }

      return {
        ...state,
        status: FSM_STATES.CART_READY,
        cart: state.status === FSM_STATES.ORDER_SUCCESS ? {} : state.cart,
        idempotencyKey: null,
        cartHash: null,
        tokenExpiresAt: null,
        errorReason: null
      };
    }

    case 'SYNC_CART':
      if (state.status === FSM_STATES.LOCKED_BY_OTHER_TAB) return state;
      if (state.status !== FSM_STATES.CART_READY && state.status !== FSM_STATES.ORDER_INCONSISTENT) return state;
      return { ...state, cart: action.payload, status: FSM_STATES.CART_READY, errorReason: null };

    case 'VALIDATE_CHECKOUT':
      return { ...state, status: FSM_STATES.CHECKOUT_VALIDATED, ...action.payload, errorReason: null };

    case 'LOCK_ACQUIRED_BY_OTHER':
      return { ...state, status: FSM_STATES.LOCKED_BY_OTHER_TAB, errorReason: 'Checkout is currently open in another tab.' };

    case 'LOCK_RELEASED_BY_OTHER':
      return { ...state, status: FSM_STATES.CART_READY, errorReason: null };

    case 'SUBMIT_ORDER':
      if (state.status !== FSM_STATES.CHECKOUT_VALIDATED && state.status !== FSM_STATES.ORDER_FAILED) return state;
      return { ...state, status: FSM_STATES.ORDER_SUBMITTED, errorReason: null };

    case 'PERSISTENCE_FAILURE':
      return {
        ...state,
        status: FSM_STATES.ORDER_INCONSISTENT,
        idempotencyKey: null, 
        cartHash: null,
        errorReason: 'Browser storage is disabled or full. We cannot securely process your order.'
      };

    case 'ORDER_SUCCESS':
      if (state.status !== FSM_STATES.ORDER_SUBMITTED) return state;
      return { ...state, status: FSM_STATES.ORDER_SUCCESS, cart: {} };

    case 'ORDER_FAILED':
      if (state.status !== FSM_STATES.ORDER_SUBMITTED) return state;
      return { ...state, status: FSM_STATES.ORDER_FAILED, errorReason: action.payload };

    case 'ORDER_INCONSISTENT':
      return { 
        ...state, 
        status: FSM_STATES.ORDER_INCONSISTENT, 
        errorReason: action.payload || 'An inconsistency was detected.' 
      };

    default:
      return state;
  }
};

const CheckoutContext = createContext();

export const CheckoutProvider = ({ children }) => {
  const [state, dispatch] = useReducer(checkoutReducer, null, loadInitialState);
  
  const [tabId] = useState(() => crypto.randomUUID());

  // Preserve FSM to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('checkout_fsm', JSON.stringify({
        status: state.status,
        idempotencyKey: state.idempotencyKey,
        cartHash: state.cartHash,
        tokenExpiresAt: state.tokenExpiresAt,
        errorReason: state.errorReason
      }));
    } catch (error) {
      console.error("Storage write failed:", error);
      
      if (state.status !== FSM_STATES.ORDER_INCONSISTENT) {
        dispatch({ 
          type: 'PERSISTENCE_FAILURE', 
          payload: 'Critical System Error: Browser storage is full or disabled. We cannot safely secure your checkout session.' 
        });
      }
    }
  }, [state.status, state.idempotencyKey, state.cartHash, state.tokenExpiresAt, state.errorReason]);

  // Sync Cart to localStorage
  useEffect(() => {
    const currentStorageCart = localStorage.getItem('simpleShop_cart_state');
    const newStateCartStr = JSON.stringify(state.cart);
    // Prevent infinite loops: only write if the data actually changed
    if (currentStorageCart !== newStateCartStr) {
      localStorage.setItem('simpleShop_cart_state', newStateCartStr);
    }
  }, [state.cart]);

  // Handles Multi-tab locking
  useEffect(() => {
    const isCheckingOut = state.status === FSM_STATES.CHECKOUT_VALIDATED || state.status === FSM_STATES.ORDER_SUBMITTED;
    
    if (isCheckingOut) {
      localStorage.setItem('simpleShop_checkout_lock', tabId);
    } else if (state.status === FSM_STATES.ORDER_SUCCESS || state.status === FSM_STATES.CART_READY) {
      // Only release the lock if WE are the ones who own it
      if (localStorage.getItem('simpleShop_checkout_lock') === tabId) {
        localStorage.removeItem('simpleShop_checkout_lock');
      }
    }
  }, [state.status, tabId]);

  // Cross-Tab Listener
  useEffect(() => {
    const handleStorage = (e) => {
      // Live cart syncing
      if (e.key === 'simpleShop_cart_state') {
        dispatch({ type: 'SYNC_CART', payload: JSON.parse(e.newValue || '{}') });
      }
      // Foreign Lock tracking
      if (e.key === 'simpleShop_checkout_lock') {
        const activeLock = e.newValue;
        if (activeLock && activeLock !== tabId) {
          dispatch({ type: 'LOCK_ACQUIRED_BY_OTHER' });
        } else if (!activeLock) {
          if (state.status === FSM_STATES.LOCKED_BY_OTHER_TAB) {
            dispatch({ type: 'LOCK_RELEASED_BY_OTHER' });
          }
        }
      }
    };

    const existingLock = localStorage.getItem('simpleShop_checkout_lock');
    if (existingLock && existingLock !== tabId && state.status !== FSM_STATES.CHECKOUT_VALIDATED) {
      dispatch({ type: 'LOCK_ACQUIRED_BY_OTHER' });
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [tabId, state.status]);

  // Release lock when another tab closes.
  useEffect(() => {
    const handleUnload = () => {
      if (localStorage.getItem('simpleShop_checkout_lock') === tabId) {
        localStorage.removeItem('simpleShop_checkout_lock');
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [tabId]);

  return (
    <CheckoutContext.Provider value={{ state, dispatch }}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => useContext(CheckoutContext);