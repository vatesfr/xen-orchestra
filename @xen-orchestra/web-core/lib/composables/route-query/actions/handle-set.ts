import type { WritableComputedRef } from 'vue'

export function handleSet(source: WritableComputedRef<any>, key: any, value: any) {
  if (Array.isArray(source.value)) {
    const newArray = source.value.slice()
    newArray[key] = value
    source.value = newArray
  } else if (source.value instanceof Map) {
    const newMap = new Map(source.value)
    newMap.set(key, value)
    source.value = newMap
  } else if (typeof source.value === 'object') {
    if (source.value === null) {
      return
    }

    source.value = { ...source.value, [key]: value }
  }
}
