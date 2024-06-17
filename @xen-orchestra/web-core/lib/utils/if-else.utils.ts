import type { MaybeArray, Noop } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { watch, type WatchOptions, type WatchSource } from 'vue'

export interface IfElseOptions extends Pick<WatchOptions, 'immediate'> {}

export function ifElse(
  source: WatchSource<boolean>,
  onTrue: MaybeArray<Noop>,
  onFalse: MaybeArray<Noop>,
  options?: IfElseOptions
) {
  const onTrueFunctions = toArray(onTrue)
  const onFalseFunctions = toArray(onFalse)

  return watch(
    source,
    value => {
      if (value) {
        onTrueFunctions.forEach(func => func())
      } else {
        onFalseFunctions.forEach(func => func())
      }
    },
    options
  )
}
