import { hasObjectProperty } from '@core/utils/object.util.ts'
import type { CollectionItemId, GetItemId } from './types.ts'

export function guessItemId<TSource>(source: TSource, getter: GetItemId<TSource>): CollectionItemId {
  const id = extractItemId(source, getter)

  if (isCollectionId(id)) {
    return id
  }

  throw new Error(`Unable to guess id from source: ${JSON.stringify(source)}`)
}

function isCollectionId(value: unknown): value is CollectionItemId {
  return typeof value === 'string' || typeof value === 'number'
}

function extractItemId<TSource>(source: TSource, getter: GetItemId<TSource>) {
  if (getter === undefined) {
    if (hasObjectProperty(source, 'id')) {
      return source.id
    }

    return source
  }

  if (typeof getter === 'function') {
    return getter(source)
  }

  if (hasObjectProperty(source, getter)) {
    return source[getter]
  }

  throw new Error(`Property "${String(getter)}" not found in source: ${JSON.stringify(source)}`)
}
