import type { Task } from '../types'
import type { EcosystemApp } from '../types/events'
import { ecosystemBridge } from '../lib/ecosystem-bridge'
import { EVENT_TYPES } from '../lib/event-schemas'
import { taskService } from './task.service'
import { contextGraph } from '../lib/context-graph'

export interface Command {
  id: string
  name: string
  description: string
  shortcut?: string
  icon?: string
  category: 'task' | 'navigation' | 'search' | 'ecosystem' | 'settings'
  handler: (args: any) => Promise<void> | void
  keywords?: string[]
}

export interface CommandResult {
  command: Command
  args?: any
  confidence: number
}

export interface ParsedCommand {
  action: string
  entity: string
  attributes: Record<string, any>
  raw: string
}

export class CommandPaletteService {
  private static instance: CommandPaletteService
  private commands: Map<string, Command> = new Map()
  private history: string[] = []
  private favorites: Set<string> = new Set()

  private constructor() {
    this.registerDefaultCommands()
    this.loadPersistedData()
  }

  static getInstance(): CommandPaletteService {
    if (!CommandPaletteService.instance) {
      CommandPaletteService.instance = new CommandPaletteService()
    }
    return CommandPaletteService.instance
  }

  registerCommand(command: Command): void {
    this.commands.set(command.id, command)
  }

  async executeCommand(input: string): Promise<void> {
    // Add to history
    this.addToHistory(input)

    // Parse natural language command
    const parsed = this.parseNaturalLanguage(input)
    
    // Find matching command
    const result = this.findBestMatch(parsed)
    
    if (result) {
      // Track command execution
      ecosystemBridge.emit({
        type: EVENT_TYPES.COMMAND_EXECUTED,
        source: 'whisperrtask',
        version: '1.0',
        payload: {
          command: result.command.id,
          input,
          args: result.args,
        },
        metadata: {
          userId: this.getCurrentUserId(),
          priority: 'normal',
        },
      })

      // Execute command
      await result.command.handler(result.args)
    } else {
      // Fallback to search if no command matches
      await this.executeSearch(input)
    }
  }

  searchCommands(query: string): Command[] {
    const lowerQuery = query.toLowerCase()
    const results: Array<{ command: Command; score: number }> = []

    for (const command of this.commands.values()) {
      let score = 0

      // Check name match
      if (command.name.toLowerCase().includes(lowerQuery)) {
        score += 10
      }

      // Check description match
      if (command.description.toLowerCase().includes(lowerQuery)) {
        score += 5
      }

      // Check keywords match
      if (command.keywords) {
        for (const keyword of command.keywords) {
          if (keyword.toLowerCase().includes(lowerQuery) || 
              lowerQuery.includes(keyword.toLowerCase())) {
            score += 3
          }
        }
      }

      if (score > 0) {
        results.push({ command, score })
      }
    }

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(r => r.command)
  }

  getHistory(): string[] {
    return [...this.history]
  }

  getFavorites(): Command[] {
    return Array.from(this.favorites)
      .map(id => this.commands.get(id))
      .filter(Boolean) as Command[]
  }

  toggleFavorite(commandId: string): void {
    if (this.favorites.has(commandId)) {
      this.favorites.delete(commandId)
    } else {
      this.favorites.add(commandId)
    }
    this.persistData()
  }

