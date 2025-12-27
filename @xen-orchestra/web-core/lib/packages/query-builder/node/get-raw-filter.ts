import type { GroupOperator, QueryBuilderNode } from '@core/packages/query-builder/types.ts'

export function getRawFilter(nodes: QueryBuilderNode[], operator: GroupOperator) {
  const rawFilters = nodes.map(node => node.rawFilter).filter(filter => filter.trim() !== '')

  if (rawFilters.length === 0) {
    return ''
  }

  if (rawFilters.length === 1) {
    return rawFilters[0]
  }

  return `${operator === 'or' ? '|' : ''}(${rawFilters.join(' ')})`
}
