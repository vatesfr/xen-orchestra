import type { Mapping } from './types.ts'
import { toValue } from 'vue'

export function convertToMap<TFrom, TTo>(_mapping: Mapping<TFrom, TTo>): Map<TFrom, TTo> {
  const mapping = toValue(_mapping)

  return mapping instanceof Map
    ? mapping
    : Array.isArray(mapping)
      ? new Map<TFrom, TTo>(mapping)
      : new Map<TFrom, TTo>(Object.entries(mapping) as [TFrom, TTo][])
}
