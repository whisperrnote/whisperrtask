import type { EcosystemEvent } from '../types/events'
import { ecosystemBridge } from './ecosystem-bridge'
import { EVENT_TYPES, WhisperrPassCredentialPayload } from './event-schemas'

export interface CredentialRequest {
  service: string
  credentialName: string
  scope?: string[]
  reason?: string
}

export interface CredentialResponse {
  success: boolean
  credential?: {
    value: string
    expiresAt?: number
    metadata?: Record<string, any>
  }
  error?: string
}

export interface CredentialCache {
  value: string
  expiresAt: number
  fetchedAt: number
}

export class CredentialBroker {
  private static instance: CredentialBroker
  private cache: Map<string, CredentialCache> = new Map()
  private pendingRequests: Map<string, Promise<CredentialResponse>> = new Map()
  private auditLog: Array<{
    timestamp: number
    service: string
    credentialName: string
    action: 'requested' | 'approved' | 'denied' | 'expired'
    userId: string
  }> = []

  private readonly CACHE_BUFFER = 5 * 60 * 1000 // 5 minutes before expiry

  private constructor() {
    this.setupEventHandlers()
    
    // Clear expired credentials every minute
    if (typeof window !== 'undefined') {
      setInterval(() => this.clearExpiredCredentials(), 60 * 1000)
    }
  }

  static getInstance(): CredentialBroker {
    if (!CredentialBroker.instance) {
      CredentialBroker.instance = new CredentialBroker()
    }
    return CredentialBroker.instance
  }

  async requestCredential(request: CredentialRequest): Promise<CredentialResponse> {
    const cacheKey = this.getCacheKey(request.service, request.credentialName)
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && this.isCredentialValid(cached)) {
      this.logAction('requested', request.service, request.credentialName)
      return {
        success: true,
        credential: {
          value: cached.value,
          expiresAt: cached.expiresAt,
        },
      }
    }

    // Check if there's already a pending request
    const pendingKey = `${cacheKey}-pending`
    const pending = this.pendingRequests.get(pendingKey)
    if (pending) {
      return pending
    }

    // Create new request
    const requestPromise = this.fetchCredential(request)
    this.pendingRequests.set(pendingKey, requestPromise)

    try {
      const response = await requestPromise
      return response
    } finally {
      this.pendingRequests.delete(pendingKey)
    }
  }

  private async fetchCredential(request: CredentialRequest): Promise<CredentialResponse> {
    return new Promise((resolve) => {
      const requestId = this.generateRequestId()
      const timeout = setTimeout(() => {
        subscription.unsubscribe()
        resolve({
          success: false,
          error: 'Credential request timed out',
        })
      }, 30000) // 30 second timeout

      // Subscribe to approval event
      const subscription = ecosystemBridge.subscribe(
        EVENT_TYPES.PASS_CREDENTIAL_APPROVED,
        (event: EcosystemEvent<WhisperrPassCredentialPayload>) => {
          if (event.payload.service === request.service &&
              event.payload.credentialName === request.credentialName) {
            clearTimeout(timeout)
            subscription.unsubscribe()

            const credential = {
              value: event.payload.metadata.value as string,
              expiresAt: event.payload.metadata.expiresAt as number || Date.now() + 3600 * 1000,
              metadata: event.payload.metadata,
            }

            // Cache the credential
            this.cache.set(this.getCacheKey(request.service, request.credentialName), {
              value: credential.value,
              expiresAt: credential.expiresAt,
              fetchedAt: Date.now(),
            })

            this.logAction('approved', request.service, request.credentialName)

            resolve({
              success: true,
              credential,
            })
          }
        }
      )

      // Emit credential request event
      ecosystemBridge.emit({
        type: EVENT_TYPES.PASS_CREDENTIAL_REQUESTED,
        source: 'whisperrtask',
        target: 'whisperrpass',
        version: '1.0',
        payload: {
          requestId,
          service: request.service,
          credentialName: request.credentialName,
          scope: request.scope,
          reason: request.reason || 'Required for integration',
        },
        metadata: {
          userId: this.getCurrentUserId(),
          priority: 'high',
        },
      })

      this.logAction('requested', request.service, request.credentialName)
    })
  }

  private isCredentialValid(cached: CredentialCache): boolean {
    const now = Date.now()
    const expiresWithBuffer = cached.expiresAt - this.CACHE_BUFFER
    return now < expiresWithBuffer
  }

  private clearExpiredCredentials(): void {
    const now = Date.now()
    let clearedCount = 0

    for (const [key, cached] of this.cache.entries()) {
      if (now >= cached.expiresAt) {
        this.cache.delete(key)
        clearedCount++
      }
    }

    if (clearedCount > 0) {
      console.log(`[CredentialBroker] Cleared ${clearedCount} expired credentials`)
    }
  }

  private setupEventHandlers(): void {
    // Handle credential expiration events
    ecosystemBridge.subscribe(EVENT_TYPES.PASS_CREDENTIAL_EXPIRED, (event) => {
      const { service, credentialName } = event.payload
      const cacheKey = this.getCacheKey(service, credentialName)
      this.cache.delete(cacheKey)
      this.logAction('expired', service, credentialName)
    })
  }

  private getCacheKey(service: string, credentialName: string): string {
    return `${service}:${credentialName}`
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentUserId(): string {
    // In production, this would come from auth context
    return 'current-user-id'
  }

  private logAction(
    action: 'requested' | 'approved' | 'denied' | 'expired',
    service: string,
    credentialName: string
  ): void {
    this.auditLog.push({
      timestamp: Date.now(),
      service,
      credentialName,
      action,
      userId: this.getCurrentUserId(),
    })

    // Limit audit log size
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-500)
    }
  }

  getAuditLog(filter?: {
    service?: string
    action?: string
    startTime?: number
    endTime?: number
  }): typeof this.auditLog {
    let logs = [...this.auditLog]

    if (filter) {
      if (filter.service) {
        logs = logs.filter(log => log.service === filter.service)
      }
      if (filter.action) {
        logs = logs.filter(log => log.action === filter.action)
      }
      if (filter.startTime) {
        logs = logs.filter(log => log.timestamp >= filter.startTime!)
      }
      if (filter.endTime) {
        logs = logs.filter(log => log.timestamp <= filter.endTime!)
      }
    }

    return logs
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        expiresIn: Math.max(0, value.expiresAt - Date.now()),
        age: Date.now() - value.fetchedAt,
      })),
    }
  }
}

export const credentialBroker = CredentialBroker.getInstance()