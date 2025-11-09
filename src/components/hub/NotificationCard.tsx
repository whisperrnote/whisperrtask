import type { Notification } from '../../types'
import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Comment as MessageIcon,
  Videocam as VideoIcon,
  Note as FileTextIcon,
  AccessTime as CalendarIcon,
  NotificationsActive as BellIcon,
  Close as CloseIcon,
  OpenInNew as ExternalLinkIcon,
} from '@mui/icons-material'
import { formatDate } from '../../lib/utils'
import { useNotificationStore } from '../../store/notificationStore'

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
  const theme = useTheme()
  const [isDeleting, setIsDeleting] = useState(false)
  const { markAsRead, removeNotification } = useNotificationStore()

  const getIcon = () => {
    const iconProps = { fontSize: 'small' as const }
    switch (notification.type) {
      case 'task':
        return <CheckCircleIcon {...iconProps} />
      case 'task_commented':
        return <MessageIcon {...iconProps} />
      case 'meeting_action_item':
        return <VideoIcon {...iconProps} />
      case 'note_task_created':
        return <FileTextIcon {...iconProps} />
      case 'task_due_soon':
        return <CalendarIcon {...iconProps} />
      default:
        return <BellIcon {...iconProps} />
    }
  }

  const getSourceColor = () => {
    switch (notification.data?.sourceApp) {
      case 'whisperrtask':
        return alpha(theme.palette.info.main, 0.2)
      case 'whisperrnote':
        return alpha(theme.palette.success.main, 0.2)
      case 'whisperrmeet':
        return alpha(theme.palette.secondary.main, 0.2)
      case 'whisperrpass':
        return alpha(theme.palette.warning.main, 0.2)
      default:
        return alpha(theme.palette.grey[500], 0.2)
    }
  }

  const handleAction = async () => {
    if (notification.data?.resourceId) {
      try {
        switch (notification.type) {
          case 'task':
            await router.navigate({ to: '/tasks/$id', params: { id: notification.data.resourceId } })
            break
          case 'meeting_action_item':
            console.log('Open meeting:', notification.data.resourceId)
            break
          case 'note_task_created':
            console.log('Open note:', notification.data.resourceId)
            break
        }
        
        if (!notification.read && onMarkAsRead) {
          onMarkAsRead(notification.id)
          markAsRead(notification.id)
        }
      } catch (error) {
        console.error('Failed to handle notification action:', error)
      }
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      removeNotification(notification.id)
      if (onDelete) {
        onDelete(notification.id)
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      setIsDeleting(false)
    }
  }

  return (
    <Card
      onClick={notification.data?.resourceId && !embedded ? handleAction : undefined}
      sx={{
        opacity: isDeleting ? 0.5 : 1,
        cursor: notification.data?.resourceId && !embedded ? 'pointer' : 'default',
        backgroundColor: notification.read
          ? 'inherit'
          : alpha(theme.palette.primary.main, 0.08),
        borderLeft: `4px solid ${notification.read ? theme.palette.divider : theme.palette.primary.main}`,
        transition: 'all 0.2s',
        '&:hover': notification.data?.resourceId && !embedded ? {
          boxShadow: 2,
        } : {},
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar
            sx={{
              backgroundColor: getSourceColor(),
              width: 40,
              height: 40,
            }}
          >
            {getIcon()}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {notification.title}
              </Typography>
              {!notification.read && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: '50%',
                    flexShrink: 0,
                    mt: 1,
                  }}
                />
              )}
            </Stack>

            <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
              {notification.message}
            </Typography>

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="textSecondary">
                  {formatDate(notification.timestamp)}
                </Typography>
                {notification.data?.sourceApp && (
                  <Chip
                    label={notification.data.sourceApp.replace('whisperr', '')}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={0}>
                {!notification.read && onMarkAsRead && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarkAsRead(notification.id)
                      markAsRead(notification.id)
                    }}
                    sx={{ color: 'primary.main' }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete()
                    }}
                    disabled={isDeleting}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
                {notification.data?.resourceId && !embedded && (
                  <ExternalLinkIcon
                    fontSize="small"
                    sx={{ color: 'text.secondary', mt: 0.5 }}
                  />
                )}
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
