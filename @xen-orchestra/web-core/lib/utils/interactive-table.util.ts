import { noop } from 'lodash'

const COLUMN_NAME_SEPARATOR = '__'

export type InteractionId = 'sort-asc' | 'sort-desc' | 'group' | 'filter' | 'hide'

function compare(prev: unknown, next: unknown) {
  if (typeof prev === 'string' && typeof next === 'string') {
    return prev.localeCompare(next)
  } else if (typeof prev === 'number' && typeof next === 'number') {
    return prev - next
  } else if (prev instanceof Date && next instanceof Date) {
    return prev.getTime() - next.getTime()
  } else {
    return String(prev).localeCompare(String(next))
  }
}

export function parseColumnName(columnName: string) {
  const [tableName, columnId] = columnName.split(COLUMN_NAME_SEPARATOR)
  return { tableName, columnId }
}

export function stringifyColumnName(tableName: string | undefined, columnId: string | undefined) {
  return `${tableName}${COLUMN_NAME_SEPARATOR}${columnId}`
}

export const interactionsFn: Record<InteractionId, Function> = {
  'sort-asc': (data: any[], path: string) => data.sort((prev, next) => compare(prev[path], next[path])),
  'sort-desc': (data: any[], path: string) => data.sort((prev, next) => compare(next[path], prev[path])),
  group: noop,
  filter: noop,
  hide: noop,
}
