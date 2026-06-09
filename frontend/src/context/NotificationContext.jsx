import React, { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState(null); // Real-time notification toast overlay state

  // 1. Fetch initial notifications from DB when user logs in
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || !token) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/interactions/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.isRead).length);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
  }, [user, token]);

  // 2. Setup WebSocket client connection
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = 'http://localhost:5000';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket.io connected to server. Registering user...');
      newSocket.emit('register', user._id);
    });

    newSocket.on('notification', (newNotification) => {
      console.log('Received real-time notification:', newNotification);
      
      // Prepend to list
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Trigger temporary toast overlay
      setToast({
        id: Date.now(),
        message: newNotification.message,
        senderName: newNotification.senderName || 'System',
        senderPicture: newNotification.senderPicture || '',
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Toast Auto-cleanup
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000); // Hide toast after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const markAsRead = async () => {
    if (!token) return;

    try {
      const res = await fetch('http://localhost:5000/api/interactions/notifications/read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, toast, setToast, socket }}>
      {children}
      
      {/* Toast Notification Alert Overlay */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce glass-panel p-4 rounded-xl flex items-center gap-3 border-rose-500/50 shadow-2xl max-w-sm">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {toast.senderPicture ? (
              <img src={toast.senderPicture.startsWith('/') ? `http://localhost:5000${toast.senderPicture}` : toast.senderPicture} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-rose-500 font-bold text-lg">{toast.senderName.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs text-rose-500 font-bold tracking-wide uppercase">New Notification</h4>
            <p className="text-sm text-slate-100 font-medium truncate">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)} 
            className="text-slate-400 hover:text-slate-200 text-sm font-semibold p-1"
          >
            ×
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
