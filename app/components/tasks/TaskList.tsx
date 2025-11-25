'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  ViewList as ListIcon,
  ViewModule as BoardIcon,
  CalendarMonth as CalendarIcon,
  Timeline as TimelineIcon,
  GridView as MatrixIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowUpward as AscIcon,
  ArrowDownward as DescIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import TaskItem from '@/app/components/tasks/TaskItem';
import { useTask } from '@/app/context/TaskContext';
import { ViewMode, SortField, TaskStatus } from '@/app/types';

export default function TaskList() {
  const theme = useTheme();
  const {
    getFilteredTasks,
    viewMode,
    setViewMode,
    sort,
    setSort,
    filter,
    setFilter,
    setTaskDialogOpen,
    projects,
    selectedProjectId,
  } = useTask();

  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  const tasks = getFilteredTasks();
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'dueDate', label: 'Due Date' },
    { field: 'priority', label: 'Priority' },
    { field: 'createdAt', label: 'Created Date' },
    { field: 'updatedAt', label: 'Last Updated' },
    { field: 'title', label: 'Title' },
    { field: 'status', label: 'Status' },
  ];

  const statusFilters: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'todo', label: 'To Do', color: theme.palette.grey[500] },
    { status: 'in-progress', label: 'In Progress', color: theme.palette.info.main },
    { status: 'done', label: 'Done', color: theme.palette.success.main },
    { status: 'blocked', label: 'Blocked', color: theme.palette.error.main },
  ];

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortChange = (field: SortField) => {
    if (sort.field === field) {
      setSort({ field, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSort({ field, direction: 'asc' });
    }
    handleSortClose();
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleStatusFilterToggle = (status: TaskStatus) => {
    const currentStatuses = filter.status || [];
    if (currentStatuses.includes(status)) {
      setFilter({
        ...filter,
        status: currentStatuses.filter((s) => s !== status),
      });
    } else {
      setFilter({
        ...filter,
        status: [...currentStatuses, status],
      });
    }
  };

  const getViewTitle = () => {
    if (selectedProject) return selectedProject.name;
    if (filter.status?.includes('done')) return 'Completed Tasks';
    if (filter.dueDate?.from && filter.dueDate?.to) {
      const from = new Date(filter.dueDate.from);
      const to = new Date(filter.dueDate.to);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (from.toDateString() === today.toDateString()) return 'Today';
      if (from.toDateString() === tomorrow.toDateString()) return 'Upcoming';
    }
    if (filter.dueDate?.to && !filter.dueDate.from) return 'Overdue';
    return 'All Tasks';
  };

  // Group tasks by status for board view
  const groupedTasks = {
    todo: tasks.filter((t) => t.status === 'todo'),
    'in-progress': tasks.filter((t) => t.status === 'in-progress'),
    blocked: tasks.filter((t) => t.status === 'blocked'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {getViewTitle()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => value && setViewMode(value)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: 1,
                px: 1.5,
              },
            }}
          >
            <ToggleButton value="list">
              <Tooltip title="List view">
                <ListIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="board">
              <Tooltip title="Board view">
                <BoardIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="calendar">
              <Tooltip title="Calendar view">
                <CalendarIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="timeline">
              <Tooltip title="Timeline view">
                <TimelineIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* Sort */}
          <Button
            variant="text"
            size="small"
            startIcon={<SortIcon />}
            endIcon={<ExpandMoreIcon />}
            onClick={handleSortClick}
            sx={{ textTransform: 'none' }}
          >
            Sort
          </Button>

          {/* Filter */}
          <Button
            variant="text"
            size="small"
            startIcon={<FilterIcon />}
            endIcon={<ExpandMoreIcon />}
            onClick={handleFilterClick}
            sx={{ textTransform: 'none' }}
          >
            Filter
            {(filter.status?.length || filter.labels?.length) && (
              <Chip
                label={
                  (filter.status?.length || 0) + (filter.labels?.length || 0)
                }
                size="small"
                sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
              />
            )}
          </Button>

          {/* Add Task */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setTaskDialogOpen(true)}
          >
            Add Task
          </Button>
        </Box>
      </Box>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
        PaperProps={{ sx: { minWidth: 200 } }}
      >
        {sortOptions.map((option) => (
          <MenuItem
            key={option.field}
            onClick={() => handleSortChange(option.field)}
            selected={sort.field === option.field}
          >
            <ListItemText>{option.label}</ListItemText>
            {sort.field === option.field && (
              <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                {sort.direction === 'asc' ? (
                  <AscIcon fontSize="small" />
                ) : (
                  <DescIcon fontSize="small" />
                )}
              </ListItemIcon>
            )}
          </MenuItem>
        ))}
      </Menu>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{ sx: { minWidth: 200, p: 1 } }}
      >
        <Typography variant="overline" sx={{ px: 1, color: 'text.secondary' }}>
          Status
        </Typography>
        {statusFilters.map((item) => (
          <MenuItem
            key={item.status}
            onClick={() => handleStatusFilterToggle(item.status)}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: item.color,
                }}
              />
            </ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
            {filter.status?.includes(item.status) && (
              <CheckIcon fontSize="small" color="primary" />
            )}
          </MenuItem>
        ))}
        <Divider sx={{ my: 1 }} />
        <MenuItem
          onClick={() => setFilter({ ...filter, showCompleted: !filter.showCompleted })}
        >
          <ListItemText>Show completed</ListItemText>
          {filter.showCompleted && <CheckIcon fontSize="small" color="primary" />}
        </MenuItem>
        <MenuItem
          onClick={() => setFilter({ ...filter, showArchived: !filter.showArchived })}
        >
          <ListItemText>Show archived</ListItemText>
          {filter.showArchived && <CheckIcon fontSize="small" color="primary" />}
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem
          onClick={() => {
            setFilter({ showCompleted: true, showArchived: false });
            handleFilterClose();
          }}
        >
          <ListItemText>Clear filters</ListItemText>
        </MenuItem>
      </Menu>

      {/* Task List View */}
      {viewMode === 'list' && (
        <Box>
          {tasks.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                color: 'text.secondary',
              }}
            >
              <Typography variant="h6" gutterBottom>
                No tasks found
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {filter.search
                  ? 'Try adjusting your search or filters'
                  : 'Create a new task to get started'}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setTaskDialogOpen(true)}
              >
                Add Task
              </Button>
            </Box>
          ) : (
            tasks.map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </Box>
      )}

      {/* Board View (Kanban) */}
      {viewMode === 'board' && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 2,
            minHeight: 400,
          }}
        >
          {(['todo', 'in-progress', 'blocked', 'done'] as const).map((status) => (
            <Box
              key={status}
              sx={{
                backgroundColor: alpha(theme.palette.text.primary, 0.02),
                borderRadius: 2,
                p: 1.5,
                minHeight: 400,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor:
                        statusFilters.find((s) => s.status === status)?.color ||
                        theme.palette.grey[500],
                    }}
                  />
                  <Typography variant="subtitle2" fontWeight={600}>
                    {statusFilters.find((s) => s.status === status)?.label}
                  </Typography>
                  <Chip
                    label={groupedTasks[status].length}
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
                <IconButton size="small" onClick={() => setTaskDialogOpen(true)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box>
                {groupedTasks[status].map((task) => (
                  <TaskItem key={task.id} task={task} compact />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Calendar View Placeholder */}
      {viewMode === 'calendar' && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary',
            backgroundColor: alpha(theme.palette.text.primary, 0.02),
            borderRadius: 2,
          }}
        >
          <CalendarIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            Calendar View
          </Typography>
          <Typography variant="body2">
            Visual calendar coming soon. See your tasks organized by date.
          </Typography>
        </Box>
      )}

      {/* Timeline View Placeholder */}
      {viewMode === 'timeline' && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary',
            backgroundColor: alpha(theme.palette.text.primary, 0.02),
            borderRadius: 2,
          }}
        >
          <TimelineIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            Timeline View
          </Typography>
          <Typography variant="body2">
            Gantt-style timeline coming soon. Visualize task durations and dependencies.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
