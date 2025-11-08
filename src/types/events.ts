export type EcosystemApp = 'whisperrtask' | 'whisperrnote' | 'whisperrmeet' | 'whisperrpass' | 'whisperrauth'

export interface EcosystemEvent<T = any> {
  id: string
  type: string
  source: EcosystemApp
  target?: EcosystemApp
  version: string
  timestamp: number
  payload: T
  metadata: {
    userId: string
    sessionId?: string
    traceId?: string
    priority?: 'low' | 'normal' | 'high' | 'critical'
  }
}

export interface EventHandler<T = any> {
  (event: EcosystemEvent<T>): Promise<void> | void
}

export interface EventSubscription {
  id: string
  type: string
  handler: EventHandler
  source?: EcosystemApp
  unsubscribe: () => void
}

export interface EventQueueItem {
  event: EcosystemEvent
  retries: number
  lastAttempt?: number
  error?: Error
}

export interface EventBridgeConfig {
  maxRetries?: number
  retryDelay?: number
  persistEvents?: boolean
  enableMetrics?: boolean
}
