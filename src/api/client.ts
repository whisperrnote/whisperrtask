import type { Task, Workspace, Project, Comment, Notification } from '../types'

export class APIClient {
  private baseURL: string

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return []
  }

  async createWorkspace(data: Partial<Workspace>): Promise<Workspace> {
    throw new Error('Not implemented')
  }

  async getProjects(workspaceId: string): Promise<Project[]> {
    return []
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    throw new Error('Not implemented')
  }

  async getTasks(projectId: string): Promise<Task[]> {
    return []
  }

  async getMyTasks(): Promise<Task[]> {
    return []
  }

  async createTask(data: Partial<Task>): Promise<Task> {
    throw new Error('Not implemented')
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    throw new Error('Not implemented')
  }

  async deleteTask(id: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async getComments(taskId: string): Promise<Comment[]> {
    return []
  }

  async createComment(data: Partial<Comment>): Promise<Comment> {
    throw new Error('Not implemented')
  }

  async getNotifications(): Promise<Notification[]> {
    return []
  }

  async markNotificationRead(id: string): Promise<void> {
    throw new Error('Not implemented')
  }
}

export const apiClient = new APIClient()
