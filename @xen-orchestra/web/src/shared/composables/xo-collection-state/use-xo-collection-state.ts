import { toNameConfig } from '@/shared/composables/xo-collection-state/to-name-config.ts'
import type { BaseName, CollectionState, NameConfig } from '@/shared/composables/xo-collection-state/types.ts'
import type { ResourceContext } from '@core/packages/remote-resource/types.ts'
import type { XoRecord } from '@vates/types'
import { reactify } from '@vueuse/shared'
import { computed, type Ref } from 'vue'

export function useXoCollectionState<TRecord extends Partial<XoRecord>, const TBaseName extends string>(
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

export function useXoCollectionState<TRecord extends Partial<XoRecord>, const TBaseName extends [string, string]>(
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
  // Index the collection by id so lookups are O(1). Without it, `getById`/`getByIds` are linear
  // scans, which become O(n²) when called per record (e.g. resolving each VM's VBDs/VDIs).
  // The index is lazy and only rebuilt when the collection changes.
  const recordsById = computed(() => {
    const map = new Map<TRecord['id'], TRecord>()

    for (const record of collection.value) {
      map.set(record.id, record)
    }

    return map
  })

  function getById(id: TRecord['id'] | undefined) {
    if (id === undefined) {
      return undefined
    }

    return recordsById.value.get(id)
  }

  function getByIds(ids: TRecord['id'][]) {
    const records: TRecord[] = []

    for (const id of ids) {
      const record = recordsById.value.get(id)

      if (record !== undefined) {
        records.push(record)
      }
    }

    return records
  }

  function hasById(id: TRecord['id'] | undefined) {
    if (id === undefined) {
      return false
    }

    return recordsById.value.has(id)
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
