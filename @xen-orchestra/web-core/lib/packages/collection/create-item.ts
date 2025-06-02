import type { CollectionItem, CollectionItemId, CollectionItemProperties, FlagRegistry } from './types.ts'
import { reactive } from 'vue'

export function createItem<
  TSource,
  TFlag extends string,
  TProperties extends CollectionItemProperties,
  TId extends CollectionItemId,
>(
  id: TId,
  source: TSource,
  properties: TProperties,
  flagRegistry: FlagRegistry<TId, TFlag>
): CollectionItem<TSource, TFlag, TProperties, TId> {
  return {
    id,
    source,
    toggleFlag(flag: TFlag, shouldBeFlagged?: boolean) {
      flagRegistry.toggleFlag(id, flag, shouldBeFlagged)
    },
    flags: new Proxy({} as Record<TFlag, boolean>, {
      has(_, flag) {
        return flagRegistry.isFlagDefined(flag as TFlag)
      },
      get(_, flag) {
        if (typeof flag === 'symbol' || flag.startsWith('__v_')) {
          return undefined
        }

        return flagRegistry.isFlagged(id, flag as TFlag)
      },
      set(_, flag, value: boolean) {
        flagRegistry.toggleFlag(id, flag as TFlag, value)

        return true
      },
    }),
    properties: reactive(properties),
  }
}
