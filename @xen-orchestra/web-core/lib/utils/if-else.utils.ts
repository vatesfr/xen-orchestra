import { watch, type WatchCallback, type WatchOptions, type WatchSource } from 'vue'

export interface IfElseOptions extends Omit<WatchOptions, 'once'> {}

export function ifElse<T>(
  source: WatchSource<T | false | null | undefined>,
  cbIf: WatchCallback<T>,
  cbElse: WatchCallback<T | false | null | undefined>,
  options?: IfElseOptions
) {
  return watch(
    source,
    (v, ov, onInvalidate) => {
      if (v) {
        cbIf(v, ov, onInvalidate)
      } else {
        cbElse(v, ov, onInvalidate)
      }
    },
    options
  )
}
