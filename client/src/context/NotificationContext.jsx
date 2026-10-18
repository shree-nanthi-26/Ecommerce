import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationApi,
  clearAllNotificationsApi,
  createNotificationApi,
  seedDemoNotificationsApi,
} from "../services/notificationService";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.32);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [latestToast, setLatestToast] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("furniva_notif_sound") !== "false";
  });

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("furniva_notif_sound", String(next));
      return next;
    });
  }, []);

  // Fetch notifications
  const loadNotifications = useCallback(
    async (currentFilter = filter) => {
      try {
        setLoading(true);
        const data = await fetchNotifications({ filter: currentFilter, limit: 50 });
        if (data && data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(
            typeof data.unreadCount === "number"
              ? data.unreadCount
              : (data.notifications || []).filter((n) => !n.isRead).length
          );
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  // Reload when user or filter changes
  useEffect(() => {
    loadNotifications(filter);
  }, [user, filter, loadNotifications]);

  // Periodic polling & window focus sync (every 60s)
  useEffect(() => {
    const handleFocus = () => loadNotifications(filter);
    window.addEventListener("focus", handleFocus);

    const interval = setInterval(() => {
      loadNotifications(filter);
    }, 60000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [filter, loadNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id || n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await markNotificationAsRead(id);
      if (res && typeof res.unreadCount === "number") {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    let wasUnread = false;
    setNotifications((prev) => {
      const target = prev.find((n) => n._id === id || n.id === id);
      if (target && !target.isRead) wasUnread = true;
      return prev.filter((n) => n._id !== id && n.id !== id);
    });

    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      const res = await deleteNotificationApi(id);
      if (res && typeof res.unreadCount === "number") {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await clearAllNotificationsApi();
    } catch (err) {
      console.error("Error clearing all notifications:", err);
    }
  }, []);

  // Dispatch / add notification programmatically from anywhere in the app!
  const addNotification = useCallback(
    async ({ type, title, message, link, metadata }) => {
      try {
        const res = await createNotificationApi({
          type,
          title,
          message,
          link,
          metadata,
        });

        if (res && res.notification) {
          setNotifications((prev) => [res.notification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Toast preview
          setLatestToast(res.notification);

          // Audio chime
          if (soundEnabled) {
            playNotificationChime();
          }

          return res.notification;
        }
      } catch (err) {
        console.error("Error adding notification:", err);
      }
      return null;
    },
    [soundEnabled]
  );

  // Seed demo notifications (all 9 types)
  const seedDemoNotifications = useCallback(async () => {
    try {
      setLoading(true);
      await seedDemoNotificationsApi();
      await loadNotifications(filter);
      if (soundEnabled) {
        playNotificationChime();
      }
    } catch (err) {
      console.error("Error seeding notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, loadNotifications, soundEnabled]);

  const dismissToast = useCallback(() => {
    setLatestToast(null);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      filter,
      setFilter,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
      addNotification,
      seedDemoNotifications,
      refreshNotifications: () => loadNotifications(filter),
      latestToast,
      dismissToast,
      soundEnabled,
      toggleSound,
    }),
    [
      notifications,
      unreadCount,
      loading,
      filter,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
      addNotification,
      seedDemoNotifications,
      loadNotifications,
      latestToast,
      dismissToast,
      soundEnabled,
      toggleSound,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}

export default NotificationContext;
