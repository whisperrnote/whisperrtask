'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react';
import { ID } from 'appwrite';
import { tasks as taskApi, calendars as calendarApi } from '@/lib/whisperrflow';
import { account } from '@/lib/appwrite';
import { Task as AppwriteTask, Calendar as AppwriteCalendar } from '@/types/whisperrflow';
import {
  Task,
  Project,
  Label,
  TaskFilter,
  TaskSort,
  TaskStatus,
  Priority,
  ViewMode,
  AppView,
  Subtask,
  Comment,
} from '@/types';

// Mappers
const mapAppwriteTaskToTask = (doc: AppwriteTask): Task => {
  // Extract project ID from tags if present (format: "project:ID")
  const projectTag = doc.tags?.find(t => t.startsWith('project:'));
  const projectId = projectTag ? projectTag.split(':')[1] : 'inbox';
  const otherTags = doc.tags?.filter(t => !t.startsWith('project:')) || [];

  return {
    id: doc.$id,
    title: doc.title,
    description: doc.description,
    status: (doc.status as TaskStatus) || 'todo',
    priority: (doc.priority as Priority) || 'medium',
    projectId: projectId,
    labels: otherTags,
    subtasks: [],
    comments: [],
    attachments: [],
    reminders: [],
    timeEntries: [],
    assigneeIds: doc.assigneeIds || [],
    creatorId: doc.userId,
    dueDate: doc.dueDate ? new Date(doc.dueDate) : undefined,
    createdAt: new Date(doc.$createdAt),
    updatedAt: new Date(doc.$updatedAt),
    position: 0,
    isArchived: false,
  };
};

const mapAppwriteCalendarToProject = (doc: AppwriteCalendar): Project => ({
  id: doc.$id,
  name: doc.name,
  color: doc.color,
  description: '',
  icon: 'list',
  ownerId: doc.userId,
  memberIds: [],
  isArchived: false,
  isFavorite: doc.isDefault,
  defaultView: 'list',
  createdAt: new Date(doc.$createdAt),
  updatedAt: new Date(doc.$updatedAt),
  position: 0,
  settings: {
    defaultPriority: 'medium',
    allowSubtasks: true,
    allowTimeTracking: true,
    allowRecurrence: true,
    showCompletedTasks: true,
  },
});

// Sample labels (hardcoded for now as there is no backend collection)
const DEFAULT_LABELS: Label[] = [
  { id: 'label-1', name: 'Bug', color: '#ef4444', description: 'Bug fixes and issues' },
  { id: 'label-2', name: 'Feature', color: '#10b981', description: 'New features' },
  { id: 'label-3', name: 'Enhancement', color: '#3b82f6', description: 'Improvements' },
  { id: 'label-4', name: 'Documentation', color: '#8b5cf6', description: 'Docs updates' },
  { id: 'label-5', name: 'Urgent', color: '#f59e0b', description: 'Needs immediate attention' },
  { id: 'label-6', name: 'Research', color: '#ec4899', description: 'Research tasks' },
];

// State
interface TaskState {
  tasks: Task[];
  projects: Project[];
  labels: Label[];
  selectedTaskId: string | null;
  selectedProjectId: string | null;
  filter: TaskFilter;
  sort: TaskSort;
  viewMode: ViewMode;
  activeView: AppView;
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  taskDialogOpen: boolean;
  searchQuery: string;
  userId: string | null;
}

const initialState: TaskState = {
  tasks: [],
  projects: [],
  labels: DEFAULT_LABELS,
  selectedTaskId: null,
  selectedProjectId: null,
  filter: {
    showCompleted: true,
    showArchived: false,
  },
  sort: {
    field: 'dueDate',
    direction: 'asc',
  },
  viewMode: 'list',
  activeView: 'dashboard',
  isLoading: true,
  error: null,
  sidebarOpen: true,
  taskDialogOpen: false,
  searchQuery: '',
  userId: null,
};

// Actions
type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA'; payload: { tasks: Task[]; projects: Project[] } }
  | { type: 'SET_USER'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'COMPLETE_TASK'; payload: string }
  | { type: 'SELECT_TASK'; payload: string | null }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<Project> } }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SELECT_PROJECT'; payload: string | null }
  | { type: 'ADD_LABEL'; payload: Label }
  | { type: 'UPDATE_LABEL'; payload: { id: string; updates: Partial<Label> } }
  | { type: 'DELETE_LABEL'; payload: string }
  | { type: 'SET_FILTER'; payload: TaskFilter }
  | { type: 'SET_SORT'; payload: TaskSort }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_ACTIVE_VIEW'; payload: AppView }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_TASK_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'ADD_SUBTASK'; payload: { taskId: string; subtask: Subtask } }
  | { type: 'UPDATE_SUBTASK'; payload: { taskId: string; subtaskId: string; updates: Partial<Subtask> } }
  | { type: 'DELETE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'TOGGLE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'ADD_COMMENT'; payload: { taskId: string; comment: Comment } }
  | { type: 'REORDER_TASKS'; payload: { taskIds: string[]; projectId?: string } };

