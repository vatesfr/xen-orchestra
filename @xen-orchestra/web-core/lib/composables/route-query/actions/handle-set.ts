import type { WritableComputedRef } from 'vue'

export function handleSet(source: WritableComputedRef<any>, key: any, value: any) {
  if (Array.isArray(source.value)) {
    source.value = [...source.value]
    source.value[key] = value
  } else if (source.value instanceof Map) {
    source.value = new Map(source.value)
    source.value.set(key, value)
  } else if (typeof source.value === 'object') {
    if (source.value === null) {
      return
    }

    source.value = { ...source.value, [key]: value }
  }
}
