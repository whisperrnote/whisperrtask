import type { Task, ContextLink } from '../../types'
import { 
  CheckSquare, 
  Circle, 
  Clock, 
  FileText, 
  Video, 
  Key,
  AlertCircle,
  Users,
  Link,
  Sparkles
} from 'lucide-react'
import { formatDate, getDueDateColor } from '../../lib/utils'
import { useState } from 'react'
import { taskService } from '../../services/task.service'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  onStatusChange?: (task: Task) => void
  showContext?: boolean
}

export function TaskCard({ 
  task, 
  onClick, 
  onStatusChange,
  showContext = true 
}: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const StatusIcon = task.status === 'completed' ? CheckSquare : Circle

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsUpdating(true)
    
    try {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed'
      const updatedTask = await taskService.updateTask(task.id, { status: newStatus })
      if (updatedTask && onStatusChange) {
        onStatusChange(updatedTask)
      }
    } catch (error) {
      console.error('Failed to update task status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getContextIcon = (link: ContextLink) => {
    switch (link.type) {
      case 'note':
        return <FileText className="w-3 h-3" />
      case 'meeting':
        return <Video className="w-3 h-3" />
      case 'credential':
        return <Key className="w-3 h-3" />
      default:
        return <Link className="w-3 h-3" />
    }
  }

  const getPriorityColor = () => {
    if (!task.valueScore || !task.effortScore) return ''
    const priority = (task.valueScore / task.effortScore) * 100
    
    if (priority > 150) return 'border-red-500/50' // Very high priority
    if (priority > 100) return 'border-orange-500/50' // High priority
    if (priority > 50) return 'border-yellow-500/50' // Medium priority
    return '' // Low priority
  }

  return (
    <div
      onClick={onClick}
      className={`bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4 hover:border-indigo-500/50 transition-all cursor-pointer ${getPriorityColor()} ${
        isUpdating ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleStatusToggle}
          disabled={isUpdating}
          className="mt-1 p-0.5 rounded hover:bg-gray-700/50 transition-colors"
        >
          <StatusIcon
            className={`w-5 h-5 ${
              task.status === 'completed'
                ? 'text-green-500'
                : task.status === 'blocked'
                ? 'text-red-500'
                : task.status === 'in_progress'
                ? 'text-blue-500'
                : 'text-gray-500'
            }`}
          />
        </button>
        <div className="flex-1 min-w-0">
          <h3
            className={`text-white font-medium mb-1 ${
              task.status === 'completed' ? 'line-through opacity-60' : ''
            }`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-400 text-sm mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs">
              {task.dueDate && (
                <div className={`flex items-center gap-1 ${getDueDateColor(task.dueDate)}`}>
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(task.dueDate)}</span>
                </div>
              )}
              {task.status === 'blocked' && (
                <div className="flex items-center gap-1 text-red-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>Blocked</span>
                </div>
              )}
              {task.assigneeIds.length > 0 && (
                <div className="flex items-center gap-1 text-gray-400">
                  <Users className="w-3 h-3" />
                  <span>{task.assigneeIds.length}</span>
                </div>
              )}
              {task.valueScore !== undefined && task.effortScore !== undefined && (
                <div className="flex items-center gap-1 text-purple-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Priority: {Math.round((task.valueScore / task.effortScore) * 100)}</span>
                </div>
              )}
            </div>
            
            {showContext && task.contextLinks.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {task.contextLinks.slice(0, 3).map((link, index) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-1 px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-400"
                  >
                    {getContextIcon(link)}
                    <span className="truncate max-w-[100px]">
                      {link.title || link.sourceApp}
                    </span>
                  </div>
                ))}
                {task.contextLinks.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{task.contextLinks.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
