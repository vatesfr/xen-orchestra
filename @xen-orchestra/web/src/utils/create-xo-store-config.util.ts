import type {
  TypeToCollectionRecord,
  TypeToSingleRecord,
  XoCollectionRecord,
  XoCollectionRecordContext,
  XoCollectionRecordType,
  XoSingleRecord,
  XoSingleRecordContext,
  XoSingleRecordType,
} from '@/types/xo'
import { xoApiDefinition } from '@/utils/xo-api-definition.util'
import type { SubscribableStoreConfig } from '@core/types/subscribable-store.type'
import type { VoidFunction } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { noop, useFetch, useIntervalFn } from '@vueuse/core'
import { computed, readonly, ref, shallowReactive } from 'vue'

type SingleOptions = {
  pollInterval?: number
}

type CollectionOptions<TRecord extends XoCollectionRecord> = {
  sortBy?: (a: TRecord, b: TRecord) => number
  pollInterval?: number
}

export function createXoStoreConfig<
  TType extends XoSingleRecordType,
  TRecord extends XoSingleRecord = TypeToSingleRecord<TType>,
>(type: TType, options?: SingleOptions): SubscribableStoreConfig<XoSingleRecordContext<TRecord>>

export function createXoStoreConfig<
  TType extends XoCollectionRecordType,
  TRecord extends XoCollectionRecord = TypeToCollectionRecord<TType>,
>(type: TType, options?: CollectionOptions<TRecord>): SubscribableStoreConfig<XoCollectionRecordContext<TRecord>>

export function createXoStoreConfig(
  type: XoSingleRecordType | XoCollectionRecordType,
  options?: any
): SubscribableStoreConfig<any> {
  const singleRecordId = Symbol('singleRecordId')

  const apiDefinition = xoApiDefinition[type]

  const isCollection = apiDefinition.type === 'collection'

  const recordsById = shallowReactive(new Map())

  const urlParams = new URLSearchParams(`fields=${apiDefinition.fields}`)

  const url = `/rest/v0/${apiDefinition.path}?${urlParams.toString()}`

  const isReady = ref(false)

  const { isFetching, error, execute, canAbort, abort, data } = useFetch(url, {
    immediate: false,
    beforeFetch({ options }) {
      options.credentials = 'include'

      return { options }
    },
  })
    .get()
    .json()

  const hasError = computed(() => !!error.value)

  const loadData = async () => {
    await execute()

    recordsById.clear()

    if (!data.value) {
      return
    }
    toArray(data.value).forEach(item => {
      const recordToAdd = apiDefinition.handler(item) as any

      if (recordToAdd === undefined) {
        return
      }

      recordsById.set(isCollection ? recordToAdd.id : singleRecordId, recordToAdd)
    })

    isReady.value = true
  }

  let startSubscription: VoidFunction = () => loadData()

  let stopSubscription: VoidFunction = noop

  if (options?.pollInterval !== undefined) {
    const { pause, resume } = useIntervalFn(() => loadData(), options.pollInterval, {
      immediate: false,
      immediateCallback: true,
    })

    startSubscription = () => resume()
    stopSubscription = () => pause()
  }

  const onSubscribe = () => startSubscription()

  const onUnsubscribe = () => {
    if (canAbort.value) {
      abort()
    }

    stopSubscription()

    isReady.value = false
  }

  return {
    context: {
      ...createRecordContext(isCollection, recordsById, singleRecordId, options),
      isFetching: readonly(isFetching),
      isReady: readonly(isReady),
      lastError: readonly(error),
      hasError,
    },
    onSubscribe,
    onUnsubscribe,
    isEnabled: true,
  }
}

function createRecordContext(isCollection: boolean, recordsById: Map<any, any>, singleRecordId: any, options: any) {
  return isCollection
    ? {
        records: computed(() => {
          const results = Array.from(recordsById.values())

          const sortBy = (options as CollectionOptions<any>)?.sortBy

          if (sortBy) {
            results.sort(sortBy)
          }

          return results
        }),
        get: (id: any) => recordsById.get(id),
        has: (id: any) => recordsById.has(id),
      }
    : {
        record: computed(() => recordsById.get(singleRecordId)),
      }
}
