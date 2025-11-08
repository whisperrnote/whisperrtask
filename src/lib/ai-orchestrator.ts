import type {
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  PromptTemplate,
  AIOperation,
  AICapability
} from '../types/ai'

export class AIOrchestrator {
  private static instance: AIOrchestrator
  private providers: Map<string, AIProvider> = new Map()
  private templates: Map<string, PromptTemplate> = new Map()
  private cache: Map<string, { response: any; timestamp: number }> = new Map()
  private operations: AIOperation[] = []
  private fallbackChain: string[] = []

  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): AIOrchestrator {
    if (!AIOrchestrator.instance) {
      AIOrchestrator.instance = new AIOrchestrator()
    }
    return AIOrchestrator.instance
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, provider)
  }

  setFallbackChain(providers: string[]): void {
    this.fallbackChain = providers
  }

  registerTemplate(template: PromptTemplate): void {
    this.templates.set(`${template.id}-${template.version}`, template)
  }

  async executeWithFallback<T>(
    providerName: string,
    operation: (provider: AIProvider) => Promise<T>
  ): Promise<T> {
    const providers = [providerName, ...this.fallbackChain].filter(
      (name, index, arr) => arr.indexOf(name) === index
    )

    let lastError: Error | null = null

    for (const name of providers) {
      const provider = this.providers.get(name)
      if (!provider) continue

      try {
        const healthy = await provider.healthCheck()
        if (!healthy) continue

        return await operation(provider)
      } catch (error) {
        lastError = error as Error
        console.warn(`Provider ${name} failed:`, error)
        continue
      }
    }

    throw new Error(
      `All providers failed. Last error: ${lastError?.message || 'Unknown error'}`
    )
  }

  async complete(
    request: AICompletionRequest,
    options: {
      provider?: string
      useCache?: boolean
      capability?: AICapability
    } = {}
  ): Promise<AICompletionResponse> {
    const cacheKey = this.getCacheKey('completion', request)
    
    if (options.useCache !== false) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached as AICompletionResponse
    }

    const providerName = options.provider || this.fallbackChain[0] || 'default'
    const operation: AIOperation = {
      type: 'completion',
      provider: providerName,
      startTime: Date.now(),
    }

    try {
      const response = await this.executeWithFallback(
        providerName,
        (provider) => provider.complete(request)
      )

      operation.endTime = Date.now()
      operation.tokens = response.usage?.totalTokens
      operation.cost = this.calculateCost(operation)

      this.operations.push(operation)
      
      if (options.useCache !== false) {
        this.setCache(cacheKey, response)
      }

      return response
    } catch (error) {
      operation.endTime = Date.now()
      operation.error = error as Error
      this.operations.push(operation)
      throw error
    }
  }

  async completeStream(
    request: AICompletionRequest,
    onChunk: (chunk: string) => void,
    options: {
      provider?: string
    } = {}
  ): Promise<AICompletionResponse> {
    const providerName = options.provider || this.fallbackChain[0] || 'default'
    const operation: AIOperation = {
      type: 'completion',
      provider: providerName,
      startTime: Date.now(),
    }

    try {
      const response = await this.executeWithFallback(
        providerName,
        (provider) => provider.completeStream(request, onChunk)
      )

      operation.endTime = Date.now()
      operation.tokens = response.usage?.totalTokens
      operation.cost = this.calculateCost(operation)
      this.operations.push(operation)

      return response
    } catch (error) {
      operation.endTime = Date.now()
      operation.error = error as Error
      this.operations.push(operation)
      throw error
    }
  }

  async generateEmbedding(
    request: AIEmbeddingRequest,
    options: {
      provider?: string
      useCache?: boolean
    } = {}
  ): Promise<AIEmbeddingResponse> {
    const cacheKey = this.getCacheKey('embedding', request)
    
    if (options.useCache !== false) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return { ...cached as AIEmbeddingResponse, cached: true } as any
      }
    }

    const providerName = options.provider || this.fallbackChain[0] || 'default'
    const operation: AIOperation = {
      type: 'embedding',
      provider: providerName,
      startTime: Date.now(),
    }

    try {
      const response = await this.executeWithFallback(
        providerName,
        (provider) => provider.generateEmbedding(request)
      )

      operation.endTime = Date.now()
      operation.tokens = response.usage?.totalTokens
      operation.cost = this.calculateCost(operation)
      this.operations.push(operation)
      
      if (options.useCache !== false) {
        this.setCache(cacheKey, response)
      }

      return response
    } catch (error) {
      operation.endTime = Date.now()
      operation.error = error as Error
      this.operations.push(operation)
      throw error
    }
  }

  async renderTemplate(
    templateId: string,
    version: string,
    variables: Record<string, any>
  ): Promise<string> {
    const template = this.templates.get(`${templateId}-${version}`)
    
    if (!template) {
      throw new Error(`Template ${templateId} version ${version} not found`)
    }

    // Validate all required variables are provided
    const missingVars = template.variables.filter(v => !(v in variables))
    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`)
    }

    let rendered = template.template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      rendered = rendered.replace(placeholder, String(value))
    }

    return rendered
  }

  private getCacheKey(type: string, request: any): string {
    return `${type}:${JSON.stringify(request)}`
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const age = Date.now() - cached.timestamp
    if (age > this.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }

    return cached.response
  }

  private setCache(key: string, response: any): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    })

    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }

  private calculateCost(operation: AIOperation): number {
    // Simplified cost calculation - would be more sophisticated in production
    const baseCostPer1kTokens = 0.002 // $0.002 per 1k tokens (example rate)
    if (!operation.tokens) return 0
    return (operation.tokens / 1000) * baseCostPer1kTokens
  }

  getMetrics() {
    const now = Date.now()
    const recentOps = this.operations.filter(
      op => now - op.startTime < 60 * 60 * 1000 // Last hour
    )

    return {
      totalOperations: this.operations.length,
      recentOperations: recentOps.length,
      totalCost: this.operations.reduce((sum, op) => sum + (op.cost || 0), 0),
      totalTokens: this.operations.reduce((sum, op) => sum + (op.tokens || 0), 0),
      cacheSize: this.cache.size,
      providerCount: this.providers.size,
      templateCount: this.templates.size,
      errorRate: recentOps.filter(op => op.error).length / recentOps.length || 0,
      avgLatency: recentOps.reduce((sum, op) => {
        return sum + ((op.endTime || 0) - op.startTime)
      }, 0) / recentOps.length || 0,
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  clearOperations(): void {
    this.operations = []
  }
}

export const aiOrchestrator = AIOrchestrator.getInstance()