  private parseNaturalLanguage(input: string): ParsedCommand {
    const lower = input.toLowerCase().trim()
    const attributes: Record<string, any> = {}

    // Extract due date
    const dueMatch = lower.match(/\/(?:due|by)\s+(\w+(?:\s+\w+)?)/i)
    if (dueMatch) {
      attributes.dueDate = this.parseDueDate(dueMatch[1])
    }

    // Extract project/tags
    const tagMatches = input.matchAll(/#(\w+)/g)
    const tags: string[] = []
    for (const match of tagMatches) {
      tags.push(match[1])
    }
    if (tags.length > 0) {
      attributes.tags = tags
    }

    // Extract assignee
    const assigneeMatch = input.match(/@(\w+)/i)
    if (assigneeMatch) {
      attributes.assignee = assigneeMatch[1]
    }

    // Determine action and entity
    let action = 'create'
    let entity = 'task'

    if (lower.startsWith('create task:') || lower.startsWith('add task:')) {
      action = 'create'
      entity = 'task'
    } else if (lower.startsWith('find:') || lower.startsWith('search:')) {
      action = 'search'
      entity = 'all'
    } else if (lower.startsWith('start meeting:') || lower.startsWith('meet:')) {
      action = 'start'
      entity = 'meeting'
    } else if (lower.startsWith('get:') || lower.startsWith('credential:')) {
      action = 'get'
      entity = 'credential'
    } else if (lower.includes('goto') || lower.includes('navigate')) {
      action = 'navigate'
      entity = 'view'
    }

    // Clean up the main text
    let cleanText = input
      .replace(/\/(?:due|by)\s+\w+(?:\s+\w+)?/gi, '')
      .replace(/#\w+/g, '')
      .replace(/@\w+/g, '')
      .replace(/^(create task:|add task:|find:|search:|start meeting:|meet:|get:|credential:)/i, '')
      .trim()

    attributes.text = cleanText

    return {
      action,
      entity,
      attributes,
      raw: input,
    }
  }

  private findBestMatch(parsed: ParsedCommand): CommandResult | null {
    const candidates: CommandResult[] = []

    for (const command of this.commands.values()) {
      let confidence = 0

      // Match by category and action
      if (command.category === 'task' && parsed.entity === 'task') {
        confidence += 50
      } else if (command.category === 'search' && parsed.action === 'search') {
        confidence += 50
      } else if (command.category === 'ecosystem' && 
                 (parsed.entity === 'meeting' || parsed.entity === 'credential')) {
        confidence += 50
      }

      // Additional matching logic based on keywords
      if (command.keywords) {
        const rawLower = parsed.raw.toLowerCase()
        for (const keyword of command.keywords) {
          if (rawLower.includes(keyword)) {
            confidence += 10
          }
        }
      }

      if (confidence > 0) {
        candidates.push({
          command,
          args: parsed.attributes,
          confidence,
        })
      }
    }

    // Return the best match
    return candidates.sort((a, b) => b.confidence - a.confidence)[0] || null
  }

  private parseDueDate(dateStr: string): Date {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lower = dateStr.toLowerCase()

    if (lower === 'today') {
      return today
    } else if (lower === 'tomorrow') {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow
    } else if (lower === 'friday' || lower === 'next friday') {
      const friday = new Date(today)
      const dayOfWeek = friday.getDay()
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
      friday.setDate(friday.getDate() + daysUntilFriday)
      return friday
    } else if (lower === 'next week') {
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      return nextWeek
    }

    // Default to today if parsing fails
    return today
  }

  private registerDefaultCommands(): void {
    // Task commands
    this.registerCommand({
      id: 'create-task',
      name: 'Create Task',
      description: 'Create a new task with natural language',
      category: 'task',
      keywords: ['add', 'new', 'create', 'task', 'todo'],
      handler: async (args) => {
        const project = await taskService.getOrCreateDefaultProject()
        await taskService.createTask({
          projectId: project.id,
          title: args.text || 'New Task',
          dueDate: args.dueDate,
          assigneeIds: args.assignee ? [args.assignee] : [],
        })
      },
    })

    // Search commands
    this.registerCommand({
      id: 'search-all',
      name: 'Search Everything',
      description: 'Search across all ecosystem apps',
      category: 'search',
      keywords: ['find', 'search', 'query'],
      handler: async (args) => {
        await this.executeSearch(args.text || '')
      },
    })

    // Navigation commands
    this.registerCommand({
      id: 'navigate-hub',
      name: 'Go to Hub',
      description: 'Navigate to Whisperr Hub',
      shortcut: 'g h',
      category: 'navigation',
      keywords: ['hub', 'inbox', 'notifications'],
      handler: () => {
        window.location.href = '/hub'
      },
    })

    this.registerCommand({
      id: 'navigate-tasks',
      name: 'Go to Tasks',
      description: 'Navigate to Tasks view',
      shortcut: 'g t',
      category: 'navigation',
      keywords: ['tasks', 'todo', 'work'],
      handler: () => {
        window.location.href = '/tasks'
      },
    })

    this.registerCommand({
      id: 'navigate-workspaces',
      name: 'Go to Workspaces',
      description: 'Navigate to Workspaces',
      shortcut: 'g w',
      category: 'navigation',
      keywords: ['workspaces', 'projects'],
      handler: () => {
        window.location.href = '/workspaces'
      },
    })

    // Ecosystem commands
    this.registerCommand({
      id: 'start-meeting',
      name: 'Start Meeting',
      description: 'Start a new WhisperrMeet',
      category: 'ecosystem',
      keywords: ['meeting', 'meet', 'call'],
      handler: async (args) => {
        ecosystemBridge.broadcastToEcosystem({
          id: this.generateId(),
          type: 'ecosystem.command.cross_app',
          source: 'whisperrtask',
          target: 'whisperrmeet',
          version: '1.0',
          timestamp: Date.now(),
          payload: {
            command: 'start-meeting',
            title: args.text || 'Quick Meeting',
          },
          metadata: {
            userId: this.getCurrentUserId(),
          },
        })
      },
    })

    this.registerCommand({
      id: 'create-note',
      name: 'Create Note',
      description: 'Create a new WhisperrNote',
      category: 'ecosystem',
      keywords: ['note', 'write', 'document'],
      handler: async (args) => {
        ecosystemBridge.broadcastToEcosystem({
          id: this.generateId(),
          type: 'ecosystem.command.cross_app',
          source: 'whisperrtask',
          target: 'whisperrnote',
          version: '1.0',
          timestamp: Date.now(),
          payload: {
            command: 'create-note',
            title: args.text || 'New Note',
          },
          metadata: {
            userId: this.getCurrentUserId(),
          },
        })
      },
    })

    this.registerCommand({
      id: 'get-credential',
      name: 'Get Credential',
      description: 'Retrieve credential from WhisperrPass',
      category: 'ecosystem',
      keywords: ['credential', 'password', 'key', 'secret'],
      handler: async (args) => {
        ecosystemBridge.broadcastToEcosystem({
          id: this.generateId(),
          type: 'ecosystem.command.cross_app',
          source: 'whisperrtask',
          target: 'whisperrpass',
          version: '1.0',
          timestamp: Date.now(),
          payload: {
            command: 'get-credential',
            query: args.text || '',
          },
          metadata: {
            userId: this.getCurrentUserId(),
          },
        })
      },
    })
  }

  private async executeSearch(query: string): Promise<void> {
    // Emit search event for federated search
    ecosystemBridge.emit({
      type: EVENT_TYPES.SEARCH_QUERY,
      source: 'whisperrtask',
      version: '1.0',
      payload: {
        query,
        timestamp: Date.now(),
      },
      metadata: {
        userId: this.getCurrentUserId(),
        priority: 'high',
      },
    })

    // Also broadcast to ecosystem for cross-app search
    ecosystemBridge.broadcastToEcosystem({
      id: this.generateId(),
      type: EVENT_TYPES.SEARCH_QUERY,
      source: 'whisperrtask',
      version: '1.0',
      timestamp: Date.now(),
      payload: { query },
      metadata: {
        userId: this.getCurrentUserId(),
      },
    })

    // Navigate to search results page (to be implemented)
    window.location.href = `/search?q=${encodeURIComponent(query)}`
  }

  private addToHistory(command: string): void {
    // Remove if already exists
    this.history = this.history.filter(h => h !== command)
    
    // Add to front
    this.history.unshift(command)
    
    // Limit history size
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100)
    }
    
    this.persistData()
  }

