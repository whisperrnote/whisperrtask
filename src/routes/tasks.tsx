import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  Grid,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  FilterListIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Badge,
  useTheme,
} from '@mui/material'
import {
  Add as AddIcon,
  FilterList as FilterListIconMUI,
  TableChart as ListViewIcon,
  ViewWeek as BoardViewIcon,
  CalendarToday as CalendarViewIcon,
  AutoAwesome as SparklesIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material'
import { taskService } from '../services/task.service'
import { TaskCard } from '../components/tasks/TaskCard'
import { prioritizeTasks, generateTodaysPlan } from '../lib/ai-engine'
import type { Task, TaskView, TaskFilters } from '../types'

export const Route = createFileRoute('/tasks')({ component: TasksPage })

function TasksPage() {
  const theme = useTheme()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [view, setView] = useState<TaskView>('list')
  const [filters, setFilters] = useState<TaskFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [stats, setStats] = useState({
    todaysFocus: 0,
    highValue: 0,
    inProgress: 0,
    blocked: 0,
  })

  useEffect(() => {
    loadTasks()
    
    const unsubscribe = (window as any).__whisperr?.ecosystemBridge?.subscribe(
      'whisperrtask.task.*',
      () => loadTasks()
    )
    
    return () => unsubscribe?.()
  }, [])

  useEffect(() => {
    let filtered = [...tasks]
    
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((t) => filters.status!.includes(t.status))
    }
    
    if (filters.assigneeIds && filters.assigneeIds.length > 0) {
      filtered = filtered.filter((t) =>
        t.assigneeIds.some((id) => filters.assigneeIds!.includes(id))
      )
    }
    
    if (filters.projectId) {
      filtered = filtered.filter((t) => t.projectId === filters.projectId)
    }
    
    if (filters.valueScoreMin) {
      filtered = filtered.filter((t) => (t.valueScore || 0) >= filters.valueScoreMin!)
    }
    
    filtered = prioritizeTasks(filtered)
    setFilteredTasks(filtered)
    
    const todaysPlan = generateTodaysPlan(tasks)
    setStats({
      todaysFocus: todaysPlan.length,
      highValue: tasks.filter((t) => (t.valueScore || 0) > 70 && t.status !== 'completed').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      blocked: tasks.filter((t) => t.status === 'blocked').length,
    })
  }, [tasks, filters])

  const loadTasks = () => {
    const allTasks = taskService.getTasks()
    setTasks(allTasks)
  }

  const handleCreateTask = async () => {
    const demoProject = await (taskService as any).getOrCreateDefaultProject()
    const newTask = await taskService.createTask({
      projectId: demoProject.id,
      title: 'New Task ' + new Date().toLocaleTimeString(),
      description: 'Task created from UI',
    })
    
    if (newTask) {
      loadTasks()
    }
  }

  const handleStatusChange = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
  }

  const activeFilters = Object.keys(filters).filter((k) => filters[k as keyof TaskFilters]).length

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            My Tasks
          </Typography>
          <Typography variant="body2" color="textSecondary">
            AI-powered task prioritization based on your goals
          </Typography>
        </Box>

        {/* Toolbar */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start" justifyContent="space-between">
          <Stack direction="row" spacing={2}>
            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              startIcon={<FilterListIconMUI />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filter {activeFilters > 0 && <Badge badgeContent={activeFilters} color="primary" sx={{ ml: 1 }} />}
            </Button>
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, newView) => newView && setView(newView)}
            >
              <ToggleButton value="list">
                <ListViewIcon />
              </ToggleButton>
              <ToggleButton value="board">
                <BoardViewIcon />
              </ToggleButton>
              <ToggleButton value="calendar">
                <CalendarViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateTask}
          >
            New Task
          </Button>
        </Stack>

        {/* Filter Panel */}
        {showFilters && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Filter Options</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Status
                  </Typography>
                  <FormGroup>
                    {(['todo', 'in_progress', 'blocked', 'completed'] as const).map((status) => (
                      <FormControlLabel
                        key={status}
                        control={
                          <Checkbox
                            checked={filters.status?.includes(status) || false}
                            onChange={(e) => {
                              const newStatus = [...(filters.status || [])]
                              if (e.target.checked) {
                                newStatus.push(status)
                              } else {
                                const idx = newStatus.indexOf(status)
                                if (idx > -1) newStatus.splice(idx, 1)
                              }
                              setFilters((prev) => ({
                                ...prev,
                                status: newStatus.length > 0 ? newStatus : undefined,
                              }))
                            }}
                          />
                        }
                        label={status.replace('_', ' ').toUpperCase()}
                      />
                    ))}
                  </FormGroup>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Min Value Score: {filters.valueScoreMin || 0}
                  </Typography>
                  <Slider
                    value={filters.valueScoreMin || 0}
                    onChange={(_, value) =>
                      setFilters((prev) => ({
                        ...prev,
                        valueScoreMin: (value as number) || undefined,
                      }))
                    }
                    min={0}
                    max={100}
                    step={5}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Stats */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" variant="caption">
                      TODAY'S FOCUS
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {stats.todaysFocus}
                    </Typography>
                  </Box>
                  <SparklesIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" variant="caption">
                      HIGH VALUE
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {stats.highValue}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main' }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" variant="caption">
                      IN PROGRESS
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {stats.inProgress}
                    </Typography>
                  </Box>
                  <ScheduleIcon sx={{ fontSize: 32, color: 'info.main' }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" variant="caption">
                      BLOCKED
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {stats.blocked}
                    </Typography>
                  </Box>
                  <ErrorIcon sx={{ fontSize: 32, color: 'error.main' }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Task Content */}
        {filteredTasks.length > 0 ? (
          <>
            {view === 'list' && (
              <Stack spacing={2}>
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </Stack>
            )}

            {view === 'board' && (
              <Grid container spacing={2}>
                {(['todo', 'in_progress', 'blocked', 'completed'] as const).map((status) => (
                  <Grid item xs={12} md={6} lg={3} key={status}>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 2, textTransform: 'capitalize' }}
                      >
                        {status.replace('_', ' ')}
                      </Typography>
                      <Stack spacing={2}>
                        {filteredTasks
                          .filter((t) => t.status === status)
                          .map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onClick={() => setSelectedTask(task)}
                              onStatusChange={handleStatusChange}
                              showContext={false}
                            />
                          ))}
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}

            {view === 'calendar' && (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="textSecondary">
                    Calendar view coming soon...
                  </Typography>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Box sx={{ mb: 2 }}>
                <CalendarViewIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
              </Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                {tasks.length === 0
                  ? 'Create your first task or let the AI import them from your notes and meetings'
                  : 'Try adjusting your filters to see more tasks'}
              </Typography>
              {tasks.length === 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateTask}
                >
                  Create Task
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  )
}
