'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Chip,
  Tooltip,
  useTheme,
  alpha,
  Grid,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { useTask } from '@/app/context/TaskContext';
import { Task, Priority } from '@/app/types';

const priorityColors: Record<Priority, string> = {
  low: '#94a3b8',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

interface DayCellProps {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  onTaskClick: (taskId: string) => void;
  onAddTask: (date: Date) => void;
}

function DayCell({ date, tasks, isCurrentMonth, onTaskClick, onAddTask }: DayCellProps) {
  const theme = useTheme();
  const today = isToday(date);
  const maxVisible = 3;
  const visibleTasks = tasks.slice(0, maxVisible);
  const moreCount = tasks.length - maxVisible;

  return (
    <Box
      sx={{
        minHeight: 120,
        p: 1,
        borderRight: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: !isCurrentMonth
          ? alpha(theme.palette.text.primary, 0.02)
          : 'transparent',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 0.5,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            fontWeight: today ? 600 : 400,
            backgroundColor: today ? theme.palette.primary.main : 'transparent',
            color: today
              ? '#fff'
              : isCurrentMonth
              ? 'text.primary'
              : 'text.disabled',
          }}
        >
          {format(date, 'd')}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onAddTask(date)}
          sx={{
            opacity: 0,
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 1 },
            '.MuiBox-root:hover &': { opacity: 0.5 },
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {visibleTasks.map((task) => (
          <Box
            key={task.id}
            onClick={() => onTaskClick(task.id)}
            sx={{
              p: 0.5,
              borderRadius: 1,
              backgroundColor: alpha(priorityColors[task.priority], 0.15),
              borderLeft: `3px solid ${priorityColors[task.priority]}`,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: alpha(priorityColors[task.priority], 0.25),
              },
            }}
          >
            <Typography
              variant="caption"
              noWrap
              sx={{
                fontSize: '0.7rem',
                fontWeight: 500,
                textDecoration: task.status === 'done' ? 'line-through' : 'none',
                color: task.status === 'done' ? 'text.secondary' : 'text.primary',
              }}
            >
              {task.title}
            </Typography>
          </Box>
        ))}
        {moreCount > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
            +{moreCount} more
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function CalendarView() {
  const theme = useTheme();
  const { tasks, selectTask, setTaskDialogOpen } = useTask();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate || task.isArchived) return false;
      return isSameDay(new Date(task.dueDate), date);
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleTaskClick = (taskId: string) => {
    selectTask(taskId);
  };

  const handleAddTask = (date: Date) => {
    // In a real implementation, this would pre-fill the date in the task dialog
    setTaskDialogOpen(true);
  };

  // Calculate monthly stats
  const monthTasks = tasks.filter((task) => {
    if (!task.dueDate || task.isArchived) return false;
    const dueDate = new Date(task.dueDate);
    return isSameMonth(dueDate, currentDate);
  });
  const completedMonthTasks = monthTasks.filter((t) => t.status === 'done');

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" fontWeight={700}>
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton onClick={handlePrevMonth} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <IconButton onClick={handleNextMonth} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TodayIcon />}
            onClick={handleToday}
          >
            Today
          </Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip label={`${monthTasks.length} tasks`} size="small" />
          <Chip
            label={`${completedMonthTasks.length} completed`}
            size="small"
            color="success"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setTaskDialogOpen(true)}
          >
            Add Task
          </Button>
        </Box>
      </Box>

      {/* Calendar */}
      <Paper
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        {/* Week Days Header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: alpha(theme.palette.text.primary, 0.02),
          }}
        >
          {weekDays.map((day) => (
            <Box
              key={day}
              sx={{
                p: 1.5,
                textAlign: 'center',
                borderRight: `1px solid ${theme.palette.divider}`,
                '&:last-child': { borderRight: 'none' },
              }}
            >
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
          }}
        >
          {days.map((day) => (
            <DayCell
              key={day.toISOString()}
              date={day}
              tasks={getTasksForDate(day)}
              isCurrentMonth={isSameMonth(day, currentDate)}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
            />
          ))}
        </Box>
      </Paper>

      {/* Legend */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          mt: 2,
          justifyContent: 'center',
        }}
      >
        {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((priority) => (
          <Box key={priority} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: 0.5,
                backgroundColor: priorityColors[priority],
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
