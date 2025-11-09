import type { Task, Project, Workspace, ContextLink } from '../types'
import type { 
  WhisperrNoteTaskPayload, 
  WhisperrMeetActionItemPayload 
} from '../lib/event-schemas'
import { EVENT_TYPES } from '../lib/event-schemas'
import { ecosystemBridge } from '../lib/ecosystem-bridge'
import { contextGraph } from '../lib/context-graph'
import { aiOrchestrator } from '../lib/ai-orchestrator'
import { calculateValueScore, calculateEffortScore } from '../lib/ai-engine'

export interface CreateTaskInput {
  projectId: string
  title: string
  description?: string
  status?: Task['status']
  assigneeIds?: string[]
  dueDate?: Date
  contextLinks?: ContextLink[]
  source?: {
    type: 'manual' | 'whisperrnote' | 'whisperrmeet' | 'ai-generated'
    metadata?: Record<string, any>
  }
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: Task['status']
  assigneeIds?: string[]
  dueDate?: Date
  valueScore?: number
  effortScore?: number
}

export class TaskService {
  private static instance: TaskService
  private tasks: Map<string, Task> = new Map()
  private projects: Map<string, Project> = new Map()
  private workspaces: Map<string, Workspace> = new Map()

  private constructor() {
    this.setupEventHandlers()
    this.loadPersistedData()
  }

