import { create } from 'zustand'
import api from '../services/api'

export const useNotificationsStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (params = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await api.get('/notifications', { params })
      set({ notifications: response.data.data, isLoading: false })
      return response.data.data
    } catch (error) {
      set({ error: error.response?.data?.message || 'خطأ في جلب الإشعارات', isLoading: false })
      throw error
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count')
      set({ unreadCount: response.data.data.count })
      return response.data.data.count
    } catch (error) {
      console.error('Fetch unread count error:', error)
      return 0
    }
  },

  markAsRead: async (id) => {
    await api.put(`/notifications/${id}/read`)
    
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }))
  },

  markAllAsRead: async () => {
    await api.put('/notifications/read-all')
    
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0
    }))
  },

  deleteNotification: async (id) => {
    await api.delete(`/notifications/${id}`)
    
    set((state) => ({
      notifications: state.notifications.filter((n) => n._id !== id)
    }))
  },

  clearNotifications: async () => {
    await api.delete('/notifications')
    set({ notifications: [], unreadCount: 0 })
  },

  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),

  setNotifications: (notifications) => set({ notifications }),
}))