// Reducer
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_DATA':
      return {
        ...state,
        tasks: action.payload.tasks,
        projects: action.payload.projects,
        isLoading: false,
      };

    case 'SET_USER':
      return { ...state, userId: action.payload };

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates, updatedAt: new Date() }
            : task
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        selectedTaskId: state.selectedTaskId === action.payload ? null : state.selectedTaskId,
      };

    case 'COMPLETE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? {
                ...task,
                status: task.status === 'done' ? 'todo' : 'done',
                completedAt: task.status === 'done' ? undefined : new Date(),
                updatedAt: new Date(),
              }
            : task
        ),
      };

    case 'SELECT_TASK':
      return { ...state, selectedTaskId: action.payload };

    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id
            ? { ...project, ...action.payload.updates, updatedAt: new Date() }
            : project
        ),
      };

    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        tasks: state.tasks.map(task =>
          task.projectId === action.payload ? { ...task, projectId: 'inbox' } : task
        ),
        selectedProjectId: state.selectedProjectId === action.payload ? null : state.selectedProjectId,
      };

    case 'SELECT_PROJECT':
      return { ...state, selectedProjectId: action.payload };

    case 'ADD_LABEL':
      return { ...state, labels: [...state.labels, action.payload] };

    case 'UPDATE_LABEL':
      return {
        ...state,
        labels: state.labels.map(label =>
          label.id === action.payload.id ? { ...label, ...action.payload.updates } : label
        ),
      };

    case 'DELETE_LABEL':
      return {
        ...state,
        labels: state.labels.filter(label => label.id !== action.payload),
        tasks: state.tasks.map(task => ({
          ...task,
          labels: task.labels.filter(l => l !== action.payload),
        })),
      };

    case 'SET_FILTER':
      return { ...state, filter: action.payload };

    case 'SET_SORT':
      return { ...state, sort: action.payload };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };

    case 'SET_TASK_DIALOG_OPEN':
      return { ...state, taskDialogOpen: action.payload };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'ADD_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? { ...task, subtasks: [...task.subtasks, action.payload.subtask], updatedAt: new Date() }
            : task
        ),
      };

    case 'UPDATE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {
                ...task,
                subtasks: task.subtasks.map(st =>
                  st.id === action.payload.subtaskId ? { ...st, ...action.payload.updates } : st
                ),
                updatedAt: new Date(),
              }
            : task
        ),
      };

    case 'DELETE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {
                ...task,
                subtasks: task.subtasks.filter(st => st.id !== action.payload.subtaskId),
                updatedAt: new Date(),
              }
            : task
        ),
      };

    case 'TOGGLE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {
                ...task,
                subtasks: task.subtasks.map(st =>
                  st.id === action.payload.subtaskId
                    ? { ...st, completed: !st.completed, completedAt: !st.completed ? new Date() : undefined }
                    : st
                ),
                updatedAt: new Date(),
              }
            : task
        ),
      };

    case 'ADD_COMMENT':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? { ...task, comments: [...task.comments, action.payload.comment], updatedAt: new Date() }
            : task
        ),
      };

    case 'REORDER_TASKS':
      return {
        ...state,
        tasks: state.tasks.map(task => {
          const newPosition = action.payload.taskIds.indexOf(task.id);
          if (newPosition !== -1) {
            return { ...task, position: newPosition };
          }
          return task;
        }),
      };

    default:
      return state;
  }
}

