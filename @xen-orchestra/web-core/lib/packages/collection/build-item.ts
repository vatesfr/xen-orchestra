import type { CollectionItem, CollectionOptions, FlagStore } from '@core/packages/collection/types.ts'
import type { ComputedRef, UnwrapRef } from 'vue'

export function buildItem<
  TSource,
  TId extends string | number,
  TFlag extends string,
  TProperties extends Record<string, ComputedRef>,
>(
  collectionId: string,
  source: TSource,
  options: CollectionOptions<TSource, TId, TFlag, TProperties>,
  flagStore: FlagStore
): CollectionItem<TSource, TId, TFlag, TProperties> {
  const id = options.identifier(source)
  const properties = options.properties?.(source)

  return {
    id,
    source,
    toggleFlag(flag: TFlag, forcedValue = !flagStore.hasFlag(collectionId, flag, id)) {
      flagStore.setFlag(collectionId, flag, id, forcedValue)
    },
    flags: new Proxy({} as Record<TFlag, boolean>, {
      has(target, flag: TFlag) {
        return flagStore.isFlagAvailable(collectionId, flag)
      },
      get(target, flag: TFlag) {
        return flagStore.hasFlag(collectionId, flag, id)
      },
      set(target, flag: TFlag, value) {
        flagStore.setFlag(collectionId, flag, id, value)

        return true
      },
    }),
    properties: new Proxy({} as UnwrapRef<TProperties>, {
      has(target, prop: Extract<keyof TProperties, string>) {
        return properties !== undefined && prop in properties
      },
      get(target, prop: Extract<keyof TProperties, string>) {
        return properties?.[prop].value
      },
    }),
  }
}
