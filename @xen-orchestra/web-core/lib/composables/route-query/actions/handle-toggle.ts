import type { WritableComputedRef } from 'vue'

export function handleToggle(source: WritableComputedRef<any>, valueOrState?: any, state?: any) {
  if (source.value instanceof Set) {
    const shouldAdd = state ?? !source.value.has(valueOrState)
    const newSource = new Set(source.value)

    if (shouldAdd) {
      newSource.add(valueOrState)
    } else {
      newSource.delete(valueOrState)
    }

    source.value = newSource
  } else if (typeof source.value === 'boolean') {
    source.value = valueOrState ?? !source.value
  }
}
