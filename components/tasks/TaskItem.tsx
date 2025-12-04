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
  Clock as ScheduleIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  MoreVertical as MoreIcon,
  ListTodo as SubtaskIcon,
  MessageSquare as CommentIcon,
  Paperclip as AttachmentIcon,
  Archive as ArchiveIcon,
  Copy as CopyIcon,
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';
import { Task, Priority } from '@/types';
import { useTask } from '@/context/TaskContext';
import { useLayout } from '@/context/LayoutContext';

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
  const { openSecondarySidebar } = useLayout();
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
        elevation={0}
        onClick={() => {
          selectTask(task.id);
          openSecondarySidebar('task', task.id);
          onClick?.();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          p: compact ? 1.25 : 1.75,
          mb: 1,
          cursor: 'pointer',
          borderRadius: 2.5,
          border: `1px solid ${isHovered ? alpha(theme.palette.primary.main, 0.4) : theme.palette.divider}`,
          backgroundColor: isHovered
            ? alpha(theme.palette.primary.main, 0.04)
            : theme.palette.background.paper,
          opacity: task.status === 'done' ? 0.65 : 1,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isHovered 
            ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
            : 'none',
          '&:hover': {
            transform: 'translateX(4px)',
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
                    icon={<FlagIcon size={14} />}
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
                  icon={<ScheduleIcon size={14} />}
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
                    <SubtaskIcon size={14} />
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
                    <CommentIcon size={14} />
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
                    <AttachmentIcon size={14} />
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
                <MoreIcon size={20} />
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
        <MenuItem onClick={() => { 
          selectTask(task.id); 
          openSecondarySidebar('task', task.id);
          handleMenuClose(); 
        }}>
          <ListItemIcon>
            <EditIcon size={18} />
          </ListItemIcon>
          <ListItemText>Edit task</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <CopyIcon size={18} />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleArchive}>
          <ListItemIcon>
            <ArchiveIcon size={18} />
          </ListItemIcon>
          <ListItemText>Archive</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon size={18} color="#ef4444" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
