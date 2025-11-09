import type { Notification } from '../types'
import type { EcosystemEvent } from '../types/events'
import { ecosystemBridge } from '../lib/ecosystem-bridge'
import { EVENT_TYPES } from '../lib/event-schemas'

export interface CreateNotificationInput {
  type: Notification['type']
  sourceApp: Notification['sourceApp']
  resourceId: string
  title: string
  message: string
  actionable?: boolean
  metadata?: Record<string, any>
}

export class NotificationService {
  private static instance: NotificationService
  private notifications: Map<string, Notification> = new Map()
  private subscribers: Set<(notifications: Notification[]) => void> = new Set()

  private constructor() {
    this.setupEventHandlers()
    this.loadPersistedData()
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  createNotification(input: CreateNotificationInput): Notification {
    const notification: Notification = {
      id: this.generateId(),
      userId: this.getCurrentUserId(),
      type: input.type,
      sourceApp: input.sourceApp,
      resourceId: input.resourceId,
      title: input.title,
      message: input.message,
      actionable: input.actionable || false,
      read: false,
      createdAt: new Date(),
    }

    this.notifications.set(notification.id, notification)
    this.persistNotifications()
    this.notifySubscribers()

    // Emit notification created event
    ecosystemBridge.emit({
      type: EVENT_TYPES.NOTIFICATION_CREATED,
      source: 'whisperrtask',
      version: '1.0',
      payload: notification,
      metadata: {
        userId: this.getCurrentUserId(),
        priority: 'normal',
      },
    })

    // Also broadcast to ecosystem for cross-app notifications
    ecosystemBridge.broadcastToEcosystem({
      id: this.generateId(),
      type: EVENT_TYPES.NOTIFICATION_CREATED,
      source: 'whisperrtask',
      version: '1.0',
      timestamp: Date.now(),
      payload: notification,
      metadata: {
        userId: this.getCurrentUserId(),
      },
    })

    return notification
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId)
    if (notification && !notification.read) {
      notification.read = true
      this.notifications.set(notificationId, notification)
      this.persistNotifications()
      this.notifySubscribers()
    }
  }

  markAllAsRead(): void {
    let changed = false
    for (const notification of this.notifications.values()) {
      if (!notification.read) {
        notification.read = true
        changed = true
      }
    }
    
    if (changed) {
      this.persistNotifications()
      this.notifySubscribers()
    }
  }

  deleteNotification(notificationId: string): void {
    if (this.notifications.delete(notificationId)) {
      this.persistNotifications()
      this.notifySubscribers()
    }
  }

  getNotifications(filter?: {
    read?: boolean
    sourceApp?: Notification['sourceApp']
    type?: Notification['type']
    limit?: number
  }): Notification[] {
    let notifications = Array.from(this.notifications.values())

    if (filter) {
      if (filter.read !== undefined) {
        notifications = notifications.filter(n => n.read === filter.read)
      }
      if (filter.sourceApp) {
        notifications = notifications.filter(n => n.sourceApp === filter.sourceApp)
      }
      if (filter.type) {
        notifications = notifications.filter(n => n.type === filter.type)
      }
    }

    // Sort by date, newest first
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    if (filter?.limit) {
      notifications = notifications.slice(0, filter.limit)
    }

    return notifications
  }

  getUnreadCount(): number {
    return Array.from(this.notifications.values()).filter(n => !n.read).length
  }

  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.subscribers.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback)
    }
  }

  private notifySubscribers(): void {
    const notifications = this.getNotifications()
    for (const subscriber of this.subscribers) {
      subscriber(notifications)
    }
  }

  private setupEventHandlers(): void {
    // Handle task events
    ecosystemBridge.subscribe(EVENT_TYPES.TASK_ASSIGNED, (event) => {
      const { taskId, taskTitle, assigneeName, assignedBy } = event.payload
      this.createNotification({
        type: 'task_assigned',
        sourceApp: 'whisperrtask',
        resourceId: taskId,
        title: 'New Task Assigned',
        message: `${assignedBy} assigned you "${taskTitle}"`,
        actionable: true,
      })
    })

    ecosystemBridge.subscribe(EVENT_TYPES.TASK_COMPLETED, (event) => {
      const { taskId, taskTitle, completedBy } = event.payload
      this.createNotification({
        type: 'task_completed',
        sourceApp: 'whisperrtask',
        resourceId: taskId,
        title: 'Task Completed',
        message: `${completedBy} completed "${taskTitle}"`,
        actionable: false,
      })
    })

    ecosystemBridge.subscribe(EVENT_TYPES.TASK_COMMENT_ADDED, (event) => {
      const { taskId, taskTitle, commenterName, mentions } = event.payload
      
      // Notify mentioned users
      for (const userId of mentions || []) {
        this.createNotification({
          type: 'task_commented',
          sourceApp: 'whisperrtask',
          resourceId: taskId,
          title: 'Mentioned in Comment',
          message: `${commenterName} mentioned you in "${taskTitle}"`,
          actionable: true,
        })
      }
    })

    // Handle meeting action items
    ecosystemBridge.subscribe(EVENT_TYPES.MEET_ACTION_ITEM_DETECTED, (event) => {
      const { meetingTitle, actionItem } = event.payload
      this.createNotification({
        type: 'meeting_action_item',
        sourceApp: 'whisperrmeet',
        resourceId: event.payload.meetingId,
        title: 'New Action Item from Meeting',
        message: `Action item detected in "${meetingTitle}": ${actionItem}`,
        actionable: true,
      })
    })

    // Handle note task creation
    ecosystemBridge.subscribe(EVENT_TYPES.NOTE_TASK_CREATED, (event) => {
      const { noteTitle, checkboxText } = event.payload
      this.createNotification({
        type: 'note_task_created',
        sourceApp: 'whisperrnote',
        resourceId: event.payload.noteId,
        title: 'Task Created from Note',
        message: `New task from "${noteTitle}": ${checkboxText}`,
        actionable: true,
      })
    })

    // Handle cross-app notifications
    ecosystemBridge.subscribe(EVENT_TYPES.NOTIFICATION_CREATED, (event) => {
      if (event.source !== 'whisperrtask') {
        // Create local copy of notification from other apps
        const notification = event.payload as Notification
        if (notification.userId === this.getCurrentUserId()) {
          this.notifications.set(notification.id, {
            ...notification,
            createdAt: new Date(notification.createdAt),
          })
          this.notifySubscribers()
        }
      }
    })
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentUserId(): string {
    // In production, this would come from auth context
    return 'current-user-id'
  }

  private persistNotifications(): void {
    if (typeof window !== 'undefined') {
      const data = Array.from(this.notifications.entries())
      // Only keep notifications from last 30 days
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 30)
      
      const filtered = data.filter(([_, notif]) => 
        notif.createdAt > cutoffDate
      )
      
      localStorage.setItem('whisperrtask_notifications', JSON.stringify(filtered))
    }
  }

  private loadPersistedData(): void {
    if (typeof window === 'undefined') return

    try {
      const data = localStorage.getItem('whisperrtask_notifications')
      if (data) {
        const parsed = JSON.parse(data)
        this.notifications = new Map(parsed.map(([id, notif]: [string, any]) => [
          id,
          {
            ...notif,
            createdAt: new Date(notif.createdAt),
          },
        ]))
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }
}

export const notificationService = NotificationService.getInstance()