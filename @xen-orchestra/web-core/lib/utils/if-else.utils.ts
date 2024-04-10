import { watch, type WatchOptions, type WatchSource } from 'vue'

export interface IfElseOptions extends Pick<WatchOptions, 'immediate'> {}

export function ifElse(
  source: WatchSource<boolean>,
  onTrue: VoidFunction,
  onFalse: VoidFunction,
  options?: IfElseOptions
) {
  return watch(
    source,
    value => {
      if (value) {
        onTrue()
      } else {
        onFalse()
      }
    },
    options
  )
}
