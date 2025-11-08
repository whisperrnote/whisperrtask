import type { ContextLink } from '../types'

export interface GraphNode {
  id: string
  type: 'task' | 'note' | 'meeting' | 'credential' | 'user' | 'project'
  app: 'whisperrtask' | 'whisperrnote' | 'whisperrmeet' | 'whisperrpass'
  data: Record<string, any>
  metadata: {
    createdAt: number
    updatedAt: number
    keywords: string[]
    embedding?: number[]
  }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: 'created_from' | 'references' | 'depends_on' | 'related_to' | 'assigned_to' | 'mentioned_in'
  weight: number
  metadata: {
    createdAt: number
    reason?: string
  }
}

export interface ContextGraph {
  nodes: Map<string, GraphNode>
  edges: Map<string, GraphEdge>
  adjacencyList: Map<string, Set<string>>
}

export interface TraversalOptions {
  maxDepth?: number
  edgeTypes?: GraphEdge['type'][]
  nodeTypes?: GraphNode['type'][]
  minWeight?: number
  limit?: number
}

export interface SemanticMatch {
  node: GraphNode
  score: number
  path?: GraphEdge[]
}
