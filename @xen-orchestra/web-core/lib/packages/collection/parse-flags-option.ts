import type { FlagConfig } from '@core/packages/collection/types.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { toValue } from 'vue'

export function parseFlagsOption(_flags: MaybeArray<string | Record<string, FlagConfig>> | undefined) {
  const flagsMap = new Map<string, FlagConfig>()
  const flags = toArray(toValue(_flags))

  for (const flag of flags) {
    if (typeof flag === 'string') {
      flagsMap.set(flag, {})
    } else {
      Object.entries<FlagConfig>(flag).forEach(([flag, config]) => {
        flagsMap.set(flag, config)
      })
    }
  }

  return flagsMap
}
