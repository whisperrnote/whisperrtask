import type { Task, Project, Workspace, Notification } from '../types'
import type { GraphNode } from '../types/graph'
import { taskService } from './task.service'
import { notificationService } from './notification.service'
import { contextGraph } from '../lib/context-graph'
import { ecosystemBridge } from '../lib/ecosystem-bridge'
import { EVENT_TYPES } from '../lib/event-schemas'

export interface SearchResult {
  id: string
  type: 'task' | 'project' | 'workspace' | 'notification' | 'note' | 'meeting' | 'external'
  source: 'whisperrtask' | 'whisperrnote' | 'whisperrmeet' | 'whisperrpass' | 'external'
  title: string
  description?: string
  url?: string
  snippet?: string
  score: number
  metadata?: Record<string, any>
}

export interface SearchOptions {
  query: string
  types?: SearchResult['type'][]
  sources?: SearchResult['source'][]
  limit?: number
  offset?: number
}

export interface SearchResponse {
  results: SearchResult[]
  facets: {
    types: Record<string, number>
    sources: Record<string, number>
  }
  meta: {
    total: number
    query: string
    took: number
  }
}

export class SearchService {
  private static instance: SearchService
  private searchHistory: string[] = []
  private externalResults: Map<string, SearchResult[]> = new Map()

  private constructor() {
    this.setupEventHandlers()
    this.loadPersistedData()
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService()
    }
    return SearchService.instance
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now()
    const results: SearchResult[] = []

    // Add to search history
    this.addToHistory(options.query)

    // Search local data
    results.push(...this.searchTasks(options))
    results.push(...this.searchNotifications(options))
    results.push(...this.searchContextGraph(options))

    // Request search from other ecosystem apps
    await this.requestExternalSearch(options)

    // Wait a bit for external results (with timeout)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Add external results
    const externalResults = this.externalResults.get(options.query) || []
    results.push(...externalResults)

    // Apply filters
    let filteredResults = results
    if (options.types && options.types.length > 0) {
      filteredResults = filteredResults.filter(r => options.types!.includes(r.type))
    }
    if (options.sources && options.sources.length > 0) {
      filteredResults = filteredResults.filter(r => options.sources!.includes(r.source))
    }

    // Sort by score
    filteredResults.sort((a, b) => b.score - a.score)

    // Apply pagination
    const offset = options.offset || 0
    const limit = options.limit || 20
    const paginatedResults = filteredResults.slice(offset, offset + limit)

    // Calculate facets
    const facets = this.calculateFacets(filteredResults)

