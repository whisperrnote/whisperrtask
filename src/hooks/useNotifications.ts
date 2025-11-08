import { useState, useEffect } from 'react'
import type { Notification } from '../types'
import { apiClient } from '../api/client'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getNotifications()
        setNotifications(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const markAsRead = async (id: string) => {
    await apiClient.markNotificationRead(id)
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return { 
    notifications, 
    loading, 
    error, 
    markAsRead,
    unreadCount,
    refetch: () => {} 
  }
}
