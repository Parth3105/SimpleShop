import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const addNotification = useCallback((type, message, duration = 5000) => {
    setNotifications((prev) => {
      // REQUIREMENT: Deduplication Logic
      // If a notification with the exact same message is currently on screen, ignore it.
      if (prev.some((notif) => notif.message === message)) {
        return prev;
      }

      const id = crypto.randomUUID();
      const newNotification = { id, type, message };

      // REQUIREMENT: Auto-dismiss
      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return [newNotification, ...prev];
    });
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);