  private generateId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentUserId(): string {
    // In production, this would come from auth context
    return 'current-user-id'
  }

  private persistData(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('command_palette_history', JSON.stringify(this.history))
      localStorage.setItem('command_palette_favorites', JSON.stringify(Array.from(this.favorites)))
    }
  }

  private loadPersistedData(): void {
    if (typeof window === 'undefined') return

    try {
      const history = localStorage.getItem('command_palette_history')
      if (history) {
        this.history = JSON.parse(history)
      }

      const favorites = localStorage.getItem('command_palette_favorites')
      if (favorites) {
        this.favorites = new Set(JSON.parse(favorites))
      }
    } catch (error) {
      console.error('Failed to load command palette data:', error)
    }
  }
}

export const commandPaletteService = CommandPaletteService.getInstance()

// Add extension to taskService for default project
declare module './task.service' {
  interface TaskService {
    getOrCreateDefaultProject(): Promise<Project>
  }
}

// Implement the extension
(taskService as any).getOrCreateDefaultProject = async function() {
  const workspace = await (this as any).getOrCreateDefaultWorkspace()
  const projectId = `${workspace.id}-default`
  
  let project = (this as any).projects.get(projectId)
  if (!project) {
    project = {
      id: projectId,
      workspaceId: workspace.id,
      name: 'My Tasks',
      description: 'Default project for quick tasks',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    ;(this as any).projects.set(projectId, project)
    ;(this as any).persistProjects()
  }

  return project
}