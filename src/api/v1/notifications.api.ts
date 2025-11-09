import { eventHandler, getQuery, readBody, createError } from '@tanstack/nitro-v2-vite-plugin'
import { notificationService } from '../../services/notification.service'
import type { Notification } from '../../types'

// GET /api/v1/notifications
export const getNotifications = eventHandler(async (event) => {
  const query = getQuery(event)
  
  const filter = {
    read: query.read === 'true' ? true : query.read === 'false' ? false : undefined,
    sourceApp: query.sourceApp as Notification['sourceApp'] | undefined,
    type: query.type as Notification['type'] | undefined,
    limit: query.limit ? parseInt(query.limit as string) : undefined,
  }

  const notifications = notificationService.getNotifications(filter)
  const unreadCount = notificationService.getUnreadCount()
  
  return {
    data: notifications,
    meta: {
      total: notifications.length,
      unreadCount,
      timestamp: new Date().toISOString(),
    },
  }
})

// POST /api/v1/notifications/:id/read
export const markNotificationAsRead = eventHandler(async (event) => {
  const notificationId = event.context.params?.id as string
  
  if (!notificationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Notification ID is required',
    })
  }

  notificationService.markAsRead(notificationId)
  
  return {
    meta: {
      message: 'Notification marked as read',
    },
  }
})

// POST /api/v1/notifications/read-all
export const markAllNotificationsAsRead = eventHandler(async (event) => {
  notificationService.markAllAsRead()
  
  return {
    meta: {
      message: 'All notifications marked as read',
    },
  }
})

// DELETE /api/v1/notifications/:id
export const deleteNotification = eventHandler(async (event) => {
  const notificationId = event.context.params?.id as string
  
  if (!notificationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Notification ID is required',
    })
  }

  notificationService.deleteNotification(notificationId)
  
  return {
    meta: {
      message: 'Notification deleted',
    },
  }
})