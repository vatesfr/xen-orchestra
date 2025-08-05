import { toNameConfig } from '@/composables/xo-collection-state/to-name-config.ts'
import type { BaseName, CollectionState, NameConfig } from '@/composables/xo-collection-state/types.ts'
import type { XoRecord } from '@/types/xo'
import type { ResourceContext } from '@core/packages/remote-resource/types.ts'
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
    isReady: `is${Capitalize<TBaseName>}CollectionReady`
    hasError: `has${Capitalize<TBaseName>}CollectionError`
    lastError: `last${Capitalize<TBaseName>}CollectionError`
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
    isReady: `is${Capitalize<TBaseName[0]>}CollectionReady`
    hasError: `has${Capitalize<TBaseName[0]>}CollectionError`
    lastError: `last${Capitalize<TBaseName[0]>}CollectionError`
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
    [names.hasError]: config.context.hasError,
    [names.lastError]: config.context.lastError,
  } satisfies CollectionState<TRecord, NameConfig>
}
