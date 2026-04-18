import { Routes, Route, useLocation } from 'react-router-dom';
import ProductFeed from './pages/ProductFeed';
import Navigation from './components/Navigation';
import { CheckoutProvider } from './store/CheckoutContext';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import NotificationContainer from './components/NotificationContainer';
import { NotificationProvider } from './store/NotificationContext';

function App() {

  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';

  return (
    <NotificationProvider>
      <CheckoutProvider>
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
          {!isCheckout && <Navigation />}
          <div className="grow flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<ProductFeed />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Routes>
          </div>
        </div>
      </CheckoutProvider>
      <NotificationContainer />
    </NotificationProvider>
  );
}

export default App;