import type { Notification } from '../../types'
import { 
  CheckSquare, 
  MessageSquare, 
  Calendar, 
  Bell,
  FileText,
  Video,
  ExternalLink,
  X
} from 'lucide-react'
import { formatDate } from '../../lib/utils'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { notificationService } from '../../services/notification.service'

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
  embedded?: boolean
}

export function NotificationCard({ 
  notification, 
  onMarkAsRead,
  onDelete,
  embedded = false 
}: NotificationCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  
  const getIcon = () => {
    switch (notification.type) {
      case 'task_assigned':
      case 'task_completed':
        return CheckSquare
      case 'task_commented':
        return MessageSquare
      case 'meeting_action_item':
        return Video
      case 'note_task_created':
        return FileText
      case 'task_due_soon':
        return Calendar
      default:
        return Bell
    }
  }

  const Icon = getIcon()

  const handleAction = async () => {
    if (notification.actionable && notification.resourceId) {
      // Navigate based on notification type
      switch (notification.type) {
        case 'task_assigned':
        case 'task_completed':
        case 'task_commented':
        case 'task_due_soon':
          await router.navigate({ to: '/tasks/$id', params: { id: notification.resourceId } })
          break
        case 'meeting_action_item':
          // In a real app, this would open WhisperrMeet
          console.log('Open meeting:', notification.resourceId)
          break
        case 'note_task_created':
          // In a real app, this would open WhisperrNote
          console.log('Open note:', notification.resourceId)
          break
      }
      
      // Mark as read when acted upon
      if (!notification.read && onMarkAsRead) {
        onMarkAsRead(notification.id)
      }
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      notificationService.deleteNotification(notification.id)
      if (onDelete) {
        onDelete(notification.id)
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      setIsDeleting(false)
    }
  }

  const getSourceColor = () => {
    switch (notification.sourceApp) {
      case 'whisperrtask': return 'bg-blue-600/20 text-blue-400'
      case 'whisperrnote': return 'bg-green-600/20 text-green-400'
      case 'whisperrmeet': return 'bg-purple-600/20 text-purple-400'
      case 'whisperrpass': return 'bg-yellow-600/20 text-yellow-400'
      default: return 'bg-gray-600/20 text-gray-400'
    }
  }

  return (
    <div
      className={`bg-gray-800/50 backdrop-blur border rounded-lg p-4 transition-all ${
        notification.read
          ? 'border-gray-700 opacity-60'
          : 'border-indigo-500/30 bg-indigo-900/10'
      } ${
        notification.actionable && !embedded ? 'cursor-pointer hover:border-indigo-500/50' : ''
      } ${
        isDeleting ? 'opacity-50' : ''
      }`}
      onClick={notification.actionable && !embedded ? handleAction : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${getSourceColor()}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-white font-medium">{notification.title}</h4>
            {!notification.read && (
              <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />
            )}
          </div>
          <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-500">
                {formatDate(notification.createdAt)}
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400 capitalize">
                {notification.sourceApp.replace('whisperr', '')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!notification.read && onMarkAsRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkAsRead(notification.id)
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Mark as read
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                  }}
                  disabled={isDeleting}
                  className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {notification.actionable && !embedded && (
                <ExternalLink className="w-3 h-3 text-gray-500" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
