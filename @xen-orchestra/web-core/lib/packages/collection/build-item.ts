import type { CollectionItem, CollectionOptions, FlagRegistry } from '@core/packages/collection/types.ts'
import type { ComputedRef, UnwrapRef } from 'vue'

export function buildItem<
  TSource,
  TId extends string | number,
  TFlag extends string,
  TProperties extends Record<string, ComputedRef>,
>(
  source: TSource,
  options: CollectionOptions<TSource, TId, TFlag, TProperties>,
  flagRegistry: FlagRegistry<TFlag>
): CollectionItem<TSource, TId, TFlag, UnwrapRef<TProperties>> {
  const id = options.identifier(source)
  const properties = options.properties?.(source)

  return {
    id,
    source,
    toggleFlag(flag: TFlag, forcedValue = !flagRegistry.hasFlag(id, flag)) {
      flagRegistry.setFlag(id, flag, forcedValue)
    },
    flags: new Proxy({} as Record<TFlag, boolean>, {
      has(target, flag: TFlag) {
        return flagRegistry.checkFlag(flag)
      },
      get(target, flag: TFlag) {
        return flagRegistry.hasFlag(id, flag)
      },
      set(target, flag: TFlag, value) {
        flagRegistry.setFlag(id, flag, value)

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
