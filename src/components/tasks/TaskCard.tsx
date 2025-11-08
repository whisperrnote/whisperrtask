import type { Task } from '../../types'
import { CheckSquare, Circle, Clock } from 'lucide-react'
import { formatDate, getDueDateColor } from '../../lib/utils'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const StatusIcon = task.status === 'completed' ? CheckSquare : Circle

  return (
    <div
      onClick={onClick}
      className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4 hover:border-indigo-500/50 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <StatusIcon
            className={`w-5 h-5 ${
              task.status === 'completed'
                ? 'text-green-500'
                : 'text-gray-500'
            }`}
          />
        </div>
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
          <div className="flex items-center gap-3 text-xs">
            {task.dueDate && (
              <div className={`flex items-center gap-1 ${getDueDateColor(task.dueDate)}`}>
                <Clock className="w-3 h-3" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}
            {task.valueScore !== undefined && (
              <span className="text-green-400">
                Value: {task.valueScore}
              </span>
            )}
            {task.effortScore !== undefined && (
              <span className="text-blue-400">
                Effort: {task.effortScore}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
