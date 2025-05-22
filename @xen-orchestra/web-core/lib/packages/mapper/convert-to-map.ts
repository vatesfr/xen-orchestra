import type { AnyMapping } from './types.ts'
import { toValue } from 'vue'

export function convertToMap(_mapping: AnyMapping): Map<unknown, unknown> {
  const mapping = toValue(_mapping)

  return mapping instanceof Map ? mapping : Array.isArray(mapping) ? new Map(mapping) : new Map(Object.entries(mapping))
}