    return {
      results: paginatedResults,
      facets,
      meta: {
        total: filteredResults.length,
        query: options.query,
        took: Date.now() - startTime,
      },
    }
  }

  private searchTasks(options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = []
    const queryLower = options.query.toLowerCase()
    const tasks = taskService.getTasks()

    for (const task of tasks) {
      let score = 0
      const titleLower = task.title.toLowerCase()
      const descLower = (task.description || '').toLowerCase()

      // Title matches
      if (titleLower === queryLower) {
        score += 100
      } else if (titleLower.includes(queryLower)) {
        score += 50
      }

      // Description matches
      if (descLower.includes(queryLower)) {
        score += 25
      }

      // Word matches
      const queryWords = queryLower.split(/\s+/)
      for (const word of queryWords) {
        if (titleLower.includes(word)) score += 10
        if (descLower.includes(word)) score += 5
      }

      if (score > 0) {
        results.push({
          id: task.id,
          type: 'task',
          source: 'whisperrtask',
          title: task.title,
          description: task.description,
          url: `/tasks/${task.id}`,
          snippet: this.generateSnippet(task.description || '', options.query),
          score,
          metadata: {
            status: task.status,
            dueDate: task.dueDate,
            assigneeIds: task.assigneeIds,
          },
        })
      }
    }

    return results
  }

  private searchNotifications(options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = []
    const queryLower = options.query.toLowerCase()
    const notifications = notificationService.getNotifications()

    for (const notification of notifications) {
      let score = 0
      const titleLower = notification.title.toLowerCase()
      const messageLower = notification.message.toLowerCase()

      if (titleLower.includes(queryLower)) {
        score += 30
      }
      if (messageLower.includes(queryLower)) {
        score += 20
      }

      if (score > 0) {
        results.push({
          id: notification.id,
          type: 'notification',
          source: notification.sourceApp,
          title: notification.title,
          description: notification.message,
          url: `/hub#${notification.id}`,
          snippet: this.generateSnippet(notification.message, options.query),
          score,
          metadata: {
            read: notification.read,
            createdAt: notification.createdAt,
          },
        })
      }
    }

    return results
  }

  private searchContextGraph(options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = []
    const semanticMatches = contextGraph.findSemanticMatches(options.query)

    for (const match of semanticMatches) {
      const node = match.node
      
      // Only include nodes from other apps (not tasks we already searched)
      if (node.type === 'task') continue

      results.push({
        id: node.id,
        type: node.type as SearchResult['type'],
        source: node.app,
        title: node.data.title || node.data.name || 'Untitled',
        description: node.data.description || node.data.snippet,
        url: node.data.url,
        snippet: this.generateSnippet(node.data.snippet || '', options.query),
        score: match.score * 10, // Scale up semantic scores
        metadata: node.metadata,
      })
    }

    return results
  }

  private async requestExternalSearch(options: SearchOptions): Promise<void> {
    // Clear previous results for this query
    this.externalResults.delete(options.query)

    // Subscribe to search results
    const subscription = ecosystemBridge.subscribe(
      'ecosystem.search.results',
      (event) => {
        if (event.payload.queryId === options.query) {
          const currentResults = this.externalResults.get(options.query) || []
          currentResults.push(...event.payload.results)
          this.externalResults.set(options.query, currentResults)
        }
      }
    )

    // Broadcast search request
    ecosystemBridge.broadcastToEcosystem({
      id: this.generateId(),
      type: EVENT_TYPES.SEARCH_QUERY,
      source: 'whisperrtask',
      version: '1.0',
      timestamp: Date.now(),
      payload: {
        queryId: options.query,
        query: options.query,
        types: options.types,
        limit: 10, // Limit per app
      },
      metadata: {
        userId: this.getCurrentUserId(),
        priority: 'high',
      },
    })

    // Cleanup subscription after timeout
    setTimeout(() => {
      subscription.unsubscribe()
    }, 2000)
  }

  private calculateFacets(results: SearchResult[]): SearchResponse['facets'] {
    const types: Record<string, number> = {}
    const sources: Record<string, number> = {}

    for (const result of results) {
      types[result.type] = (types[result.type] || 0) + 1
      sources[result.source] = (sources[result.source] || 0) + 1
    }

    return { types, sources }
  }

  private generateSnippet(text: string, query: string): string {
    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)

    if (index === -1) {
      // Return first 150 chars if no match
      return text.slice(0, 150) + (text.length > 150 ? '...' : '')
    }

    // Extract context around match
    const start = Math.max(0, index - 50)
    const end = Math.min(text.length, index + query.length + 50)
    let snippet = text.slice(start, end)

    if (start > 0) snippet = '...' + snippet
    if (end < text.length) snippet = snippet + '...'

    return snippet
  }

  getSearchHistory(): string[] {
    return [...this.searchHistory]
  }

  clearSearchHistory(): void {
    this.searchHistory = []
    this.persistData()
  }

  private addToHistory(query: string): void {
    // Remove duplicates
    this.searchHistory = this.searchHistory.filter(q => q !== query)
    
    // Add to front
    this.searchHistory.unshift(query)
    
    // Limit size
    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(0, 50)
    }
    
    this.persistData()
  }

  private setupEventHandlers(): void {
    // Handle search results from other apps
    ecosystemBridge.subscribe('ecosystem.search.results', (event) => {
      // Results are handled in requestExternalSearch
    })
  }

  private generateId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentUserId(): string {
    // In production, this would come from auth context
    return 'current-user-id'
  }

  private persistData(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('search_history', JSON.stringify(this.searchHistory))
    }
  }

  private loadPersistedData(): void {
    if (typeof window === 'undefined') return

    try {
      const history = localStorage.getItem('search_history')
      if (history) {
        this.searchHistory = JSON.parse(history)
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }
}

export const searchService = SearchService.getInstance()