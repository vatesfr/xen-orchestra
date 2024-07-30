import type { XoObject, XoObjectContext, XoObjectType, XoObjectTypeToXoObject } from '@/types/xo-object.type'
import { restApiConfig } from '@/utils/rest-api-config.util'
import type { SubscribableStoreConfig } from '@core/types/subscribable-store.type'
import type { VoidFunction } from '@core/types/utility.type'
import { noop, useFetch, useIntervalFn } from '@vueuse/core'
import { computed, readonly, ref, shallowReactive } from 'vue'

export function createXoStoreConfig<
  TType extends XoObjectType,
  TXoObjectInput extends XoObjectTypeToXoObject<TType>,
  TBeforeAdd extends ((input: TXoObjectInput) => undefined | XoObject) | undefined = (
    input: TXoObjectInput
  ) => TXoObjectInput,
  TXoObject extends XoObject = TBeforeAdd extends (input: TXoObjectInput) => any
    ? NonNullable<ReturnType<TBeforeAdd>>
    : TXoObjectInput,
>(
  type: TType,
  options?: {
    sortBy?: (a: TXoObject, b: TXoObject) => number
    beforeAdd?: TBeforeAdd
    pollInterval?: number
  }
): SubscribableStoreConfig<XoObjectContext<TXoObject>> {
  const recordsById = shallowReactive(new Map<TXoObject['id'], TXoObject>())
  const records = computed(() => {
    const results = Array.from(recordsById.values())

    if (options?.sortBy) {
      results.sort(options.sortBy)
    }

    return results
  })

  const get = (id: TXoObject['id']) => recordsById.get(id)

  const has = (id: TXoObject['id']) => recordsById.has(id)

  const isReady = ref(false)

  const urlParams = new URLSearchParams(`fields=${restApiConfig[type].fields}`)

  const { isFetching, error, execute, canAbort, abort, data } = useFetch(
    `/rest/v0/${restApiConfig[type].path}?${urlParams.toString()}`,
    {
      immediate: false,
      beforeFetch({ options }) {
        options.credentials = 'include'

        return { options }
      },
    }
  )
    .get()
    .json<TXoObjectInput[]>()

  const hasError = computed(() => !!error.value)

  const handleRecordAdded = (record: TXoObjectInput) => {
    const recordToAdd = options?.beforeAdd ? options.beforeAdd(record) : record

    if (recordToAdd === undefined) {
      return
    }

    recordsById.set(record.id, recordToAdd as TXoObject)
  }

  const handleRecordsLoaded = (records: TXoObjectInput[] | null) => {
    recordsById.clear()

    if (!records) {
      return
    }

    records.forEach(record => handleRecordAdded(record))
    isReady.value = true
  }

  const loadData = async () => {
    await execute()

    handleRecordsLoaded(data.value)
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

  const context = {
    records,
    get,
    has,
    isFetching: readonly(isFetching),
    isReady: readonly(isReady),
    lastError: readonly(error),
    hasError,
  } as XoObjectContext<TXoObject>

  return {
    context,
    onSubscribe,
    onUnsubscribe,
    isEnabled: true,
  }
}
