import { type MaybeRefOrGetter } from 'vue'
import { type Sources, type TableVNode, type TransformProperty, transformSources } from '..'

export function defineTable<TSource, TConfig extends Record<string, unknown> = Record<string, unknown>>(
  setup: (sources: Sources<TSource>, config: TConfig) => () => TableVNode
) {
  return function useTable<TUseSource>(
    sources: MaybeRefOrGetter<TUseSource[]>,
    config: TConfig & TransformProperty<TSource, TUseSource>
  ) {
    return setup(transformSources<TSource>(sources, config?.transform), config)
  }
}
