import type { AllowedFlagConfig, CollectionItem } from '@core/composables/collection/collection.types.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { useMemoize } from '@vueuse/core'
import { toValue } from 'vue'

export function createItemBuilder<
  TSource,
  TId extends string,
  TAllowedFlag extends string,
  TProperties extends Record<string, any>,
>({
  hasItemFlag,
  toggleItemFlag,
  propertiesOption,
}: {
  hasItemFlag: (id: TId, flag: TAllowedFlag) => boolean
  toggleItemFlag: (id: TId, flag: TAllowedFlag, value?: boolean) => void
  propertiesOption: Record<string, (source: TSource) => any> | undefined
}) {
  return useMemoize(
    (id: TId, source: TSource): CollectionItem<TSource, TId, TAllowedFlag, TProperties> => ({
      id,
      source,
      toggleFlag(flag: TAllowedFlag, forcedValue?: boolean) {
        toggleItemFlag(id, flag, forcedValue)
      },
      flags: new Proxy({} as Record<TAllowedFlag, boolean>, {
        get: (_, flag: TAllowedFlag) => hasItemFlag(id, flag),
        set: (_, flag: TAllowedFlag, value: boolean) => {
          toggleItemFlag(id, flag, value)

          return true
        },
      }),
      properties: new Proxy({} as TProperties, {
        get: (_, property) => {
          return propertiesOption?.[property as string]?.(source)
        },
      }),
    })
  )
}

export function parseAllowedFlagsOption(
  _allowedFlags: MaybeArray<string | Record<string, AllowedFlagConfig>> | undefined
) {
  const allowedFlagsMap = new Map<string, AllowedFlagConfig>()
  const allowedFlags = toArray(toValue(_allowedFlags))

  for (const allowedFlag of allowedFlags) {
    if (typeof allowedFlag === 'string') {
      allowedFlagsMap.set(allowedFlag, {})
    } else {
      Object.entries<AllowedFlagConfig>(allowedFlag).forEach(([flag, config]) => {
        allowedFlagsMap.set(flag, config)
      })
    }
  }

  return allowedFlagsMap
}
