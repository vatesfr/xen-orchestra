import { type MaybeRefOrGetter } from 'vue'
import { type Sources, type TransformProperty, transformSources } from '..'

export function defineTypedTable<
  TTypedSource extends { type: string; data: Sources },
  TConfig extends Record<string, unknown> = Record<string, unknown>,
>(setup: (typedSource: TTypedSource, config: TConfig) => any) {
  return function useTable<
    TUseSource,
    const TType extends TTypedSource['type'],
    TSource extends TTypedSource extends { type: TType; data: Sources<infer TSource> } ? TSource : never,
  >(type: TType, sources: MaybeRefOrGetter<TUseSource[]>, config: TConfig & TransformProperty<TSource, TUseSource>) {
    return setup(
      { type, data: transformSources<TSource>(sources, config.transform) } as unknown as TTypedSource,
      config
    )
  }
}
