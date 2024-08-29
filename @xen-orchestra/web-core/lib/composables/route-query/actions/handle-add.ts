import type { WritableComputedRef } from 'vue'

export function handleAdd(source: WritableComputedRef<any>, value: any) {
  if (Array.isArray(source.value)) {
    source.value = [...source.value, value]
  } else if (source.value instanceof Set) {
    source.value = new Set(source.value).add(value)
  }
}
