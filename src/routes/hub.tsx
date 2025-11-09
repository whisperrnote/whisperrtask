import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { 
  Inbox, 
  Bell, 
  Filter, 
  CheckCircle,
  Archive,
  RefreshCw
} from 'lucide-react'
import { notificationService } from '../services/notification.service'
import { NotificationCard } from '../components/hub/NotificationCard'
import type { Notification } from '../types'

export const Route = createFileRoute('/hub')({ component: HubPage })

function HubPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionable'>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Load notifications on mount and subscribe to updates
  useEffect(() => {
    loadNotifications()
    
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications)
    })
    
    return () => unsubscribe()
  }, [])

  // Apply filters when notifications or filter changes
  useEffect(() => {
    let filtered = [...notifications]
    
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.read)
        break
      case 'actionable':
        filtered = filtered.filter(n => n.actionable)
        break
    }
    
    setFilteredNotifications(filtered)
  }, [notifications, filter])

  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications()
    setNotifications(allNotifications)
  }

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead()
  }

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    // Simulate refresh - in production this would fetch from server
    setTimeout(() => {
      loadNotifications()
      setIsLoading(false)
    }, 1000)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Whisperr Hub
              {unreadCount > 0 && (
                <span className="ml-3 px-2 py-1 bg-indigo-600 text-white text-sm rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-gray-400">
              Unified inbox across your entire ecosystem
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Filter buttons */}
            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg">
              {(['all', 'unread', 'actionable'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-sm ${
                    filter === f
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white'
                  } transition-colors first:rounded-l-lg last:rounded-r-lg capitalize`}
                >
                  {f}
                </button>
              ))}
            </div>
            
            {/* Actions */}
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors border border-gray-700"
            >
              <CheckCircle size={20} />
              <span>Mark all read</span>
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors border border-gray-700"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            <>
              {filteredNotifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
              
              {filteredNotifications.length > 10 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">
                    Showing {filteredNotifications.length} notifications
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-8">
              <div className="text-center py-12">
                <Inbox className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  {filter === 'all' 
                    ? 'All caught up'
                    : filter === 'unread'
                    ? 'No unread notifications'
                    : 'No actionable notifications'
                  }
                </h3>
                <p className="text-gray-500">
                  {filter === 'all'
                    ? 'You have no notifications from WhisperrTask, WhisperrNote, WhisperrMeet, or WhisperrPass'
                    : 'Try changing your filter to see more notifications'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 p-6 bg-indigo-600/10 border border-indigo-500/30 rounded-xl">
          <div className="flex items-start gap-4">
            <Bell className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-white font-semibold mb-1">
                Actionable Notifications
              </h4>
              <p className="text-gray-400 text-sm mb-3">
                Notifications in the Hub are not just links - they're actionable UI components. 
                Complete tasks, respond to comments, or reschedule meetings directly from here.
              </p>
              <div className="flex gap-3 text-xs">
                <button
                  onClick={() => {
                    // Demo: Create a notification from WhisperrNote
                    ;(window as any).__whisperr?.demo?.createTaskFromNote?.()
                  }}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                >
                  Demo: Task from Note
                </button>
                <button
                  onClick={() => {
                    // Demo: Create a notification from WhisperrMeet
                    ;(window as any).__whisperr?.demo?.createTaskFromMeeting?.()
                  }}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                >
                  Demo: Action from Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
