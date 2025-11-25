'use client';

import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Chip,
  IconButton,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Flag as FlagIcon,
  ArrowForward as ArrowIcon,
  Lightbulb as TipIcon,
  LocalFireDepartment as StreakIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useTask } from '@/app/context/TaskContext';
import { format, isToday, isTomorrow, isPast, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import TaskItem from '@/app/components/tasks/TaskItem';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

function StatCard({ title, value, subtitle, icon, color, trend, onClick }: StatCardProps) {
  const theme = useTheme();

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: 3,
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.2s',
        '&:hover': onClick
          ? {
              borderColor: color,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
            }
          : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              {trend.isPositive ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
              )}
              <Typography
                variant="caption"
                sx={{ color: trend.isPositive ? 'success.main' : 'error.main' }}
              >
                {trend.value}% from last week
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            backgroundColor: alpha(color, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
}

export default function Dashboard() {
  const theme = useTheme();
  const { tasks, projects, setFilter, setTaskDialogOpen, selectTask } = useTask();

  // Calculate stats
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const activeTasks = tasks.filter((t) => !t.isArchived);
  const completedTasks = activeTasks.filter((t) => t.status === 'done');
  const incompleteTasks = activeTasks.filter((t) => t.status !== 'done');

  const overdueTasks = incompleteTasks.filter(
    (t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
  );

  const todayTasks = incompleteTasks.filter(
    (t) => t.dueDate && isToday(new Date(t.dueDate))
  );

  const tomorrowTasks = incompleteTasks.filter(
    (t) => t.dueDate && isTomorrow(new Date(t.dueDate))
  );

  const thisWeekTasks = incompleteTasks.filter(
    (t) =>
      t.dueDate &&
      isWithinInterval(new Date(t.dueDate), { start: weekStart, end: weekEnd })
  );

  const inProgressTasks = incompleteTasks.filter((t) => t.status === 'in-progress');
  const urgentTasks = incompleteTasks.filter((t) => t.priority === 'urgent');
  const highPriorityTasks = incompleteTasks.filter((t) => t.priority === 'high');

  const completionRate = activeTasks.length > 0
    ? Math.round((completedTasks.length / activeTasks.length) * 100)
    : 0;

  // Get recent tasks
  const recentTasks = [...incompleteTasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Get upcoming tasks
  const upcomingTasks = [...incompleteTasks]
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const handleViewTasks = (filterType: string) => {
    switch (filterType) {
      case 'today':
        setFilter({
          showCompleted: false,
          showArchived: false,
          dueDate: { from: today, to: tomorrow },
        });
        break;
      case 'overdue':
        setFilter({
          showCompleted: false,
          showArchived: false,
          dueDate: { to: today },
        });
        break;
      case 'in-progress':
        setFilter({
          showCompleted: false,
          showArchived: false,
          status: ['in-progress'],
        });
        break;
      case 'urgent':
        setFilter({
          showCompleted: false,
          showArchived: false,
          priority: ['urgent'],
        });
        break;
    }
  };

  const productivityTips = [
    'Focus on one task at a time for better results',
    'Take regular breaks to maintain productivity',
    'Prioritize urgent tasks early in the day',
    'Break large tasks into smaller subtasks',
  ];

  const randomTip = productivityTips[Math.floor(Math.random() * productivityTips.length)];

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {format(now, 'EEEE, MMMM d, yyyy')} • You have{' '}
          <strong>{todayTasks.length} tasks</strong> due today
          {overdueTasks.length > 0 && (
            <>
              {' '}and <strong style={{ color: theme.palette.error.main }}>{overdueTasks.length} overdue</strong>
            </>
          )}
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Due Today"
            value={todayTasks.length}
            subtitle={`${tomorrowTasks.length} due tomorrow`}
            icon={<ScheduleIcon />}
            color={theme.palette.info.main}
            onClick={() => handleViewTasks('today')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Overdue"
            value={overdueTasks.length}
            subtitle="Need attention"
            icon={<WarningIcon />}
            color={theme.palette.error.main}
            onClick={() => handleViewTasks('overdue')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="In Progress"
            value={inProgressTasks.length}
            subtitle={`${urgentTasks.length} urgent`}
            icon={<FlagIcon />}
            color={theme.palette.warning.main}
            onClick={() => handleViewTasks('in-progress')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Completed"
            value={completedTasks.length}
            subtitle={`${completionRate}% completion rate`}
            icon={<CheckIcon />}
            color={theme.palette.success.main}
            trend={{ value: 12, isPositive: true }}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Priority Tasks */}
          {(urgentTasks.length > 0 || highPriorityTasks.length > 0) && (
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FlagIcon color="error" />
                  <Typography variant="h6" fontWeight={600}>
                    Priority Tasks
                  </Typography>
                  <Chip label={urgentTasks.length + highPriorityTasks.length} size="small" color="error" />
                </Box>
                <Button
                  endIcon={<ArrowIcon />}
                  onClick={() => handleViewTasks('urgent')}
                >
                  View All
                </Button>
              </Box>
              <Box>
                {[...urgentTasks, ...highPriorityTasks].slice(0, 3).map((task) => (
                  <TaskItem key={task.id} task={task} compact />
                ))}
              </Box>
            </Paper>
          )}

          {/* Today's Tasks */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Today&apos;s Tasks
                </Typography>
                <Chip label={todayTasks.length} size="small" color="primary" />
              </Box>
              <Button
                endIcon={<ArrowIcon />}
                onClick={() => handleViewTasks('today')}
              >
                View All
              </Button>
            </Box>
            {todayTasks.length > 0 ? (
              <Box>
                {todayTasks.slice(0, 5).map((task) => (
                  <TaskItem key={task.id} task={task} compact />
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <CheckIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography>No tasks due today!</Typography>
                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() => setTaskDialogOpen(true)}
                >
                  Add a Task
                </Button>
              </Box>
            )}
          </Paper>

          {/* Recent Activity */}
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Recent Activity
            </Typography>
            <Box>
              {recentTasks.map((task) => (
                <TaskItem key={task.id} task={task} compact />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Progress Overview */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Weekly Progress
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Tasks Completed
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {completedTasks.length}/{activeTasks.length}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completionRate}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: alpha(theme.palette.success.main, 0.15),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: theme.palette.success.main,
                  },
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.warning.main, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <StreakIcon sx={{ color: theme.palette.warning.main }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Current Streak
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  5 days 🔥
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Productivity Tip */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TipIcon color="primary" />
              <Typography variant="subtitle2" fontWeight={600} color="primary">
                Productivity Tip
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {randomTip}
            </Typography>
          </Paper>

          {/* Upcoming Deadlines */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Upcoming Deadlines
            </Typography>
            {upcomingTasks.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {upcomingTasks.map((task) => (
                  <Box
                    key={task.id}
                    onClick={() => selectTask(task.id)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: alpha(theme.palette.text.primary, 0.02),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {task.dueDate && format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No upcoming deadlines
              </Typography>
            )}
          </Paper>

          {/* Projects Overview */}
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Projects
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {projects
                .filter((p) => !p.isArchived && p.id !== 'inbox')
                .slice(0, 4)
                .map((project) => {
                  const projectTasks = tasks.filter(
                    (t) => t.projectId === project.id && !t.isArchived
                  );
                  const completedProjectTasks = projectTasks.filter(
                    (t) => t.status === 'done'
                  );
                  const progress = projectTasks.length > 0
                    ? Math.round((completedProjectTasks.length / projectTasks.length) * 100)
                    : 0;

                  return (
                    <Box key={project.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: project.color,
                          }}
                        />
                        <Typography variant="body2" fontWeight={500} sx={{ flexGrow: 1 }}>
                          {project.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {completedProjectTasks.length}/{projectTasks.length}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: alpha(project.color, 0.15),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: project.color,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
