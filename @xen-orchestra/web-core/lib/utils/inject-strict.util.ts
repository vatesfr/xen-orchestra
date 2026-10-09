import { inject, type InjectionKey } from 'vue'

export function injectStrict<T>(key: InjectionKey<T>, errorMessage: string): T {
  const value = inject(key, undefined)

  if (value === undefined) {
    throw new Error(errorMessage)
  }

  return value
}
