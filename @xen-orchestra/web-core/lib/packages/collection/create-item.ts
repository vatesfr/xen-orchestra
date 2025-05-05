import { guessItemId } from '@core/packages/collection/guess-item-id.ts'
import type { CollectionConfigProperties, CollectionItem, FlagRegistry } from '@core/packages/collection/types.ts'
import { reactive } from 'vue'

export function createItem<TSource, TFlag extends string, TProperties extends CollectionConfigProperties>(
  source: TSource,
  getProperties: undefined | ((source: TSource) => TProperties),
  flagRegistry: FlagRegistry<TFlag>
): CollectionItem<TSource, TFlag, TProperties> {
  const properties = reactive(getProperties?.(source) ?? ({} as TProperties))

  const id = guessItemId(source, properties)

  return {
    id,
    source,
    toggleFlag(flag: TFlag, forcedValue?: boolean) {
      flagRegistry.toggleFlag(id, flag, forcedValue)
    },
    flags: new Proxy({} as Record<TFlag, boolean>, {
      has(_, flag: TFlag) {
        return flagRegistry.isFlagDefined(flag)
      },
      get(_, flag: TFlag) {
        if (!flagRegistry.isFlagDefined(flag)) {
          return undefined
        }

        return flagRegistry.isFlagged(id, flag)
      },
      set(_, flag: TFlag, value: boolean) {
        flagRegistry.toggleFlag(id, flag, value)

        return true
      },
    }),
    properties,
  }
}
