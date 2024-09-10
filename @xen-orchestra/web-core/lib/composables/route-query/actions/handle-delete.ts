import type { WritableComputedRef } from 'vue'

export function handleDelete(source: WritableComputedRef<any>, value: any) {
  if (Array.isArray(source.value)) {
    source.value = [...source.value].splice(value, 1)
  } else if (source.value instanceof Set) {
    const newSet = new Set(source.value)
    newSet.delete(value)
    source.value = newSet
  } else if (source.value instanceof Map) {
    const newMap = new Map(source.value)
    newMap.delete(value)
    source.value = newMap
  } else if (typeof source.value === 'object' && source.value !== null) {
    const newObject = { ...source.value }
    delete newObject[value]
    source.value = newObject
  }
}
