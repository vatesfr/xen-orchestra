import { toNameConfig } from '@/composables/xo-collection-state/to-name-config.ts'
import type { BaseName, CollectionState, NameConfig } from '@/composables/xo-collection-state/types.ts'
import type { ResourceContext } from '@core/packages/remote-resource/types.ts'
import type { XoRecord } from '@vates/types'
import { reactify } from '@vueuse/shared'
import { type Ref } from 'vue'

export function useXoCollectionState<TRecord extends XoRecord, const TBaseName extends string>(
  collection: Ref<TRecord[]>,
  config: {
    context: ResourceContext<any[]>
    baseName: TBaseName
  }
): CollectionState<
  TRecord,
  {
    records: `${TBaseName}s`
    getById: `get${Capitalize<TBaseName>}ById`
    getByIds: `get${Capitalize<TBaseName>}sByIds`
    useGetById: `useGet${Capitalize<TBaseName>}ById`
    useGetByIds: `useGet${Capitalize<TBaseName>}sByIds`
    hasById: `has${Capitalize<TBaseName>}ById`
    useHasById: `useHas${Capitalize<TBaseName>}ById`
    isReady: `are${Capitalize<TBaseName>}sReady`
    isFetching: `are${Capitalize<TBaseName>}sFetching`
    hasError: `has${Capitalize<TBaseName>}FetchError`
    lastError: `last${Capitalize<TBaseName>}FetchError`
  }
>

export function useXoCollectionState<TRecord extends XoRecord, const TBaseName extends [string, string]>(
  collection: Ref<TRecord[]>,
  config: {
    context: ResourceContext<any[]>
    baseName: TBaseName
  }
): CollectionState<
  TRecord,
  {
    records: `${TBaseName[1]}`
    getById: `get${Capitalize<TBaseName[0]>}ById`
    getByIds: `get${Capitalize<TBaseName[1]>}ByIds`
    useGetById: `useGet${Capitalize<TBaseName[0]>}ById`
    useGetByIds: `useGet${Capitalize<TBaseName[1]>}ByIds`
    hasById: `has${Capitalize<TBaseName[0]>}ById`
    useHasById: `useHas${Capitalize<TBaseName[0]>}ById`
    isReady: `are${Capitalize<TBaseName[1]>}Ready`
    isFetching: `are${Capitalize<TBaseName[1]>}Fetching`
    hasError: `has${Capitalize<TBaseName[0]>}FetchError`
    lastError: `last${Capitalize<TBaseName[0]>}FetchError`
  }
>

export function useXoCollectionState<TRecord extends XoRecord, TNameConfig extends NameConfig>(
  collection: Ref<TRecord[]>,
  config: {
    context: ResourceContext<any[]>
    baseName: TNameConfig
  }
): CollectionState<TRecord, TNameConfig>

export function useXoCollectionState<TRecord extends XoRecord, TNameConfig extends BaseName>(
  collection: Ref<TRecord[]>,
  config: {
    context: ResourceContext<any[]>
    baseName: TNameConfig
  }
) {
  function getById(id: TRecord['id'] | undefined) {
    if (id === undefined) {
      return undefined
    }

    return collection.value.find(record => record.id === id)
  }

  function getByIds(ids: TRecord['id'][]) {
    const idSet = new Set(ids)
    return collection.value.filter(record => idSet.has(record.id))
  }

  function hasById(id: TRecord['id'] | undefined) {
    if (id === undefined) {
      return false
    }

    return collection.value.some(record => record.id === id)
  }

  const names = toNameConfig(config.baseName)

  return {
    [names.records]: collection,
    [names.getById]: getById,
    [names.useGetById]: reactify(getById),
    [names.getByIds]: getByIds,
    [names.useGetByIds]: reactify(getByIds),
    [names.hasById]: hasById,
    [names.useHasById]: reactify(hasById),
    [names.isReady]: config.context.isReady,
    [names.isFetching]: config.context.isFetching,
    [names.hasError]: config.context.hasError,
    [names.lastError]: config.context.lastError,
  } satisfies CollectionState<TRecord, NameConfig>
}
