import type { Notification } from '../../types'
import { CheckSquare, MessageSquare, Calendar, Bell } from 'lucide-react'
import { formatDate } from '../../lib/utils'

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
}

export function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'task_assigned':
      case 'task_completed':
        return CheckSquare
      case 'task_commented':
        return MessageSquare
      case 'meeting_action_item':
        return Calendar
      default:
        return Bell
    }
  }

  const Icon = getIcon()

  return (
    <div
      className={`bg-gray-800/50 backdrop-blur border rounded-lg p-4 transition-all ${
        notification.read
          ? 'border-gray-700 opacity-60'
          : 'border-indigo-500/30 bg-indigo-900/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-600/20 rounded-lg">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-white font-medium">{notification.title}</h4>
            {!notification.read && (
              <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />
            )}
          </div>
          <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {formatDate(notification.createdAt)}
            </span>
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
