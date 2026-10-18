import axiosInstance from "../api/axiosInstance";
import { SAMPLE_NOTIFICATIONS } from "../utils/notificationTypes";

const STORAGE_KEY = "furniva_guest_notifications";

function getLocalNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalNotifications(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Local notification storage error:", err);
  }
}

export async function fetchNotifications(params = {}) {
  try {
    const response = await axiosInstance.get("/notifications", { params });
    return response.data;
  } catch (err) {
    // Guest or offline fallback
    const all = getLocalNotifications();
    let filtered = [...all];
    if (params.filter === "unread") {
      filtered = filtered.filter((n) => !n.isRead);
    } else if (params.filter && params.filter !== "all") {
      filtered = filtered.filter((n) => n.type === params.filter);
    }
    const unreadCount = all.filter((n) => !n.isRead).length;
    return {
      success: true,
      notifications: filtered,
      unreadCount,
      total: filtered.length,
    };
  }
}

export async function fetchUnreadCount() {
  try {
    const response = await axiosInstance.get("/notifications/unread-count");
    return response.data.unreadCount;
  } catch {
    const all = getLocalNotifications();
    return all.filter((n) => !n.isRead).length;
  }
}

export async function markNotificationAsRead(id) {
  try {
    const response = await axiosInstance.put(`/notifications/${id}/read`);
    return response.data;
  } catch {
    const all = getLocalNotifications();
    const updated = all.map((n) =>
      n._id === id || n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
    );
    saveLocalNotifications(updated);
    const unreadCount = updated.filter((n) => !n.isRead).length;
    return {
      success: true,
      notification: updated.find((n) => n._id === id || n.id === id),
      unreadCount,
    };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const response = await axiosInstance.put("/notifications/read-all");
    return response.data;
  } catch {
    const all = getLocalNotifications();
    const now = new Date().toISOString();
    const updated = all.map((n) => ({ ...n, isRead: true, readAt: now }));
    saveLocalNotifications(updated);
    return { success: true, unreadCount: 0 };
  }
}

export async function deleteNotificationApi(id) {
  try {
    const response = await axiosInstance.delete(`/notifications/${id}`);
    return response.data;
  } catch {
    const all = getLocalNotifications();
    const filtered = all.filter((n) => n._id !== id && n.id !== id);
    saveLocalNotifications(filtered);
    const unreadCount = filtered.filter((n) => !n.isRead).length;
    return { success: true, unreadCount };
  }
}

export async function clearAllNotificationsApi() {
  try {
    const response = await axiosInstance.delete("/notifications");
    return response.data;
  } catch {
    saveLocalNotifications([]);
    return { success: true, unreadCount: 0 };
  }
}

export async function createNotificationApi(data) {
  try {
    const response = await axiosInstance.post("/notifications", data);
    return response.data;
  } catch {
    const all = getLocalNotifications();
    const newNotif = {
      _id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newNotif, ...all];
    saveLocalNotifications(updated);
    const unreadCount = updated.filter((n) => !n.isRead).length;
    return { success: true, notification: newNotif, unreadCount };
  }
}

export async function seedDemoNotificationsApi() {
  try {
    const response = await axiosInstance.post("/notifications/demo-seed");
    return response.data;
  } catch {
    // Local fallback for guest demo seed
    const mockList = SAMPLE_NOTIFICATIONS.map((item, idx) => ({
      _id: `guest_demo_${Date.now()}_${idx}`,
      ...item,
      isRead: idx > 6, // 7 unread, 2 read
      createdAt: new Date(Date.now() - idx * 25 * 60 * 1000).toISOString(),
    }));
    saveLocalNotifications(mockList);
    const unreadCount = mockList.filter((n) => !n.isRead).length;
    return { success: true, count: mockList.length, unreadCount };
  }
}
