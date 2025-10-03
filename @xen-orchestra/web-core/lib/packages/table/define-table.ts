import type { Sources, TransformProperty } from './types'
import { type MaybeRefOrGetter } from 'vue'
import { transformSources } from './transform-sources'

export function defineTable<TSource, TConfig extends Record<string, unknown> = Record<string, unknown>>(
  setup: (sources: Sources<TSource>, config: TConfig) => any
) {
  return function useTable<TUseSource>(
    sources: MaybeRefOrGetter<TUseSource[]>,
    config: TConfig & TransformProperty<TSource, TUseSource>
  ) {
    return setup(transformSources<TSource>(sources, config?.transform), config)
  }
}