// Context
interface TaskContextType extends TaskState {
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'position'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  selectTask: (id: string | null) => void;
  // Subtask actions
  addSubtask: (taskId: string, title: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  // Comment actions
  addComment: (taskId: string, content: string) => void;
  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'position'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  selectProject: (id: string | null) => void;
  // Label actions
  addLabel: (label: Omit<Label, 'id'>) => void;
  updateLabel: (id: string, updates: Partial<Label>) => void;
  deleteLabel: (id: string) => void;
  // Filter and sort actions
  setFilter: (filter: TaskFilter) => void;
  setSort: (sort: TaskSort) => void;
  setViewMode: (mode: ViewMode) => void;
  setActiveView: (view: AppView) => void;
  // UI actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTaskDialogOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  // Computed values
  getFilteredTasks: () => Task[];
  getTasksByProject: (projectId: string) => Task[];
  getTaskStats: () => { total: number; completed: number; overdue: number; dueToday: number };
  getSelectedTask: () => Task | null;
  getSelectedProject: () => Project | null;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

// Provider
interface TaskProviderProps {
  children: ReactNode;
}

export function TaskProvider({ children }: TaskProviderProps) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Get current user
        let userId = 'guest';
        try {
          const user = await account.get();
          userId = user.$id;
          dispatch({ type: 'SET_USER', payload: userId });
        } catch (e) {
          console.warn('Not logged in', e);
        }

        // Fetch tasks and calendars
        const [tasksList, calendarsList] = await Promise.all([
          taskApi.list(),
          calendarApi.list()
        ]);

        const tasks = tasksList.rows.map(mapAppwriteTaskToTask);
        const projects = calendarsList.rows.map(mapAppwriteCalendarToProject);

        dispatch({ type: 'SET_DATA', payload: { tasks, projects } });
      } catch (error) {
        console.error('Failed to fetch data', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
      }
    };

