import { eventHandler, getQuery, createError } from '@tanstack/nitro-v2-vite-plugin'
import { searchService } from '../../services/search.service'
import type { SearchOptions } from '../../services/search.service'

// GET /api/v1/search
export const search = eventHandler(async (event) => {
  const query = getQuery(event)
  
  if (!query.q) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Query parameter "q" is required',
    })
  }

  const options: SearchOptions = {
    query: query.q as string,
    types: query.types ? (Array.isArray(query.types) ? query.types : [query.types]) : undefined,
    sources: query.sources ? (Array.isArray(query.sources) ? query.sources : [query.sources]) : undefined,
    limit: query.limit ? parseInt(query.limit as string) : 20,
    offset: query.offset ? parseInt(query.offset as string) : 0,
  }

  try {
    const results = await searchService.search(options)
    return results
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Search failed',
    })
  }
})

// GET /api/v1/search/history
export const getSearchHistory = eventHandler(async () => {
  const history = searchService.getSearchHistory()
  
  return {
    data: history,
    meta: {
      total: history.length,
    },
  }
})

// DELETE /api/v1/search/history
export const clearSearchHistory = eventHandler(async () => {
  searchService.clearSearchHistory()
  
  return {
    meta: {
      message: 'Search history cleared',
    },
  }
})