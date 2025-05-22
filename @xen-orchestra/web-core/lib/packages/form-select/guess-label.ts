import type { CollectionItemProperties } from '@core/packages/collection'
import { hasObjectProperty } from '@core/utils/object.util.ts'
import type { GetOptionLabel } from './types.ts'

export function guessLabel<TSource, TCustomProperties extends CollectionItemProperties>(
  source: TSource,
  extraProperties: TCustomProperties,
  getter: GetOptionLabel<TSource, TCustomProperties>
): string {
  const label = extractLabel(source, extraProperties, getter)

  if (typeof label === 'string' || typeof label === 'number') {
    return label.toString()
  }

  throw new Error(`Unable to guess label from source: ${JSON.stringify(source)}`)
}

export function extractLabel<TSource, TCustomProperties extends CollectionItemProperties>(
  source: TSource,
  extraProperties: TCustomProperties,
  getter: undefined | keyof TSource | ((source: TSource, properties: TCustomProperties) => string)
): unknown {
  if (getter === undefined) {
    if (hasObjectProperty(source, 'label')) {
      return source.label
    }

    return source
  }

  if (typeof getter === 'function') {
    return getter(source, extraProperties)
  }

  if (hasObjectProperty(source, getter)) {
    return source[getter]
  }

  if (source === undefined) {
    return ''
  }

  throw new Error(`Property "${String(getter)}" not found in source: ${JSON.stringify(source)}`)
}
