export interface AIProviderConfig {
  name: string
  apiKey?: string
  baseUrl?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  metadata?: Record<string, any>
}

export interface AICompletionRequest {
  messages: AIMessage[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface AICompletionResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  metadata?: Record<string, any>
}

export interface AIEmbeddingRequest {
  text: string | string[]
}

export interface AIEmbeddingResponse {
  embeddings: number[][]
  usage?: {
    totalTokens: number
  }
}

export interface AIProvider {
  name: string
  
  complete(request: AICompletionRequest): Promise<AICompletionResponse>
  
  completeStream(
    request: AICompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<AICompletionResponse>
  
  generateEmbedding(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse>
  
  healthCheck(): Promise<boolean>
}

export interface PromptTemplate {
  id: string
  version: string
  name: string
  description: string
  template: string
  variables: string[]
  examples?: Array<{
    input: Record<string, any>
    output: string
  }>
}

export interface AIOperation {
  type: 'completion' | 'embedding' | 'analysis'
  provider: string
  startTime: number
  endTime?: number
  tokens?: number
  cost?: number
  cached?: boolean
  error?: Error
}

export type AICapability = 
  | 'task_prioritization'
  | 'context_extraction'
  | 'action_item_detection'
  | 'semantic_search'
  | 'task_breakdown'
  | 'bottleneck_prediction'
  | 'message_drafting'
