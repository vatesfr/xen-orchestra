import type { CollectionConfigProperties, GuessItemId } from '@core/packages/collection/types.ts'

function assertValidId(id: unknown): asserts id is PropertyKey {
  const type = typeof id

  if (!['string', 'number', 'symbol'].includes(type)) {
    throw new TypeError(`Invalid ID type: ${type}. Expected string, number, or bigint.`)
  }
}

export function guessItemId<TSource, TProperties extends CollectionConfigProperties>(
  source: TSource,
  properties: TProperties | undefined
) {
  let id

  if (typeof properties === 'object' && properties !== null && 'id' in properties) {
    id = properties.id
  } else if (typeof source === 'object' && source !== null && 'id' in source) {
    id = source.id
  }

  assertValidId(id)

  return id as GuessItemId<TSource, TProperties>
}
