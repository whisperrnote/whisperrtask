import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Container,
  Box,
  Typography,
  Button,
  ButtonGroup,
  Stack,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  CircularProgress,
  useTheme,
} from '@mui/material'
import {
  Inbox as InboxIcon,
  NotificationsActive as BellIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useNotificationStore } from '../store/notificationStore'
import { NotificationCard } from '../components/hub/NotificationCard'

export const Route = createFileRoute('/hub')({ component: HubPage })

function HubPage() {
  const theme = useTheme()
  const { notifications, markAsRead } = useNotificationStore()
  const [filteredNotifications, setFilteredNotifications] = useState(notifications)
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionable'>('all')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let filtered = [...notifications]
    
    switch (filter) {
      case 'unread':
        filtered = filtered.filter((n) => !n.read)
        break
      case 'actionable':
        filtered = filtered.filter((n) => n.data?.resourceId)
        break
    }
    
    setFilteredNotifications(filtered)
  }, [notifications, filter])

  const handleMarkAllAsRead = () => {
    notifications
      .filter((n) => !n.read)
      .forEach((n) => markAsRead(n.id))
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Whisperr Hub
            </Typography>
            {unreadCount > 0 && (
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 2,
                  fontSize: '0.875rem',
                }}
              >
                {unreadCount} new
              </Box>
            )}
          </Stack>
          <Typography variant="body2" color="textSecondary">
            Unified inbox across your entire ecosystem
          </Typography>
        </Box>

        {/* Toolbar */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <ButtonGroup variant="outlined" size="small">
            {(['all', 'unread', 'actionable'] as const).map((f) => (
              <Button
                key={f}
                onClick={() => setFilter(f)}
                variant={filter === f ? 'contained' : 'outlined'}
              >
                {f.toUpperCase()}
              </Button>
            ))}
          </ButtonGroup>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<CheckCircleIcon />}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
            
            <Button
              variant="outlined"
              startIcon={isLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        {/* Notifications */}
        {filteredNotifications.length > 0 ? (
          <Stack spacing={2}>
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
              />
            ))}
            
            {filteredNotifications.length > 10 && (
              <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center' }}>
                Showing {filteredNotifications.length} notifications
              </Typography>
            )}
          </Stack>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <InboxIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                {filter === 'all'
                  ? 'All caught up'
                  : filter === 'unread'
                  ? 'No unread notifications'
                  : 'No actionable notifications'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {filter === 'all'
                  ? 'You have no notifications from WhisperrTask, WhisperrNote, WhisperrMeet, or WhisperrPass'
                  : 'Try changing your filter to see more notifications'}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Alert
          severity="info"
          icon={<BellIcon />}
          sx={{
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
          }}
        >
          <AlertTitle>Actionable Notifications</AlertTitle>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Notifications in the Hub are not just links - they're actionable UI components. Complete tasks, respond to comments, or reschedule meetings directly from here.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                ;(window as any).__whisperr?.demo?.createTaskFromNote?.()
              }}
            >
              Demo: Task from Note
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                ;(window as any).__whisperr?.demo?.createTaskFromMeeting?.()
              }}
            >
              Demo: Action from Meeting
            </Button>
          </Stack>
        </Alert>
      </Stack>
    </Container>
  )
}
