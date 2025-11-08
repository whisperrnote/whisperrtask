import type { 
  EcosystemEvent, 
  EventHandler, 
  EventSubscription,
  EventQueueItem,
  EventBridgeConfig,
  EcosystemApp 
} from '../types/events'

export class EcosystemBridge {
  private static instance: EcosystemBridge
  private subscriptions: Map<string, Set<EventSubscription>> = new Map()
  private eventQueue: EventQueueItem[] = []
  private processing: boolean = false
  private config: Required<EventBridgeConfig>
  private metrics: {
    sent: number
    received: number
    failed: number
    retried: number
  } = { sent: 0, received: 0, failed: 0, retried: 0 }

  private constructor(config: EventBridgeConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      persistEvents: config.persistEvents ?? true,
      enableMetrics: config.enableMetrics ?? true,
    }

    if (typeof window !== 'undefined' && this.config.persistEvents) {
      this.restoreQueue()
      window.addEventListener('beforeunload', () => this.persistQueue())
    }
  }

  static getInstance(config?: EventBridgeConfig): EcosystemBridge {
    if (!EcosystemBridge.instance) {
      EcosystemBridge.instance = new EcosystemBridge(config)
    }
    return EcosystemBridge.instance
  }

  subscribe<T = any>(
    eventType: string,
    handler: EventHandler<T>,
    options?: { source?: EcosystemApp }
  ): EventSubscription {
    const subscriptionId = `${eventType}-${Date.now()}-${Math.random()}`
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      type: eventType,
      handler: handler as EventHandler,
      source: options?.source,
      unsubscribe: () => this.unsubscribe(subscriptionId, eventType),
    }

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set())
    }
    this.subscriptions.get(eventType)!.add(subscription)

    return subscription
  }

  private unsubscribe(subscriptionId: string, eventType: string): void {
    const subs = this.subscriptions.get(eventType)
    if (subs) {
      const subscription = Array.from(subs).find(s => s.id === subscriptionId)
      if (subscription) {
        subs.delete(subscription)
      }
    }
  }

  async emit<T = any>(event: Omit<EcosystemEvent<T>, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: EcosystemEvent<T> = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
    }

    if (this.config.enableMetrics) {
      this.metrics.sent++
    }

    const queueItem: EventQueueItem = {
      event: fullEvent,
      retries: 0,
    }

    this.eventQueue.push(queueItem)
    this.processQueue()
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) {
      return
    }

    this.processing = true

    while (this.eventQueue.length > 0) {
      const item = this.eventQueue[0]

      try {
        await this.deliverEvent(item.event)
        this.eventQueue.shift()
      } catch (error) {
        item.error = error as Error
        item.lastAttempt = Date.now()

        if (item.retries < this.config.maxRetries) {
          item.retries++
          this.metrics.retried++
          
          // Move to end of queue for retry with delay
          this.eventQueue.shift()
          setTimeout(() => {
            this.eventQueue.push(item)
            this.processQueue()
          }, this.config.retryDelay * Math.pow(2, item.retries - 1))
        } else {
          this.metrics.failed++
          console.error(`Event ${item.event.id} failed after ${item.retries} retries:`, error)
          this.eventQueue.shift()
          
          // Emit failure event for monitoring
          this.emitFailure(item)
        }
      }
    }

    this.processing = false
  }

  private async deliverEvent(event: EcosystemEvent): Promise<void> {
    const subscriptions = this.subscriptions.get(event.type)
    
    if (!subscriptions || subscriptions.size === 0) {
      return
    }

    const promises = Array.from(subscriptions)
      .filter(sub => !sub.source || sub.source === event.source)
      .map(sub => {
        try {
          return Promise.resolve(sub.handler(event))
        } catch (error) {
          console.error(`Handler error for event ${event.type}:`, error)
          return Promise.resolve()
        }
      })

    await Promise.all(promises)
    
    if (this.config.enableMetrics) {
      this.metrics.received++
    }
  }

  private emitFailure(item: EventQueueItem): void {
    const failureEvent: EcosystemEvent = {
      id: this.generateEventId(),
      type: 'ecosystem.event.failed',
      source: 'whisperrtask',
      version: '1.0',
      timestamp: Date.now(),
      payload: {
        originalEvent: item.event,
        error: item.error?.message,
        retries: item.retries,
      },
      metadata: {
        userId: item.event.metadata.userId,
        priority: 'high',
      },
    }

    this.subscriptions.get('ecosystem.event.failed')?.forEach(sub => {
      try {
        sub.handler(failureEvent)
      } catch (error) {
        console.error('Failed to handle failure event:', error)
      }
    })
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private persistQueue(): void {
    if (typeof window === 'undefined' || !this.config.persistEvents) {
      return
    }

    try {
      const serializable = this.eventQueue.map(item => ({
        event: item.event,
        retries: item.retries,
        lastAttempt: item.lastAttempt,
      }))
      localStorage.setItem('ecosystem_event_queue', JSON.stringify(serializable))
    } catch (error) {
      console.error('Failed to persist event queue:', error)
    }
  }

  private restoreQueue(): void {
    if (typeof window === 'undefined' || !this.config.persistEvents) {
      return
    }

    try {
      const stored = localStorage.getItem('ecosystem_event_queue')
      if (stored) {
        const items = JSON.parse(stored) as EventQueueItem[]
        this.eventQueue = items.filter(item => {
          const age = Date.now() - item.event.timestamp
          return age < 24 * 60 * 60 * 1000 // Keep events less than 24 hours old
        })
        localStorage.removeItem('ecosystem_event_queue')
        
        if (this.eventQueue.length > 0) {
          this.processQueue()
        }
      }
    } catch (error) {
      console.error('Failed to restore event queue:', error)
    }
  }

  getMetrics() {
    return { ...this.metrics }
  }

  clear(): void {
    this.subscriptions.clear()
    this.eventQueue = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ecosystem_event_queue')
    }
  }

  getQueueLength(): number {
    return this.eventQueue.length
  }

  getSubscriptionCount(): number {
    return Array.from(this.subscriptions.values())
      .reduce((sum, subs) => sum + subs.size, 0)
  }
}

export const ecosystemBridge = EcosystemBridge.getInstance()
