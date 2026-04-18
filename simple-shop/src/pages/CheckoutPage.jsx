import { useEffect, useState } from 'react'; // ADD useState
import { useNavigate, Link } from 'react-router-dom';
import { useCheckout, FSM_STATES } from '../store/CheckoutContext';
import OrderTimeline from '../components/OrderTimeline';

export default function CheckoutPage() {
  const { state, dispatch } = useCheckout();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleAcknowledgeAndReset = (destination) => {
    dispatch({ type: 'RESET_CHECKOUT' });
    navigate(destination);
  };

  const handleCopyDiagnosticInfo = async () => {
    const diagnosticData = {
      timestamp: new Date().toISOString(),
      status: state.status,
      errorReason: state.errorReason,
      orderRef: state.idempotencyKey,
      cartSnapshot: state.cart,
      userAgent: navigator.userAgent // Helpful for debugging browser-specific storage limits
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy diagnostic info:', err);
    }
  };

  useEffect(() => {
    if (state.status === FSM_STATES.CART_READY || state.status === FSM_STATES.ORDER_INCONSISTENT) {
      navigate('/cart');
    }
  }, [state.status, navigate]);

  const handleConfirmOrder = async () => {
    dispatch({ type: 'SUBMIT_ORDER' });

    try {
      // Generate a random number between 1 and 10 to simulate different network conditions
      const chaosRoll = Math.floor(Math.random() * 10) + 1; 

      // Timeout Simulation (20% chance)
      if (chaosRoll <= 2) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        throw new Error('TIMEOUT');
      }

      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({
          title: 'New Order',
          idempotencyKey: state.idempotencyKey,
          cartHash: state.cartHash,
          items: state.cart
        }),
      });

      if (!response.ok) throw new Error('NETWORK_FAILURE');
      
      const responseData = await response.json();

      // Partial/Invalid Response Simulation (20% chance)
      if (chaosRoll > 2 && chaosRoll <= 4) {
      await new Promise(resolve => setTimeout(resolve, 3000));
        delete responseData.id; 
      }

      if (!responseData || !responseData.id) {
        throw new Error('INVALID_PAYLOAD');
      }

      // Success (60% chance)
      await new Promise(resolve => setTimeout(resolve, 1500));

      dispatch({ type: 'ORDER_SUCCESS' });
      
    } catch (error) {
      // Route the specific simulated errors to the FSM
      let errorMessage = 'Payment gateway encountered an unknown error.';
      
      if (error.message === 'TIMEOUT') {
        errorMessage = 'The connection timed out. Please try your payment again (you will not be charged twice).';
      } else if (error.message === 'INVALID_PAYLOAD') {
        errorMessage = 'There was an issue processing your receipt. Please contact support.';
      } else if (error.message === 'NETWORK_FAILURE') {
        errorMessage = 'Unable to reach the payment provider. Please check your internet connection.';
      }

      dispatch({ type: 'ORDER_FAILED', payload: errorMessage });
    }
  };

  if (state.status === FSM_STATES.CART_READY) return null;

  return (
    <div className="grow overflow-y-auto bg-slate-50 px-4 sm:px-6 py-8">
      <div className="max-w-2xl mx-auto">
        
        {state.status === FSM_STATES.CHECKOUT_VALIDATED && (
          <button 
            onClick={() => handleAcknowledgeAndReset('/cart')}
            className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            ← Return to Cart
          </button>
        )}

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Secure Checkout</h1>
          <p className="text-slate-500 text-sm mb-8">Order Ref: {state.idempotencyKey}</p>

          <OrderTimeline currentStatus={state.status} />

          <div className="mt-12">
            {state.status === FSM_STATES.CHECKOUT_VALIDATED && (
              <div className="space-y-6">
                <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm">
                  ✓ Cart secured. Ready for payment.
                </div>
                <button 
                  onClick={handleConfirmOrder}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-md"
                >
                  Confirm & Pay
                </button>
              </div>
            )}

            {state.status === FSM_STATES.ORDER_SUBMITTED && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                Processing your order securely...
              </div>
            )}

            {state.status === FSM_STATES.ORDER_SUCCESS && (
              <div className="text-center space-y-6 py-8">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto">
                  ✓
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Order Confirmed!</h2>
                <p className="text-slate-500">Thank you for your purchase.</p>
                <button 
                  onClick={() => handleAcknowledgeAndReset('/')} 
                  className="inline-block mt-4 text-blue-600 font-medium hover:underline cursor-pointer"
                >
                  Return to Shop
                </button>
              </div>
            )}

            {(state.status === FSM_STATES.ORDER_FAILED || state.status === FSM_STATES.ORDER_INCONSISTENT) && (
              <div className="space-y-6">
                <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center">
                  <div className="text-3xl mb-2">⚠️</div>
                  <p className="font-bold mb-2">Checkout Failed</p>
                  <p className="text-sm mb-4 max-w-lg mx-auto">{state.errorReason}</p>
                  
                  {state.status === FSM_STATES.ORDER_FAILED ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button 
                        onClick={handleConfirmOrder} 
                        className="w-full sm:w-auto bg-slate-900 text-white px-6 py-2 rounded-full font-medium hover:bg-slate-800 transition-colors"
                      >
                        Retry Payment
                      </button>
                      <button 
                        onClick={() => handleAcknowledgeAndReset('/cart')} 
                        className="w-full sm:w-auto bg-white text-red-700 border border-red-200 px-6 py-2 rounded-full font-medium hover:bg-red-50 transition-colors"
                      >
                        Cancel & Review Cart
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleAcknowledgeAndReset('/cart')} 
                      className="inline-block bg-red-600 text-white px-6 py-2 rounded-full font-medium hover:bg-red-700 transition-colors"
                    >
                      Review Cart
                    </button>
                  )}
                </div>
                
                <div className="p-5 bg-slate-100 border border-slate-200 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 mb-3">Diagnostic Details (for Support)</p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <pre className="text-xs text-slate-600 bg-white p-3 rounded-md grow monospace break-all max-h-40 overflow-auto w-full sm:w-auto">
                      {`fsmStatus: ${state.status}\nidempotencyRef: ${state.idempotencyKey}\n${state.errorReason ? `errorReason: ${state.errorReason}\n` : ''}${Object.keys(state.cart).length > 0 ? `cartSnapshot: ${JSON.stringify(state.cart)}` : ''}`}
                    </pre>
                    <button
                      onClick={handleCopyDiagnosticInfo}
                      className="shrink-0 w-full sm:w-auto text-center px-4 py-1.5 border border-blue-200 text-blue-700 font-medium text-xs rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      {copied ? '✓ Copied!' : 'Copy Diagnostic Info'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div> 
    </div>
  );
}