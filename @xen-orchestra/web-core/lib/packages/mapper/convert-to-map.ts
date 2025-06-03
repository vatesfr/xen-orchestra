import type { AnyMapping } from './types.ts'

export function convertToMap(mapping: AnyMapping): Map<unknown, unknown> {
  return mapping instanceof Map ? mapping : Array.isArray(mapping) ? new Map(mapping) : new Map(Object.entries(mapping))
}
