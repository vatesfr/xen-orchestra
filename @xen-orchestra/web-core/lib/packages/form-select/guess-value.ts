import type { CollectionItemProperties } from '@core/packages/collection'
import { hasObjectProperty } from '@core/utils/object.util.ts'
import type { GetOptionValue } from './types.ts'

export function guessValue<TSource, TValue, TCustomProperties extends CollectionItemProperties>(
  source: TSource,
  customProperties: TCustomProperties,
  getter: GetOptionValue<TSource, TCustomProperties>
): TValue {
  if (getter === undefined) {
    return source as unknown as TValue
  }

  if (typeof getter === 'function') {
    return getter(source, customProperties) as TValue
  }

  if (hasObjectProperty(source, getter)) {
    return source[getter] as TValue
  }

  throw new Error(`Property "${String(getter)}" not found in source: ${JSON.stringify(source)}`)
}
