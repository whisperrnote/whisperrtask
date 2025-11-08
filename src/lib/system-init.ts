import { ecosystemBridge } from './ecosystem-bridge'
import { contextGraph } from './context-graph'
import { aiOrchestrator } from './ai-orchestrator'
import { MockAIProvider } from './ai-providers/mock-provider'
import { AI_PROMPTS } from './ai-prompts'
import { EVENT_TYPES } from './event-schemas'

export class SystemInitializer {
  private static initialized = false

  static async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('System already initialized')
      return
    }

    console.log('🚀 Initializing WhisperrTask ecosystem...')

    // 1. Initialize AI Provider
    const mockProvider = new MockAIProvider({
      name: 'mock',
      model: 'gpt-4',
    })
    aiOrchestrator.registerProvider(mockProvider)
    aiOrchestrator.setFallbackChain(['mock'])

    // 2. Register AI Prompt Templates
    Object.values(AI_PROMPTS).forEach(template => {
      aiOrchestrator.registerTemplate(template)
    })

    // 3. Set up Event Bridge subscriptions
    this.setupEventHandlers()

    this.initialized = true
    console.log('✅ System initialized successfully')
    console.log('📊 System stats:', {
      contextGraph: contextGraph.getGraphStats(),
      eventBridge: {
        subscriptions: ecosystemBridge.getSubscriptionCount(),
        queueLength: ecosystemBridge.getQueueLength(),
      },
      ai: aiOrchestrator.getMetrics(),
    })
  }

  private static setupEventHandlers(): void {
    // Handle WhisperrNote task creation
    ecosystemBridge.subscribe(
      EVENT_TYPES.NOTE_TASK_CREATED,
      async (event) => {
        console.log('📝 Note task created:', event.payload)
        
        // Add to context graph
        contextGraph.addNode({
          id: `task-from-note-${event.id}`,
          type: 'task',
          app: 'whisperrtask',
          data: {
            title: event.payload.checkboxText,
            sourceNote: event.payload.noteId,
            url: event.payload.noteUrl,
          },
          metadata: {
            createdAt: event.timestamp,
            updatedAt: event.timestamp,
            keywords: [],
          },
        })

        // Create edge to note
        contextGraph.addEdge({
          id: `edge-${event.id}`,
          source: `task-from-note-${event.id}`,
          target: event.payload.noteId,
          type: 'created_from',
          weight: 1.0,
          metadata: {
            createdAt: event.timestamp,
            reason: 'Task created from note checkbox',
          },
        })
      },
      { source: 'whisperrnote' }
    )

    // Handle WhisperrMeet action items
    ecosystemBridge.subscribe(
      EVENT_TYPES.MEET_ACTION_ITEM_DETECTED,
      async (event) => {
        console.log('🎙️  Meeting action item detected:', event.payload)
        
        const taskId = `task-from-meeting-${event.id}`
        
        contextGraph.addNode({
          id: taskId,
          type: 'task',
          app: 'whisperrtask',
          data: {
            title: event.payload.actionItem,
            sourceMeeting: event.payload.meetingId,
            speaker: event.payload.speaker,
            timestamp: event.payload.timestamp,
          },
          metadata: {
            createdAt: event.timestamp,
            updatedAt: event.timestamp,
            keywords: [],
          },
        })

        contextGraph.addEdge({
          id: `edge-meeting-${event.id}`,
          source: taskId,
          target: event.payload.meetingId,
          type: 'created_from',
          weight: 1.0,
          metadata: {
            createdAt: event.timestamp,
            reason: 'Task created from meeting action item',
          },
        })
      },
      { source: 'whisperrmeet' }
    )

    // Handle task status changes
    ecosystemBridge.subscribe(
      EVENT_TYPES.TASK_STATUS_CHANGED,
      async (event) => {
        console.log('✅ Task status changed:', event.payload)
        
        // Update context graph
        const node = contextGraph.getNode(event.payload.taskId)
        if (node) {
          node.data.status = event.payload.newStatus
          node.metadata.updatedAt = event.timestamp
          contextGraph.addNode(node)
        }

        // Emit notification if completed
        if (event.payload.newStatus === 'completed') {
          await ecosystemBridge.emit({
            type: EVENT_TYPES.TASK_COMPLETED,
            source: 'whisperrtask',
            version: '1.0',
            payload: {
              taskId: event.payload.taskId,
              completedBy: event.payload.completedBy,
              completedAt: event.timestamp,
            },
            metadata: {
              userId: event.metadata.userId,
              priority: 'normal',
            },
          })
        }
      }
    )

    // Handle search queries (federated search)
    ecosystemBridge.subscribe(
      EVENT_TYPES.SEARCH_QUERY,
      async (event) => {
        console.log('🔍 Search query:', event.payload)
        
        const results = contextGraph.findSemanticMatches(
          event.payload.query,
          {
            limit: 20,
            nodeTypes: event.payload.types,
          }
        )

        console.log(`Found ${results.length} results`)
      }
    )

    console.log('✅ Event handlers registered')
  }

  static getStatus() {
    return {
      initialized: this.initialized,
      contextGraph: contextGraph.getGraphStats(),
      eventBridge: {
        subscriptions: ecosystemBridge.getSubscriptionCount(),
        queueLength: ecosystemBridge.getQueueLength(),
        metrics: ecosystemBridge.getMetrics(),
      },
      ai: aiOrchestrator.getMetrics(),
    }
  }

  static reset(): void {
    contextGraph.clear()
    ecosystemBridge.clear()
    aiOrchestrator.clearCache()
    aiOrchestrator.clearOperations()
    this.initialized = false
    console.log('🔄 System reset complete')
  }
}

if (typeof window !== 'undefined') {
  SystemInitializer.initialize().catch(console.error)
  
  ;(window as any).__whisperr = {
    system: SystemInitializer,
    ecosystemBridge,
    contextGraph,
    aiOrchestrator,
  }
}
