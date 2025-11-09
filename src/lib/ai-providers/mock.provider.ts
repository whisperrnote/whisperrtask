import type {
  AIProvider,
  AICompletionRequest,
  AICompletionResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
} from '../../types/ai'

export class MockAIProvider implements AIProvider {
  name = 'mock'

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const lastMessage = request.messages[request.messages.length - 1]
    const content = lastMessage.content.toLowerCase()

    // Mock responses based on content
    let response = 'I understand your request.'

    if (content.includes('priority') || content.includes('value score')) {
      response = JSON.stringify({
        valueScore: Math.floor(Math.random() * 40) + 60,
        effortScore: Math.floor(Math.random() * 40) + 30,
        reasoning: 'Based on the task complexity and strategic importance.',
        recommendations: [
          'Consider breaking this task into smaller subtasks',
          'Allocate dedicated time in the next sprint',
        ],
      })
    } else if (content.includes('action item') || content.includes('meeting')) {
      response = JSON.stringify([
        {
          task: 'Review and update the API documentation',
          assignee: 'John Doe',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          context: 'John mentioned he would handle the documentation update',
          timestamp: 245,
        },
        {
          task: 'Schedule follow-up meeting with design team',
          assignee: 'Jane Smith',
          dueDate: null,
          priority: 'medium',
          context: 'Need to sync on the new UI components',
          timestamp: 512,
        },
      ])
    } else if (content.includes('breakdown') || content.includes('subtask')) {
      response = JSON.stringify({
        subtasks: [
          {
            title: 'Research and planning',
            description: 'Analyze requirements and create technical design',
            estimatedEffort: '4 hours',
            dependencies: [],
            acceptanceCriteria: ['Requirements documented', 'Design approved'],
          },
          {
            title: 'Implementation',
            description: 'Code the core functionality',
            estimatedEffort: '8 hours',
            dependencies: [0],
            acceptanceCriteria: ['Code complete', 'Unit tests passing'],
          },
          {
            title: 'Testing and documentation',
            description: 'Write tests and update documentation',
            estimatedEffort: '4 hours',
            dependencies: [1],
            acceptanceCriteria: ['All tests passing', 'Documentation updated'],
          },
        ],
        sequencing: 'sequential',
        totalEstimate: '16 hours',
      })
    } else if (content.includes('bottleneck')) {
      response = JSON.stringify({
        bottlenecks: [
          {
            type: 'dependency',
            description: 'Waiting for API design approval from backend team',
            likelihood: 'high',
            impact: 'high',
            mitigation: 'Schedule sync meeting with backend team ASAP',
          },
          {
            type: 'resource',
            description: 'Limited QA capacity next week',
            likelihood: 'medium',
            impact: 'medium',
            mitigation: 'Plan for testing in the following week or allocate dev time',
          },
        ],
        overallRisk: 'medium',
        recommendation: 'Address API design dependency immediately to avoid delays',
      })
    }

    return {
      content: response,
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
      metadata: {
        model: 'mock-model',
        provider: 'mock',
      },
    }
  }

  async completeStream(
    request: AICompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<AICompletionResponse> {
    const response = await this.complete(request)
    
    // Simulate streaming by chunking the response
    const chunks = response.content.match(/.{1,10}/g) || []
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 50))
      onChunk(chunk)
    }

    return response
  }

  async generateEmbedding(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    // Generate mock embeddings
    const texts = Array.isArray(request.text) ? request.text : [request.text]
    const embeddings = texts.map(() => {
      // Generate a random 384-dimensional vector (typical for sentence embeddings)
      return Array.from({ length: 384 }, () => Math.random() * 2 - 1)
    })

    return {
      embeddings,
      usage: {
        totalTokens: texts.reduce((sum, text) => sum + text.split(' ').length, 0),
      },
    }
  }

  async healthCheck(): Promise<boolean> {
    // Mock provider is always healthy
    return true
  }
}

// Register the mock provider
import { aiOrchestrator } from '../ai-orchestrator'

export function registerMockProvider(): void {
  const provider = new MockAIProvider()
  aiOrchestrator.registerProvider(provider)
  aiOrchestrator.setFallbackChain(['mock'])
}