    fetchData();
  }, []);

  // Task actions
  const addTask = useCallback(
    async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'position'>) => {
      try {
        const userId = state.userId || 'guest';
        // Prepare tags with project ID
        const tags = [...(task.labels || [])];
        if (task.projectId && task.projectId !== 'inbox') {
          tags.push(`project:${task.projectId}`);
        }

        const newTask = await taskApi.create({
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate?.toISOString() || '',
          userId: userId,
          tags: tags,
          assigneeIds: task.assigneeIds || [],
          attachmentIds: [],
          eventId: '',
          parentId: '',
          recurrenceRule: task.recurrence ? JSON.stringify(task.recurrence) : '',
        });

        dispatch({ type: 'ADD_TASK', payload: mapAppwriteTaskToTask(newTask) });
      } catch (error) {
        console.error('Failed to create task', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create task' });
      }
    },
    [state.userId]
  );

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      // Optimistic update
      dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });

      const apiUpdates: any = {};
      if (updates.title !== undefined) apiUpdates.title = updates.title;
      if (updates.description !== undefined) apiUpdates.description = updates.description;
      if (updates.status !== undefined) apiUpdates.status = updates.status;
      if (updates.priority !== undefined) apiUpdates.priority = updates.priority;
      if (updates.dueDate !== undefined) apiUpdates.dueDate = updates.dueDate?.toISOString();
      if (updates.projectId !== undefined) {
         // We need to fetch current tags to update project tag
         // For now, this is complex without reading current task state inside callback
         // Assuming we can just append or we might need to handle this better.
         // Skipping tag update for project change for simplicity in this iteration
      }

      await taskApi.update(id, apiUpdates);
    } catch (error) {
      console.error('Failed to update task', error);
      // Revert?
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await taskApi.delete(id);
      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  }, []);

  const completeTask = useCallback(async (id: string) => {
    try {
      const task = state.tasks.find(t => t.id === id);
      if (!task) return;
      
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      await taskApi.update(id, { status: newStatus });
      dispatch({ type: 'COMPLETE_TASK', payload: id });
    } catch (error) {
      console.error('Failed to complete task', error);
    }
  }, [state.tasks]);

  const selectTask = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_TASK', payload: id });
  }, []);

  // Subtask actions (Local only for now)
  const addSubtask = useCallback((taskId: string, title: string) => {
    const subtask: Subtask = {
      id: ID.unique(),
      title,
      completed: false,
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_SUBTASK', payload: { taskId, subtask } });
  }, []);

  const updateSubtask = useCallback((taskId: string, subtaskId: string, updates: Partial<Subtask>) => {
    dispatch({ type: 'UPDATE_SUBTASK', payload: { taskId, subtaskId, updates } });
  }, []);

  const deleteSubtask = useCallback((taskId: string, subtaskId: string) => {
    dispatch({ type: 'DELETE_SUBTASK', payload: { taskId, subtaskId } });
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId, subtaskId } });
  }, []);

  // Comment actions (Local only for now)
  const addComment = useCallback((taskId: string, content: string) => {
    const comment: Comment = {
      id: ID.unique(),
      content,
      authorId: state.userId || 'user',
      authorName: 'You',
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_COMMENT', payload: { taskId, comment } });
  }, [state.userId]);

  // Project actions
  const addProject = useCallback(
    async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'position'>) => {
      try {
        const userId = state.userId || 'guest';
        const newCalendar = await calendarApi.create({
          name: project.name,
          color: project.color,
          isDefault: false,
          userId: userId,
        });
        dispatch({ type: 'ADD_PROJECT', payload: mapAppwriteCalendarToProject(newCalendar) });
      } catch (error) {
        console.error('Failed to create project', error);
      }
    },
    [state.userId]
  );

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
      
      const apiUpdates: any = {};
      if (updates.name) apiUpdates.name = updates.name;
      if (updates.color) apiUpdates.color = updates.color;
      
      await calendarApi.update(id, apiUpdates);
    } catch (error) {
      console.error('Failed to update project', error);
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await calendarApi.delete(id);
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    } catch (error) {
      console.error('Failed to delete project', error);
    }
  }, []);

  const selectProject = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_PROJECT', payload: id });
  }, []);

  // Label actions (Local only)
  const addLabel = useCallback((label: Omit<Label, 'id'>) => {
    const newLabel: Label = {
      ...label,
      id: ID.unique(),
    };
    dispatch({ type: 'ADD_LABEL', payload: newLabel });
  }, []);

  const updateLabel = useCallback((id: string, updates: Partial<Label>) => {
    dispatch({ type: 'UPDATE_LABEL', payload: { id, updates } });
  }, []);

  const deleteLabel = useCallback((id: string) => {
    dispatch({ type: 'DELETE_LABEL', payload: id });
  }, []);

  // Filter and sort
  const setFilter = useCallback((filter: TaskFilter) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  const setSort = useCallback((sort: TaskSort) => {
    dispatch({ type: 'SET_SORT', payload: sort });
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  const setActiveView = useCallback((view: AppView) => {
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: view });
  }, []);

  // UI
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
  }, []);

  const setTaskDialogOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_TASK_DIALOG_OPEN', payload: open });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  // Computed values
  const getFilteredTasks = useCallback(() => {
    let filtered = [...state.tasks];

    // Apply filters
    if (state.filter.status?.length) {
      filtered = filtered.filter(t => state.filter.status!.includes(t.status));
    }
    if (state.filter.priority?.length) {
      filtered = filtered.filter(t => state.filter.priority!.includes(t.priority));
    }
    if (state.filter.projectId !== undefined) {
      filtered = filtered.filter(t => t.projectId === state.filter.projectId);
    }
    if (state.filter.labels?.length) {
      filtered = filtered.filter(t => t.labels.some(l => state.filter.labels!.includes(l)));
    }
    if (!state.filter.showCompleted) {
      filtered = filtered.filter(t => t.status !== 'done');
    }
    if (!state.filter.showArchived) {
      filtered = filtered.filter(t => !t.isArchived);
    }
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const { field, direction } = state.sort;
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (field) {
        case 'dueDate':
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = aDate - bDate;
          break;
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          const statusOrder = { todo: 0, 'in-progress': 1, blocked: 2, done: 3, cancelled: 4 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'position':
          comparison = a.position - b.position;
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [state.tasks, state.filter, state.sort, state.searchQuery]);

  const getTasksByProject = useCallback(
    (projectId: string) => {
      return state.tasks.filter(t => t.projectId === projectId && !t.isArchived);
    },
    [state.tasks]
  );

  const getTaskStats = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeTasks = state.tasks.filter(t => !t.isArchived);
    const completed = activeTasks.filter(t => t.status === 'done').length;
    const overdue = activeTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
    ).length;
    const dueToday = activeTasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      const due = new Date(t.dueDate);
      return due >= today && due < tomorrow;
    }).length;

    return {
      total: activeTasks.length,
      completed,
      overdue,
      dueToday,
    };
  }, [state.tasks]);

  const getSelectedTask = useCallback(() => {
    return state.tasks.find(t => t.id === state.selectedTaskId) || null;
  }, [state.tasks, state.selectedTaskId]);

  const getSelectedProject = useCallback(() => {
    return state.projects.find(p => p.id === state.selectedProjectId) || null;
  }, [state.projects, state.selectedProjectId]);

  const value: TaskContextType = {
    ...state,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    selectTask,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    toggleSubtask,
    addComment,
    addProject,
    updateProject,
    deleteProject,
    selectProject,
    addLabel,
    updateLabel,
    deleteLabel,
    setFilter,
    setSort,
    setViewMode,
    setActiveView,
    toggleSidebar,
    setSidebarOpen,
    setTaskDialogOpen,
    setSearchQuery,
    getFilteredTasks,
    getTasksByProject,
    getTaskStats,
    getSelectedTask,
    getSelectedProject,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}
