import type { ResolvedItemId, ItemProperties } from '@core/packages/collection/types.ts'

export function resolveItemId<TSource, TProperties extends ItemProperties>(source: TSource, properties: TProperties) {
  let id

  if (properties?.id !== undefined) {
    id = properties.id
  } else if (typeof source === 'object' && source !== null && 'id' in source) {
    id = source.id
  } else {
    id = JSON.stringify(source)

    console.warn(
      `Cannot resolve item ID: no id property found in source or properties. Falling back to JSON.stringify(source): ${id}`
    )
  }

  return id as ResolvedItemId<TSource, TProperties>
}
