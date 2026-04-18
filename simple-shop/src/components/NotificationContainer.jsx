// src/components/NotificationContainer.jsx
import { useNotification } from '../store/NotificationContext';

const typeStyles = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

const typeIcons = {
  success: '✓',
  error: '✖',
  warning: '⚠️',
  info: 'ℹ',
};

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    // REQUIREMENT: Accessible announcements (ARIA live region)
    <div 
      aria-live="polite" 
      aria-atomic="true"
      // FIX: Positioned Top-Center (Mobile) and Top-Right (Desktop)
      className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-100 flex flex-col gap-3 pointer-events-none sm:max-w-sm"
    >
      {notifications.map(({ id, type, message }) => (
        <div
          key={id}
          // FIX: Upgraded shadows (shadow-xl) and border radius (rounded-xl) for better separation from the background
          className={`pointer-events-auto flex items-start p-4 rounded-xl border shadow-xl transition-all transform duration-300 ease-in-out ${typeStyles[type]}`}
          role="alert"
        >
          <div className="shrink-0 font-bold mr-3 mt-0.5">
            {typeIcons[type]}
          </div>
          <div className="flex-1 text-sm font-medium mr-2 leading-relaxed">
            {message}
          </div>
          {/* REQUIREMENT: Manual dismiss */}
          <button
            onClick={() => removeNotification(id)}
            // FIX: Added a subtle hover background to the close button for better touch feedback
            className="shrink-0 ml-2 opacity-50 hover:opacity-100 transition-opacity focus:outline-none p-1 rounded-md hover:bg-black/5"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}