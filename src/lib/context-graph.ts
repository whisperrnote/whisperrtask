import type { 
  GraphNode, 
  GraphEdge, 
  ContextGraph,
  TraversalOptions,
  SemanticMatch 
} from '../types/graph'
import type { ContextLink } from '../types'

export class ContextGraphEngine {
  private static instance: ContextGraphEngine
  private graph: ContextGraph = {
    nodes: new Map(),
    edges: new Map(),
    adjacencyList: new Map(),
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.restoreGraph()
    }
  }

  static getInstance(): ContextGraphEngine {
    if (!ContextGraphEngine.instance) {
      ContextGraphEngine.instance = new ContextGraphEngine()
    }
    return ContextGraphEngine.instance
  }

  addNode(node: GraphNode): void {
    this.graph.nodes.set(node.id, node)
    
    if (!this.graph.adjacencyList.has(node.id)) {
      this.graph.adjacencyList.set(node.id, new Set())
    }
    
    this.persistGraph()
  }

  addEdge(edge: GraphEdge): void {
    if (!this.graph.nodes.has(edge.source) || !this.graph.nodes.has(edge.target)) {
      throw new Error('Both source and target nodes must exist before adding an edge')
    }

    this.graph.edges.set(edge.id, edge)
    
    const sourceEdges = this.graph.adjacencyList.get(edge.source)!
    sourceEdges.add(edge.id)
    
    this.persistGraph()
  }

  getNode(nodeId: string): GraphNode | undefined {
    return this.graph.nodes.get(nodeId)
  }

  removeNode(nodeId: string): void {
    this.graph.nodes.delete(nodeId)
    
    const edgesToRemove = Array.from(this.graph.edges.values())
      .filter(edge => edge.source === nodeId || edge.target === nodeId)
    
    edgesToRemove.forEach(edge => {
      this.graph.edges.delete(edge.id)
    })
    
    this.graph.adjacencyList.delete(nodeId)
    this.graph.adjacencyList.forEach(edges => {
      edges.forEach(edgeId => {
        const edge = this.graph.edges.get(edgeId)
        if (edge && (edge.source === nodeId || edge.target === nodeId)) {
          edges.delete(edgeId)
        }
      })
    })
    
    this.persistGraph()
  }

  findRelatedNodes(
    nodeId: string, 
    options: TraversalOptions = {}
  ): GraphNode[] {
    const {
      maxDepth = 2,
      edgeTypes,
      nodeTypes,
      minWeight = 0,
      limit = 50
    } = options

    const visited = new Set<string>()
    const results: Array<{ node: GraphNode; distance: number }> = []
    const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }]

    visited.add(nodeId)

    while (queue.length > 0 && results.length < limit) {
      const { id, depth } = queue.shift()!

      if (depth >= maxDepth) continue

      const edgeIds = this.graph.adjacencyList.get(id)
      if (!edgeIds) continue

      for (const edgeId of edgeIds) {
        const edge = this.graph.edges.get(edgeId)
        if (!edge) continue

        if (edgeTypes && !edgeTypes.includes(edge.type)) continue
        if (edge.weight < minWeight) continue

        const targetId = edge.target
        if (visited.has(targetId)) continue

        const targetNode = this.graph.nodes.get(targetId)
        if (!targetNode) continue

        if (nodeTypes && !nodeTypes.includes(targetNode.type)) continue

        visited.add(targetId)
        results.push({ node: targetNode, distance: depth + 1 })
        queue.push({ id: targetId, depth: depth + 1 })
      }
    }

    return results
      .sort((a, b) => a.distance - b.distance)
      .map(r => r.node)
      .slice(0, limit)
  }

  findShortestPath(sourceId: string, targetId: string): GraphEdge[] | null {
    const visited = new Set<string>()
    const parent = new Map<string, { nodeId: string; edgeId: string }>()
    const queue: string[] = [sourceId]

    visited.add(sourceId)

    while (queue.length > 0) {
      const currentId = queue.shift()!

      if (currentId === targetId) {
        const path: GraphEdge[] = []
        let current = targetId

        while (parent.has(current)) {
          const { edgeId } = parent.get(current)!
          const edge = this.graph.edges.get(edgeId)!
          path.unshift(edge)
          current = edge.source
        }

        return path
      }

      const edgeIds = this.graph.adjacencyList.get(currentId)
      if (!edgeIds) continue

      for (const edgeId of edgeIds) {
        const edge = this.graph.edges.get(edgeId)
        if (!edge) continue

        if (!visited.has(edge.target)) {
          visited.add(edge.target)
          parent.set(edge.target, { nodeId: currentId, edgeId })
          queue.push(edge.target)
        }
      }
    }

    return null
  }

  findSemanticMatches(
    query: string,
    options: TraversalOptions = {}
  ): SemanticMatch[] {
    const queryKeywords = this.extractKeywords(query.toLowerCase())
    const matches: SemanticMatch[] = []

    for (const node of this.graph.nodes.values()) {
      if (options.nodeTypes && !options.nodeTypes.includes(node.type)) {
        continue
      }

      const score = this.calculateSemanticScore(queryKeywords, node)
      
      if (score > 0) {
        matches.push({ node, score })
      }
    }

    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit || 20)
  }

  private calculateSemanticScore(queryKeywords: string[], node: GraphNode): number {
    const nodeKeywords = node.metadata.keywords || []
    let score = 0

    for (const queryKeyword of queryKeywords) {
      for (const nodeKeyword of nodeKeywords) {
        if (nodeKeyword.includes(queryKeyword) || queryKeyword.includes(nodeKeyword)) {
          score += 1
        }
      }
    }

    if (node.metadata.embedding) {
      // Placeholder for vector similarity when we have embeddings
      // score += cosineSimilarity(queryEmbedding, node.metadata.embedding)
    }

    return score
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for'])
    
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
  }

  indexContent(nodeId: string, content: string): void {
    const node = this.graph.nodes.get(nodeId)
    if (!node) return

    const keywords = this.extractKeywords(content)
    node.metadata.keywords = [...new Set([...node.metadata.keywords, ...keywords])]
    node.metadata.updatedAt = Date.now()
    
    this.graph.nodes.set(nodeId, node)
    this.persistGraph()
  }

  createContextLinks(nodeId: string, limit: number = 5): ContextLink[] {
    const relatedNodes = this.findRelatedNodes(nodeId, {
      maxDepth: 2,
      limit,
    })

    return relatedNodes.map(node => ({
      id: node.id,
      type: this.mapNodeTypeToContextType(node.type),
      sourceApp: node.app,
      resourceId: node.id,
      title: node.data.title || node.data.name || 'Untitled',
      snippet: node.data.snippet || node.data.description,
      url: node.data.url,
    }))
  }

  private mapNodeTypeToContextType(
    nodeType: GraphNode['type']
  ): ContextLink['type'] {
    switch (nodeType) {
      case 'note': return 'note'
      case 'meeting': return 'meeting'
      case 'credential': return 'credential'
      default: return 'external'
    }
  }

  private persistGraph(): void {
    if (typeof window === 'undefined') return

    try {
      const serializable = {
        nodes: Array.from(this.graph.nodes.entries()),
        edges: Array.from(this.graph.edges.entries()),
      }
      
      // In production, this would go to IndexedDB for larger datasets
      const compressed = JSON.stringify(serializable)
      if (compressed.length < 5 * 1024 * 1024) { // 5MB limit
        localStorage.setItem('context_graph', compressed)
      }
    } catch (error) {
      console.error('Failed to persist context graph:', error)
    }
  }

  private restoreGraph(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('context_graph')
      if (!stored) return

      const parsed = JSON.parse(stored)
      this.graph.nodes = new Map(parsed.nodes)
      this.graph.edges = new Map(parsed.edges)
      
      // Rebuild adjacency list
      this.graph.adjacencyList = new Map()
      for (const node of this.graph.nodes.values()) {
        this.graph.adjacencyList.set(node.id, new Set())
      }
      for (const edge of this.graph.edges.values()) {
        const sourceEdges = this.graph.adjacencyList.get(edge.source)
        if (sourceEdges) {
          sourceEdges.add(edge.id)
        }
      }
    } catch (error) {
      console.error('Failed to restore context graph:', error)
    }
  }

  getGraphStats() {
    return {
      nodeCount: this.graph.nodes.size,
      edgeCount: this.graph.edges.size,
      nodeTypes: this.countByType(Array.from(this.graph.nodes.values()).map(n => n.type)),
      edgeTypes: this.countByType(Array.from(this.graph.edges.values()).map(e => e.type)),
    }
  }

  private countByType<T extends string>(items: T[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  clear(): void {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      adjacencyList: new Map(),
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('context_graph')
    }
  }
}

export const contextGraph = ContextGraphEngine.getInstance()
