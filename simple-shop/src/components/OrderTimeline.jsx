import { FSM_STATES } from '../store/CheckoutContext';

export default function OrderTimeline({ currentStatus }) {
  const steps = [
    { id: 1, name: 'Cart Ready', activeStates: [FSM_STATES.CART_READY] },
    { id: 2, name: 'Validated', activeStates: [FSM_STATES.CHECKOUT_VALIDATED] },
    { id: 3, name: 'Processing', activeStates: [FSM_STATES.ORDER_SUBMITTED] },
    { id: 4, name: 'Complete', activeStates: [FSM_STATES.ORDER_SUCCESS, FSM_STATES.ORDER_FAILED] },
  ];

  const currentStepIndex = steps.findIndex(step => step.activeStates.includes(currentStatus));
  const isFailed = currentStatus === FSM_STATES.ORDER_FAILED || currentStatus === FSM_STATES.ORDER_INCONSISTENT;

  return (
    <div className="py-6 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 relative">
        <div className="hidden sm:block absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-slate-200 z-0 rounded-full"></div>
        
        <div 
          className={`hidden sm:block absolute top-1/2 left-0 h-1 -translate-y-1/2 z-0 rounded-full transition-all duration-500 ${isFailed ? 'bg-red-500' : 'bg-blue-600'}`}
          style={{ width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%` }}
        ></div>

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          let bgColor = 'bg-slate-200 text-slate-500';
          let ringColor = 'ring-slate-100';

          if (isCompleted) {
            bgColor = 'bg-blue-600 text-white';
          } else if (isCurrent) {
            bgColor = isFailed ? 'bg-red-500 text-white' : 'bg-blue-600 text-white';
            ringColor = isFailed ? 'ring-red-100' : 'ring-blue-100';
          }

          return (
            <div key={step.id} className="relative z-10 flex items-center gap-3 sm:flex-col sm:gap-2 bg-white sm:bg-transparent pr-4 sm:pr-0">
              {index !== steps.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-full bg-slate-200 sm:hidden z-[-1]"></div>
              )}
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ring-4 ${bgColor} ${isCurrent ? ringColor : 'ring-transparent'}`}>
                {isCompleted ? '✓' : step.id}
              </div>
              <span className={`text-sm font-medium ${isCurrent || isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}