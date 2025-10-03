import type { Sources, TransformProperty } from './types'
import type { MaybeRefOrGetter } from 'vue'
import { transformSources } from './transform-sources'

export function defineMultiSourceTable<
  TSources extends Record<string, Sources>,
  TConfig extends Record<string, unknown> = Record<string, unknown>,
>(setup: (sources: TSources, config: TConfig) => any) {
  return function useTable<
    TUseSources extends {
      [K in keyof TSources]: any
    },
    TTransforms extends {
      [K in keyof TSources]: TSources[K] extends Sources<infer T>
        ? TransformProperty<T, TUseSources[K], K & string>[K & string]
        : never
    },
  >(
    sources: {
      [K in keyof TUseSources]: MaybeRefOrGetter<TUseSources[K][]>
    },
    config: TConfig &
      (Record<keyof TTransforms, undefined> extends TTransforms
        ? { transform?: Partial<TTransforms> }
        : {
            transform: { [K in keyof TTransforms as undefined extends TTransforms[K] ? K : never]?: TTransforms[K] } & {
              [K in keyof TTransforms as undefined extends TTransforms[K] ? never : K]: TTransforms[K]
            }
          })
  ) {
    const transformedSources = Object.fromEntries(
      Object.entries(sources).map(([key, value]) => [
        key,
        transformSources(value, (config.transform as any)?.[key as any]),
      ])
    )

    return setup(transformedSources as TSources, config)
  }
}
