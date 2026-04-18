import { Link } from "react-router-dom";
import { useCheckout } from "../store/CheckoutContext";

const Navigation = () => {
  const { state } = useCheckout();
  const totalItems = Object.values(state.cart).reduce((sum, qty) => sum + qty, 0);

  const handleLogoClick = () => {
    if (state.status === 'ORDER_SUCCESS' || state.status === 'ORDER_FAILED' || state.status === 'ORDER_INCONSISTENT') {
      dispatch({ type: 'RESET_CHECKOUT' });
    }
  };

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        <Link to="/" className="font-bold text-lg tracking-tight hover:text-blue-400 transition-colors">
          SimpleShop
        </Link>
        <Link to="/cart" onClick={handleLogoClick} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full text-sm font-medium transition-colors">
          <span>Cart</span>
          <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">
            {totalItems}
          </span>
        </Link>
      </div>
    </nav>
  );
}
 
export default Navigation;