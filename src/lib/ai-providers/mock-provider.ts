import type {
  AIProvider,
  AIProviderConfig,
  AICompletionRequest,
  AICompletionResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
} from '../../types/ai'

export class MockAIProvider implements AIProvider {
  name: string
  private config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.name = config.name
    this.config = config
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    await this.delay(500)
    const lastMessage = request.messages[request.messages.length - 1]
    return {
      content: \`Mock AI response to: \${lastMessage.content.substring(0, 50)}...\`,
      usage: {
        promptTokens: this.estimateTokens(request.messages.map(m => m.content).join(' ')),
        completionTokens: 100,
        totalTokens: this.estimateTokens(request.messages.map(m => m.content).join(' ')) + 100,
      },
      metadata: {
        provider: this.name,
        model: this.config.model || 'mock-model',
      },
    }
  }

  async completeStream(
    request: AICompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<AICompletionResponse> {
    const fullResponse = await this.complete(request)
    const words = fullResponse.content.split(' ')
    for (const word of words) {
      await this.delay(50)
      onChunk(word + ' ')
    }
    return fullResponse
  }

  async generateEmbedding(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    await this.delay(300)
    const texts = Array.isArray(request.text) ? request.text : [request.text]
    return {
      embeddings: texts.map(() => this.generateMockEmbedding(384)),
      usage: {
        totalTokens: texts.reduce((sum, text) => sum + this.estimateTokens(text), 0),
      },
    }
  }

  async healthCheck(): Promise<boolean> {
    return true
  }

  private generateMockEmbedding(dimensions: number): number[] {
    return Array.from({ length: dimensions }, () => Math.random() * 2 - 1)
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
