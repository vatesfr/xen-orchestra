import type { CollectionItem } from '@core/packages/collection/types.ts'
import { useMemoize } from '@vueuse/core'
import type { ComputedRef } from 'vue'

export function createItemBuilder<
  TSource,
  TId extends string,
  TFlag extends string,
  TProperties extends Record<string, any>,
>({
  hasItemFlag,
  toggleItemFlag,
  propertiesOption,
}: {
  hasItemFlag: (id: TId, flag: TFlag) => boolean
  toggleItemFlag: (id: TId, flag: TFlag, value?: boolean) => void
  propertiesOption: ((source: TSource) => Record<string, ComputedRef>) | undefined
}) {
  return useMemoize((id: TId, source: TSource): CollectionItem<TSource, TId, TFlag, TProperties> => {
    const properties = propertiesOption?.(source)

    return {
      id,
      source,
      toggleFlag(flag: TFlag, forcedValue?: boolean) {
        toggleItemFlag(id, flag, forcedValue)
      },
      flags: new Proxy({} as Record<TFlag, boolean>, {
        has: () => true,
        get: (_, flag: TFlag) => hasItemFlag(id, flag),
        set: (_, flag: TFlag, value: boolean) => {
          toggleItemFlag(id, flag, value)

          return true
        },
      }),
      properties: new Proxy({} as TProperties, {
        has: (_, property) => {
          return properties !== undefined ? property in properties : false
        },
        get: (_, property) => {
          return properties?.[property as string]?.value
        },
      }),
    }
  })
}
