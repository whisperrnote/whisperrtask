'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Checkbox,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  ChecklistRtl as SubtaskIcon,
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Archive as ArchiveIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { format, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';
import { Task, Priority } from '@/app/types';
import { useTask } from '@/app/context/TaskContext';

interface TaskItemProps {
  task: Task;
  onClick?: () => void;
  compact?: boolean;
}

const priorityColors: Record<Priority, string> = {
  low: '#94a3b8',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export default function TaskItem({ task, onClick, compact = false }: TaskItemProps) {
  const theme = useTheme();
  const { completeTask, deleteTask, updateTask, labels, projects, selectTask } = useTask();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const project = projects.find((p) => p.id === task.projectId);
  const taskLabels = labels.filter((l) => task.labels.includes(l.id));
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleComplete = (event: React.MouseEvent) => {
    event.stopPropagation();
    completeTask(task.id);
  };

  const handleDelete = () => {
    handleMenuClose();
    deleteTask(task.id);
  };

  const handleArchive = () => {
    handleMenuClose();
    updateTask(task.id, { isArchived: true });
  };

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d');
  };

  const getDueDateColor = () => {
    if (!task.dueDate) return 'text.secondary';
    if (task.status === 'done') return 'success.main';
    if (isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))) return 'error.main';
    if (isToday(new Date(task.dueDate))) return 'warning.main';
    return 'text.secondary';
  };

  return (
    <>
      <Paper
        elevation={isHovered ? 2 : 0}
        onClick={() => {
          selectTask(task.id);
          onClick?.();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          p: compact ? 1 : 1.5,
          mb: 1,
          cursor: 'pointer',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: isHovered
            ? alpha(theme.palette.primary.main, 0.02)
            : theme.palette.background.paper,
          opacity: task.status === 'done' ? 0.7 : 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: theme.palette.primary.main,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {/* Checkbox */}
          <Checkbox
            checked={task.status === 'done'}
            onClick={handleComplete}
            sx={{
              mt: -0.5,
              color: priorityColors[task.priority],
              '&.Mui-checked': {
                color: 'success.main',
              },
            }}
          />

          {/* Main Content */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {/* Title */}
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                textDecoration: task.status === 'done' ? 'line-through' : 'none',
                color: task.status === 'done' ? 'text.secondary' : 'text.primary',
              }}
            >
              {task.title}
            </Typography>

            {/* Description (if not compact) */}
            {!compact && task.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {task.description}
              </Typography>
            )}

            {/* Meta Info */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 1,
                mt: 1,
              }}
            >
              {/* Project */}
              {project && project.id !== 'inbox' && (
                <Chip
                  label={project.name}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: alpha(project.color, 0.15),
                    color: project.color,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              )}

              {/* Priority */}
              {task.priority !== 'medium' && (
                <Tooltip title={`${priorityLabels[task.priority]} priority`}>
                  <Chip
                    icon={<FlagIcon sx={{ fontSize: 14 }} />}
                    label={priorityLabels[task.priority]}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      backgroundColor: alpha(priorityColors[task.priority], 0.15),
                      color: priorityColors[task.priority],
                      '& .MuiChip-label': { px: 0.5 },
                      '& .MuiChip-icon': { color: priorityColors[task.priority] },
                    }}
                  />
                </Tooltip>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <Chip
                  icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                  label={formatDueDate(new Date(task.dueDate))}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    color: getDueDateColor(),
                    backgroundColor: alpha(
                      theme.palette.grey[500],
                      0.1
                    ),
                    '& .MuiChip-label': { px: 0.5 },
                    '& .MuiChip-icon': { color: 'inherit' },
                  }}
                />
              )}

              {/* Labels */}
              {taskLabels.map((label) => (
                <Chip
                  key={label.id}
                  label={label.name}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: alpha(label.color, 0.15),
                    color: label.color,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              ))}

              {/* Subtasks indicator */}
              {totalSubtasks > 0 && (
                <Tooltip title={`${completedSubtasks}/${totalSubtasks} subtasks completed`}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                    }}
                  >
                    <SubtaskIcon sx={{ fontSize: 14 }} />
                    <span>
                      {completedSubtasks}/{totalSubtasks}
                    </span>
                  </Box>
                </Tooltip>
              )}

              {/* Comments indicator */}
              {task.comments.length > 0 && (
                <Tooltip title={`${task.comments.length} comments`}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                    }}
                  >
                    <CommentIcon sx={{ fontSize: 14 }} />
                    <span>{task.comments.length}</span>
                  </Box>
                </Tooltip>
              )}

              {/* Attachments indicator */}
              {task.attachments.length > 0 && (
                <Tooltip title={`${task.attachments.length} attachments`}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                    }}
                  >
                    <AttachmentIcon sx={{ fontSize: 14 }} />
                    <span>{task.attachments.length}</span>
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Actions */}
          <Box
            sx={{
              display: 'flex',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
          >
            <Tooltip title="More options">
              <IconButton size="small" onClick={handleMenuClick}>
                <MoreIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 180 },
        }}
      >
        <MenuItem onClick={() => { selectTask(task.id); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit task</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleArchive}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archive</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
