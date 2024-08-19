import type { WritableComputedRef } from 'vue'

export function handleDelete(source: WritableComputedRef<any>, value: any) {
  if (Array.isArray(source.value)) {
    source.value = [...source.value].splice(value, 1)
  } else if (source.value instanceof Set) {
    source.value = new Set(source.value)
    source.value.delete(value)
  } else if (source.value instanceof Map) {
    source.value = new Map(source.value)
    source.value.delete(value)
  } else if (typeof source.value === 'object' && source.value !== null) {
    source.value = { ...source.value }
    delete source.value[value]
  }
}
