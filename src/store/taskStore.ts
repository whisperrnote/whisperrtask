import { create } from 'zustand'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  dueDate?: string
  assignees?: string[]
  projectId: string
  workspaceId: string
  createdAt: string
  updatedAt: string
}

interface TaskState {
  tasks: Task[]
  addTask: (task: Task) => void
  updateTask: (id: string, task: Partial<Task>) => void
  removeTask: (id: string) => void
  getTasks: () => Task[]
  getTasksByProject: (projectId: string) => Task[]
  setTasks: (tasks: Task[]) => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
  getTasks: () => get().tasks,
  getTasksByProject: (projectId) =>
    get().tasks.filter((t) => t.projectId === projectId),
  setTasks: (tasks) => set({ tasks }),
}))