  static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService()
    }
    return TaskService.instance
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const task: Task = {
      id: this.generateId('tsk'),
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      status: input.status || 'todo',
      assigneeIds: input.assigneeIds || [],
      dueDate: input.dueDate,
      contextLinks: input.contextLinks || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: this.getCurrentUserId(),
    }

    // Calculate AI scores
    task.valueScore = await this.calculateValueScore(task)
    task.effortScore = await this.calculateEffortScore(task)

    // Add to context graph
    contextGraph.addNode({
      id: task.id,
      type: 'task',
      app: 'whisperrtask',
      data: {
        title: task.title,
        description: task.description,
        projectId: task.projectId,
      },
      metadata: {
        keywords: this.extractKeywords(task.title, task.description),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    })

    // Connect to related context
    if (input.contextLinks && input.contextLinks.length > 0) {
      for (const link of input.contextLinks) {
        contextGraph.addEdge({
          id: this.generateId('edge'),
          source: task.id,
          target: link.resourceId,
          type: 'references',
          weight: 1.0,
          metadata: {
            linkType: link.type,
            sourceApp: link.sourceApp,
          },
        })
      }
    }

    this.tasks.set(task.id, task)
    this.persistTasks()

    // Emit task created event
    ecosystemBridge.emit({
      type: EVENT_TYPES.TASK_CREATED,
      source: 'whisperrtask',
      version: '1.0',
      payload: {
        task,
        source: input.source,
      },
      metadata: {
        userId: this.getCurrentUserId(),
        priority: 'normal',
      },
    })

    // If from ecosystem source, broadcast back for bidirectional sync
    if (input.source?.type === 'whisperrnote' || input.source?.type === 'whisperrmeet') {
      ecosystemBridge.broadcastToEcosystem({
        id: this.generateId('evt'),
        type: EVENT_TYPES.TASK_CREATED,
        source: 'whisperrtask',
        target: input.source.type as any,
        version: '1.0',
        timestamp: Date.now(),
        payload: {
          taskId: task.id,
          originalResourceId: input.source.metadata?.resourceId,
        },
        metadata: {
          userId: this.getCurrentUserId(),
        },
      })
    }

    return task
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task | null> {
    const task = this.tasks.get(taskId)
    if (!task) return null

    const oldStatus = task.status
    
    // Update fields
    Object.assign(task, {
      ...input,
      updatedAt: new Date(),
    })

    // Recalculate scores if needed
    if (input.title || input.description) {
      task.valueScore = await this.calculateValueScore(task)
      task.effortScore = await this.calculateEffortScore(task)
    }

    // Update context graph
    const node = contextGraph.getNode(taskId)
    if (node) {
      node.data = {
        ...node.data,
        title: task.title,
        description: task.description,
      }
      node.metadata.keywords = this.extractKeywords(task.title, task.description)
      node.metadata.updatedAt = Date.now()
      contextGraph.addNode(node) // This will update the existing node
    }

    this.tasks.set(taskId, task)
    this.persistTasks()

    // Emit appropriate events
    if (input.status && input.status !== oldStatus) {
      ecosystemBridge.emit({
        type: EVENT_TYPES.TASK_STATUS_CHANGED,
        source: 'whisperrtask',
        version: '1.0',
        payload: {
          taskId,
          oldStatus,
          newStatus: input.status,
          completedBy: input.status === 'completed' ? this.getCurrentUserId() : undefined,
          completedAt: input.status === 'completed' ? Date.now() : undefined,
        },
        metadata: {
          userId: this.getCurrentUserId(),
          priority: 'normal',
        },
      })

      // Broadcast to ecosystem for bidirectional sync
      if (task.contextLinks.some(link => link.sourceApp === 'whisperrnote')) {
        ecosystemBridge.broadcastToEcosystem({
          id: this.generateId('evt'),
          type: input.status === 'completed' ? EVENT_TYPES.NOTE_TASK_CHECKED : EVENT_TYPES.NOTE_TASK_UNCHECKED,
          source: 'whisperrtask',
          target: 'whisperrnote',
          version: '1.0',
          timestamp: Date.now(),
          payload: { taskId },
          metadata: { userId: this.getCurrentUserId() },
        })
      }
    }

    return task
  }

  async createTaskFromNote(payload: WhisperrNoteTaskPayload): Promise<Task> {
    // Find or create project for notes
    const project = await this.getOrCreateNotesProject()

    const contextLink: ContextLink = {
      id: this.generateId('ctx'),
      type: 'note',
      sourceApp: 'whisperrnote',
      resourceId: payload.noteId,
      title: payload.noteTitle,
      snippet: payload.noteSnippet,
      url: payload.noteUrl,
    }

    return this.createTask({
      projectId: project.id,
      title: payload.checkboxText,
      description: `Created from note: ${payload.noteTitle}\n\n${payload.noteSnippet}`,
      contextLinks: [contextLink],
      source: {
        type: 'whisperrnote',
        metadata: {
          noteId: payload.noteId,
          checkboxIndex: payload.checkboxIndex,
          resourceId: payload.noteId,
        },
      },
    })
  }

  async createTaskFromMeeting(payload: WhisperrMeetActionItemPayload): Promise<Task> {
    // Find or create project for meetings
    const project = await this.getOrCreateMeetingsProject()

    // Extract assignee from participants
    const assigneeEmail = this.extractAssigneeFromActionItem(
      payload.actionItem,
      payload.speaker,
      payload.participants
    )
    const assignee = payload.participants.find(p => p.email === assigneeEmail)

    const contextLink: ContextLink = {
      id: this.generateId('ctx'),
      type: 'meeting',
      sourceApp: 'whisperrmeet',
      resourceId: payload.meetingId,
      title: payload.meetingTitle,
      snippet: payload.transcript,
      timestamp: payload.timestamp,
      url: payload.audioUrl,
    }

    // Extract due date from action item
    const dueDate = this.extractDueDateFromText(payload.actionItem)

    return this.createTask({
      projectId: project.id,
      title: payload.actionItem,
      description: `Action item from meeting: ${payload.meetingTitle}\n\nSpeaker: ${payload.speaker}\nTimestamp: ${new Date(payload.timestamp).toLocaleString()}\n\nContext:\n${payload.transcript}`,
      assigneeIds: assignee ? [assignee.id] : [],
      dueDate,
      contextLinks: [contextLink],
      source: {
        type: 'whisperrmeet',
        metadata: {
          meetingId: payload.meetingId,
          timestamp: payload.timestamp,
          speaker: payload.speaker,
          resourceId: payload.meetingId,
        },
      },
    })
  }

  getTask(taskId: string): Task | null {
    return this.tasks.get(taskId) || null
  }

  getTasks(filter?: {
    projectId?: string
    status?: Task['status'][]
    assigneeIds?: string[]
  }): Task[] {
    let tasks = Array.from(this.tasks.values())

    if (filter) {
      if (filter.projectId) {
        tasks = tasks.filter(t => t.projectId === filter.projectId)
      }
      if (filter.status && filter.status.length > 0) {
        tasks = tasks.filter(t => filter.status!.includes(t.status))
      }
      if (filter.assigneeIds && filter.assigneeIds.length > 0) {
        tasks = tasks.filter(t => 
          t.assigneeIds.some(id => filter.assigneeIds!.includes(id))
        )
      }
    }

    return tasks
  }

  private setupEventHandlers(): void {
    // Handle note task creation
    ecosystemBridge.subscribe(
      EVENT_TYPES.NOTE_TASK_CREATED,
      async (event) => {
        if (event.target === 'whisperrtask' || !event.target) {
          await this.createTaskFromNote(event.payload as WhisperrNoteTaskPayload)
        }
      }
    )

    // Handle meeting action items
    ecosystemBridge.subscribe(
      EVENT_TYPES.MEET_ACTION_ITEM_DETECTED,
      async (event) => {
        if (event.target === 'whisperrtask' || !event.target) {
          await this.createTaskFromMeeting(event.payload as WhisperrMeetActionItemPayload)
        }
      }
    )

    // Handle note checkbox state changes
    ecosystemBridge.subscribe(
      EVENT_TYPES.NOTE_TASK_CHECKED,
      async (event) => {
        const { taskId } = event.payload
        await this.updateTask(taskId, { status: 'completed' })
      }
    )

    ecosystemBridge.subscribe(
      EVENT_TYPES.NOTE_TASK_UNCHECKED,
      async (event) => {
        const { taskId } = event.payload
        await this.updateTask(taskId, { status: 'todo' })
      }
    )
  }

  private async calculateValueScore(task: Task): Promise<number> {
    // Use AI to calculate value score based on context
    const relatedNotes = task.contextLinks.filter(l => l.type === 'note')
    const relatedMeetings = task.contextLinks.filter(l => l.type === 'meeting')

    // For now, use simple calculation - will be enhanced with AI
    let score = 50 // Base score

    // Increase score based on context
    score += relatedNotes.length * 10
    score += relatedMeetings.length * 15

    // Increase score if has due date
    if (task.dueDate) {
      score += 20
    }

    // Increase score if assigned
    if (task.assigneeIds.length > 0) {
      score += 10
    }

    return Math.min(100, score)
  }

  private async calculateEffortScore(task: Task): Promise<number> {
    // Use AI to calculate effort score
    // For now, use simple heuristics
    let score = 50 // Base score

    // Analyze task title/description complexity
    const textLength = (task.title + (task.description || '')).length
    if (textLength > 200) score += 20
    if (textLength > 500) score += 30

    // If has subtasks (not implemented yet), increase effort
    // if (task.subtasks?.length > 0) score += task.subtasks.length * 10

    return Math.min(100, score)
  }

  private extractKeywords(title?: string, description?: string): string[] {
    const text = `${title || ''} ${description || ''}`.toLowerCase()
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for'])
    
    return text
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
  }

  private extractAssigneeFromActionItem(
    actionItem: string,
    speaker: string,
    participants: Array<{ id: string; name: string; email: string }>
  ): string | null {
    const lowerAction = actionItem.toLowerCase()
    
    // Look for "I will" pattern - assign to speaker
    if (lowerAction.includes('i will') || lowerAction.includes("i'll")) {
      const speakerParticipant = participants.find(p => 
        p.name.toLowerCase() === speaker.toLowerCase()
      )
      return speakerParticipant?.email || null
    }

    // Look for participant names in action item
    for (const participant of participants) {
      if (lowerAction.includes(participant.name.toLowerCase())) {
        return participant.email
      }
    }

    return null
  }

  private extractDueDateFromText(text: string): Date | undefined {
    const lowerText = text.toLowerCase()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Common patterns
    if (lowerText.includes('tomorrow')) {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow
    }

    if (lowerText.includes('next week')) {
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      return nextWeek
    }

    if (lowerText.includes('by friday') || lowerText.includes('on friday')) {
      const friday = new Date(today)
      const dayOfWeek = friday.getDay()
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
      friday.setDate(friday.getDate() + daysUntilFriday)
      return friday
    }

    // Look for specific dates (simplified)
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)
    if (dateMatch) {
      const month = parseInt(dateMatch[1]) - 1
      const day = parseInt(dateMatch[2])
      const year = dateMatch[3] ? parseInt(dateMatch[3]) : today.getFullYear()
      return new Date(year, month, day)
    }

    return undefined
  }

  private async getOrCreateNotesProject(): Promise<Project> {
    const workspace = await this.getOrCreateDefaultWorkspace()
    const projectId = `${workspace.id}-notes`
    
    let project = this.projects.get(projectId)
    if (!project) {
      project = {
        id: projectId,
        workspaceId: workspace.id,
        name: 'Notes & Ideas',
        description: 'Tasks created from WhisperrNote',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      this.projects.set(projectId, project)
      this.persistProjects()
    }

    return project
  }

  private async getOrCreateMeetingsProject(): Promise<Project> {
    const workspace = await this.getOrCreateDefaultWorkspace()
    const projectId = `${workspace.id}-meetings`
    
    let project = this.projects.get(projectId)
    if (!project) {
      project = {
        id: projectId,
        workspaceId: workspace.id,
        name: 'Meeting Action Items',
        description: 'Tasks created from WhisperrMeet',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      this.projects.set(projectId, project)
      this.persistProjects()
    }

    return project
  }

  private async getOrCreateDefaultWorkspace(): Promise<Workspace> {
    const workspaceId = 'default-workspace'
    
    let workspace = this.workspaces.get(workspaceId)
    if (!workspace) {
      workspace = {
        id: workspaceId,
        name: 'My Workspace',
        description: 'Default workspace',
        ownerId: this.getCurrentUserId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      this.workspaces.set(workspaceId, workspace)
      this.persistWorkspaces()
    }

    return workspace
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentUserId(): string {
    // In production, this would come from auth context
    return 'current-user-id'
  }

  private persistTasks(): void {
    if (typeof window !== 'undefined') {
      const data = Array.from(this.tasks.entries())
      localStorage.setItem('whisperrtask_tasks', JSON.stringify(data))
    }
  }

  private persistProjects(): void {
    if (typeof window !== 'undefined') {
      const data = Array.from(this.projects.entries())
      localStorage.setItem('whisperrtask_projects', JSON.stringify(data))
    }
  }

  private persistWorkspaces(): void {
    if (typeof window !== 'undefined') {
      const data = Array.from(this.workspaces.entries())
      localStorage.setItem('whisperrtask_workspaces', JSON.stringify(data))
    }
  }

  private loadPersistedData(): void {
    if (typeof window === 'undefined') return

    try {
      // Load tasks
      const tasksData = localStorage.getItem('whisperrtask_tasks')
      if (tasksData) {
        const parsed = JSON.parse(tasksData)
        this.tasks = new Map(parsed.map(([id, task]: [string, any]) => [
          id,
          {
            ...task,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          },
        ]))
      }

      // Load projects
      const projectsData = localStorage.getItem('whisperrtask_projects')
      if (projectsData) {
        const parsed = JSON.parse(projectsData)
        this.projects = new Map(parsed.map(([id, project]: [string, any]) => [
          id,
          {
            ...project,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
          },
        ]))
      }

      // Load workspaces
      const workspacesData = localStorage.getItem('whisperrtask_workspaces')
      if (workspacesData) {
        const parsed = JSON.parse(workspacesData)
        this.workspaces = new Map(parsed.map(([id, workspace]: [string, any]) => [
          id,
          {
            ...workspace,
            createdAt: new Date(workspace.createdAt),
            updatedAt: new Date(workspace.updatedAt),
          },
        ]))
      }
    } catch (error) {
      console.error('Failed to load persisted data:', error)
    }
  }
}

export const taskService = TaskService.getInstance()