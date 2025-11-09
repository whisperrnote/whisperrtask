import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  useTheme,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  EventNote as CalendarIcon,
  People as UsersIcon,
  Psychology as BrainIcon,
  ElectricBolt as ZapIcon,
  ArrowForward as ArrowRightIcon,
  AutoAwesome as SparklesIcon,
  Cable as NetworkIcon,
  Security as ShieldIcon,
} from '@mui/icons-material'
import { taskService } from '../services/task.service'
import { useNotificationStore } from '../store/notificationStore'
import { TaskCard } from '../components/tasks/TaskCard'
import { generateTodaysPlan } from '../lib/ai-engine'
import type { Task } from '../types'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const theme = useTheme()
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([])
  const { notifications } = useNotificationStore()
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedToday: 0,
    unreadNotifications: 0,
  })

  useEffect(() => {
    const allTasks = taskService.getTasks()
    const plan = generateTodaysPlan(allTasks)
    setTodaysTasks(plan.slice(0, 3))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const completedToday = allTasks.filter((t) => {
      if (t.status !== 'completed') return false
      const updatedDate = new Date(t.updatedAt)
      updatedDate.setHours(0, 0, 0, 0)
      return updatedDate.getTime() === today.getTime()
    }).length

    setStats({
      totalTasks: allTasks.filter((t) => t.status !== 'completed').length,
      completedToday,
      unreadNotifications: notifications.filter((n) => !n.read).length,
    })
  }, [notifications])

  const features = [
    {
      icon: BrainIcon,
      title: 'AI-Powered Prioritization',
      description: 'Smart algorithms analyze context to suggest what to work on next',
    },
    {
      icon: NetworkIcon,
      title: 'Ecosystem Integration',
      description: 'Seamless sync with WhisperrNote, WhisperrMeet, and WhisperrPass',
    },
    {
      icon: ShieldIcon,
      title: 'Security First',
      description: 'Zero-knowledge architecture with end-to-end encryption',
    },
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 8, px: 2 }}>
      <Stack spacing={8}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'bold',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            Welcome to WhisperrTask
          </Typography>
          <Typography
            variant="h6"
            color="textSecondary"
            sx={{ maxWidth: '600px', mx: 'auto' }}
          >
            Your intelligent task management system that amplifies human agency through AI and seamless ecosystem integration
          </Typography>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: 'info.main' }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.totalTasks}
                  </Typography>
                </Stack>
                <Typography color="textSecondary">Active Tasks</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <SparklesIcon sx={{ fontSize: 32, color: 'success.main' }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.completedToday}
                  </Typography>
                </Stack>
                <Typography color="textSecondary">Completed Today</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <ZapIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.unreadNotifications}
                  </Typography>
                </Stack>
                <Typography color="textSecondary">Notifications</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Today's Plan */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Today's AI-Curated Plan
            </Typography>
            <Button
              component={Link}
              to="/tasks"
              endIcon={<ArrowRightIcon />}
              color="primary"
            >
              View all tasks
            </Button>
          </Stack>
          {todaysTasks.length > 0 ? (
            <Stack spacing={2}>
              {todaysTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(updated) => {
                    setTodaysTasks((prev) =>
                      prev.map((t) => (t.id === updated.id ? updated : t))
                    )
                  }}
                />
              ))}
            </Stack>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                  No tasks scheduled for today
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a task or wait for AI to suggest priorities
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Features */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
            Powered by Intelligence
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Grid item xs={12} md={4} key={index}>
                  <Card sx={{ height: '100%', transition: 'all 0.2s', '&:hover': { boxShadow: 3 } }}>
                    <CardContent>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <Icon sx={{ color: 'white', fontSize: 28 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Box>

        {/* Quick Actions */}
        <Stack direction="row" justifyContent="center" spacing={2}>
          <Button
            component={Link}
            to="/tasks"
            variant="contained"
            size="large"
          >
            Go to Tasks
          </Button>
          <Button
            component={Link}
            to="/hub"
            variant="outlined"
            size="large"
          >
            Open Hub
          </Button>
        </Stack>
      </Stack>
    </Container>
  )
}
