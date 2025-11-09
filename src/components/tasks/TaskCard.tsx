import type { Task, ContextLink } from '../../types'
import { useState } from 'react'
import {
  Card,
  CardContent,
  Box,
  Checkbox,
  Typography,
  Chip,
  Stack,
  useTheme,
} from '@mui/material'
import {
  Description as FileTextIcon,
  Videocam as VideoIcon,
  Key as KeyIcon,
  Error as AlertIcon,
  Group as UsersIcon,
  Link as LinkIcon,
  Lightbulb as SparklesIcon,
  Schedule as ClockIcon,
} from '@mui/icons-material'
import { formatDate, getDueDateColor } from '../../lib/utils'
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
  const theme = useTheme()
  const [isUpdating, setIsUpdating] = useState(false)

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
        return <FileTextIcon fontSize="small" />
      case 'meeting':
        return <VideoIcon fontSize="small" />
      case 'credential':
        return <KeyIcon fontSize="small" />
      default:
        return <LinkIcon fontSize="small" />
    }
  }

  const getPriorityColor = () => {
    if (!task.valueScore || !task.effortScore) return theme.palette.divider
    const priority = (task.valueScore / task.effortScore) * 100
    
    if (priority > 150) return theme.palette.error.main
    if (priority > 100) return theme.palette.warning.main
    if (priority > 50) return theme.palette.info.main
    return theme.palette.divider
  }

  const getStatusColor = () => {
    switch (task.status) {
      case 'completed':
        return 'success'
      case 'blocked':
        return 'error'
      case 'in_progress':
        return 'info'
      default:
        return 'default'
    }
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        borderLeft: `4px solid ${getPriorityColor()}`,
        opacity: isUpdating ? 0.6 : 1,
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Checkbox
            checked={task.status === 'completed'}
            onChange={handleStatusToggle}
            disabled={isUpdating}
            sx={{ mt: -0.5 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                opacity: task.status === 'completed' ? 0.6 : 1,
                mb: 0.5,
              }}
            >
              {task.title}
            </Typography>
            
            {task.description && (
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: 1, display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
              >
                {task.description}
              </Typography>
            )}

            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {task.dueDate && (
                  <Chip
                    icon={<ClockIcon />}
                    label={formatDate(task.dueDate)}
                    size="small"
                    color={getStatusColor()}
                    variant="outlined"
                  />
                )}
                {task.status === 'blocked' && (
                  <Chip
                    icon={<AlertIcon />}
                    label="Blocked"
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                )}
                {task.assigneeIds.length > 0 && (
                  <Chip
                    icon={<UsersIcon />}
                    label={`${task.assigneeIds.length}`}
                    size="small"
                    variant="outlined"
                  />
                )}
                {task.valueScore !== undefined && task.effortScore !== undefined && (
                  <Chip
                    icon={<SparklesIcon />}
                    label={`Priority: ${Math.round((task.valueScore / task.effortScore) * 100)}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Stack>

              {showContext && task.contextLinks.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {task.contextLinks.slice(0, 3).map((link) => (
                    <Chip
                      key={link.id}
                      icon={getContextIcon(link)}
                      label={link.title || link.sourceApp}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                  {task.contextLinks.length > 3 && (
                    <Typography variant="caption" sx={{ alignSelf: 'center' }}>
                      +{task.contextLinks.length - 3} more
                    </Typography>
                  )}
                </Stack>
              )}
            </Stack>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
