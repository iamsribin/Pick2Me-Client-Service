import { axiosInstance } from "@/shared/services/axios/axiosInstance";

export const notificationApi = {
  // Mark a single notification as read
  markAsRead: async (notificationId: string) => {
    return await axiosInstance.patch(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return await axiosInstance.patch('/notifications/mark-all-read');
  },

  // Clear/delete a single notification
  clearNotification: async (notificationId: string) => {
    return await axiosInstance.delete(`/notifications/${notificationId}`);
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    return await axiosInstance.delete('/notifications/clear-all');
  },

  // Get all notifications (optional - for initial load)
  getNotifications: async () => {
    return await axiosInstance.get('/notifications');
  },

  // Get unread count (optional)
  getUnreadCount: async () => {
    return await axiosInstance.get('/notifications/unread-count');
  },
};