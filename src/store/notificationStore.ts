import { create } from 'zustand'

export interface Notification {
  id: string
  type: 'task' | 'meeting' | 'note' | 'system'
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: Record<string, any>
}

interface NotificationState {
  notifications: Notification[]
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  removeNotification: (id: string) => void
  getUnreadCount: () => number
  setNotifications: (notifications: Notification[]) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  getUnreadCount: () =>
    get().notifications.filter((n) => !n.read).length,
  setNotifications: (notifications) => set({ notifications }),
}))
