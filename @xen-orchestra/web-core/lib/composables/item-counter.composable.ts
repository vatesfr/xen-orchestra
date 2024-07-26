import { computed, type MaybeRefOrGetter, toValue } from 'vue'

type Counters<TConfig> = { [K in keyof TConfig | '$other']: number }

export function useItemCounter<TItem, TConfig extends Record<string, (item: TItem) => boolean>>(
  items: MaybeRefOrGetter<TItem[]>,
  config: TConfig
) {
  const keys = Object.keys(config) as (keyof TConfig)[]

  return computed(() => {
    const counters = Object.fromEntries(keys.concat('$other').map(key => [key, 0])) as Counters<TConfig>

    for (const item of toValue(items)) {
      let matched = false

      for (const key of keys) {
        if (config[key](item)) {
          matched = true
          counters[key] += 1
          break
        }
      }

      if (!matched) {
        counters.$other += 1
      }
    }

    return counters
  })
}
