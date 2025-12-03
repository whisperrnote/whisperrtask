'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Avatar,
  Menu,
  MenuItem,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Flag as FlagIcon,
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Folder as FolderIcon,
  Label as LabelIcon,
  Notes as NotesIcon,
  Event as EventIcon,
  VideoCall as MeetingIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useTask } from '@/context/TaskContext';
import { Priority, TaskStatus } from '@/types';
import { useLayout } from '@/context/LayoutContext';
import { useOriginSocial } from '@/hooks/useOriginSocial';

const priorityColors: Record<Priority, string> = {
  low: '#94a3b8',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
  cancelled: 'Cancelled',
};

interface TaskDetailsProps {
  taskId: string;
}

export default function TaskDetails({ taskId }: TaskDetailsProps) {
  const theme = useTheme();
  const { closeSecondarySidebar } = useLayout();
  const {
    tasks,
    updateTask,
    completeTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addComment,
    projects,
    labels,
  } = useTask();

  const task = tasks.find((t) => t.id === taskId);
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [statusAnchor, setStatusAnchor] = useState<null | HTMLElement>(null);
  const [priorityAnchor, setPriorityAnchor] = useState<null | HTMLElement>(null);

  // Origin Social Context
  const { isAuthenticated, socialContext, fetchSocialContext, loading: loadingSocial } = useOriginSocial();
  
  React.useEffect(() => {
    if (isAuthenticated && task) {
      const match = task.title.match(/@(\w+)/);
      if (match) {
        fetchSocialContext(match[1]);
      }
    }
  }, [isAuthenticated, task?.title]);

  if (!task) {
    return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">Task not found</Typography>
        </Box>
    );
  }

  const project = projects.find((p) => p.id === task.projectId);
  const taskLabels = labels.filter((l) => task.labels.includes(l.id));
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const subtaskProgress = task.subtasks.length > 0
    ? (completedSubtasks / task.subtasks.length) * 100
    : 0;

  const handleStartEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateTask(task.id, {
      title: editTitle,
      description: editDescription || undefined,
    });
    setIsEditing(false);
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      addSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(task.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleStatusChange = (status: TaskStatus) => {
    updateTask(task.id, { status });
    setStatusAnchor(null);
  };

  const handlePriorityChange = (priority: Priority) => {
    updateTask(task.id, { priority });
    setPriorityAnchor(null);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Checkbox
            checked={task.status === 'done'}
            onChange={() => completeTask(task.id)}
            sx={{
              color: priorityColors[task.priority],
              '&.Mui-checked': { color: 'success.main' },
            }}
          />
          <Chip
            label={statusLabels[task.status]}
            size="small"
            onClick={(e) => setStatusAnchor(e.currentTarget)}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
        <Box>
          <IconButton size="small" onClick={handleStartEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={closeSecondarySidebar}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, overflow: 'auto', flexGrow: 1 }}>
        {/* Title & Description */}
        {isEditing ? (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Task title"
              sx={{ mb: 1 }}
              InputProps={{ sx: { fontWeight: 600 } }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add description..."
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button size="small" variant="contained" onClick={handleSaveEdit}>
                Save
              </Button>
              <Button size="small" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                textDecoration: task.status === 'done' ? 'line-through' : 'none',
                color: task.status === 'done' ? 'text.secondary' : 'text.primary',
              }}
            >
              {task.title}
            </Typography>
            {task.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {task.description}
              </Typography>
            )}
          </Box>
        )}

        {/* Meta Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
          {/* Project */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
              <FolderIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Project
              </Typography>
            </Box>
            <Chip
              label={project?.name || 'Inbox'}
              size="small"
              sx={{
                backgroundColor: alpha(project?.color || '#6366f1', 0.15),
                color: project?.color || '#6366f1',
              }}
            />
          </Box>

          {/* Priority */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
              <FlagIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Priority
              </Typography>
            </Box>
            <Chip
              icon={<FlagIcon sx={{ color: `${priorityColors[task.priority]} !important` }} />}
              label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              size="small"
              onClick={(e) => setPriorityAnchor(e.currentTarget)}
              sx={{
                cursor: 'pointer',
                backgroundColor: alpha(priorityColors[task.priority], 0.15),
                color: priorityColors[task.priority],
              }}
            />
          </Box>

          {/* Due Date */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Due date
              </Typography>
            </Box>
            <Typography variant="body2">
              {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}
            </Typography>
          </Box>

          {/* Labels */}
          {taskLabels.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                <LabelIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Labels
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {taskLabels.map((label) => (
                  <Chip
                    key={label.id}
                    label={label.name}
                    size="small"
                    sx={{
                      backgroundColor: alpha(label.color, 0.15),
                      color: label.color,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Created */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
              <ScheduleIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Created
              </Typography>
            </Box>
            <Typography variant="body2">
              {format(new Date(task.createdAt), 'MMM d, yyyy')}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Social Context (Origin) */}
        {socialContext && (
          <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
             <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                Social Context <Chip label="Origin" size="small" color="primary" sx={{ height: 20, fontSize: '0.6rem' }} />
             </Typography>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar src={socialContext.user?.profileImage} alt={socialContext.user?.name} />
                <Box>
                    <Typography variant="body2" fontWeight={600}>{socialContext.user?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">@{socialContext.user?.username}</Typography>
                </Box>
             </Box>
             {socialContext.tweets?.map((tweet: any) => (
                 <Paper key={tweet.id} sx={{ p: 1.5, mb: 1, bgcolor: 'background.paper' }} elevation={0} variant="outlined">
                     <Typography variant="body2" fontSize="0.85rem">{tweet.text}</Typography>
                 </Paper>
             ))}
          </Box>
        )}

        {/* Subtasks */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Subtasks
            </Typography>
            {task.subtasks.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {completedSubtasks}/{task.subtasks.length}
              </Typography>
            )}
          </Box>

          {task.subtasks.length > 0 && (
            <LinearProgress
              variant="determinate"
              value={subtaskProgress}
              sx={{ mb: 1.5, height: 4, borderRadius: 2 }}
            />
          )}

          <List dense disablePadding>
            {task.subtasks.map((subtask) => (
              <ListItem
                key={subtask.id}
                disablePadding
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.text.primary, 0.02),
                  },
                }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => deleteSubtask(task.id, subtask.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Checkbox
                    edge="start"
                    checked={subtask.completed}
                    onChange={() => toggleSubtask(task.id, subtask.id)}
                    size="small"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={subtask.title}
                  sx={{
                    textDecoration: subtask.completed ? 'line-through' : 'none',
                    color: subtask.completed ? 'text.secondary' : 'text.primary',
                  }}
                />
              </ListItem>
            ))}
          </List>

          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Add subtask..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
            />
            <IconButton size="small" onClick={handleAddSubtask} disabled={!newSubtask.trim()}>
              <AddIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Whisperr Ecosystem Integration */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Linked Items
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<NotesIcon />}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Link to WhisperrNote
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EventIcon />}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Link to WhisperrEvents
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<MeetingIcon />}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Link to WhisperrMeet
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CalendarIcon />}
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Add to WhisperrCal
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Comments */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Comments ({task.comments.length})
          </Typography>

          <List disablePadding>
            {task.comments.map((comment) => (
              <ListItem
                key={comment.id}
                alignItems="flex-start"
                disablePadding
                sx={{ mb: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem' }}>
                    {comment.authorName.charAt(0)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {comment.authorName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                      </Typography>
                    </Box>
                  }
                  secondary={comment.content}
                />
              </ListItem>
            ))}
          </List>

          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
              multiline
              maxRows={3}
            />
            <IconButton
              size="small"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              color="primary"
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Status Menu */}
      <Menu
        anchorEl={statusAnchor}
        open={Boolean(statusAnchor)}
        onClose={() => setStatusAnchor(null)}
      >
        {Object.entries(statusLabels).map(([status, label]) => (
          <MenuItem
            key={status}
            onClick={() => handleStatusChange(status as TaskStatus)}
            selected={task.status === status}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>

      {/* Priority Menu */}
      <Menu
        anchorEl={priorityAnchor}
        open={Boolean(priorityAnchor)}
        onClose={() => setPriorityAnchor(null)}
      >
        {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((priority) => (
          <MenuItem
            key={priority}
            onClick={() => handlePriorityChange(priority)}
            selected={task.priority === priority}
          >
            <FlagIcon sx={{ color: priorityColors[priority], mr: 1 }} />
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
