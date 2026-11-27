import { inject, type InjectionKey } from 'vue'

/**
 * `inject(key)`, throwing when nothing provides it: run under the component that should provide it.
 */
export function injectOrThrow<T>(key: InjectionKey<T>) {
  const value = inject(key)

  if (value === undefined) {
    throw new Error(`${String(key)} is not provided`)
  }

  return value
}
