import type { XoObject, XoObjectContext, XoObjectType, XoObjectTypeToXoObject } from '@/types/xo-object.type'
import { restApiConfig } from '@/utils/rest-api-config.util'
import type { SubscribableStoreConfig } from '@core/types/subscribable-store.type'
import { useFetch } from '@vueuse/core'
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
  }
): SubscribableStoreConfig<XoObjectContext<TXoObject>> {
  const recordsById = shallowReactive(new Map<TXoObject['id'], TXoObject>())
  const records = computed(() => {
    const results = Array.from(recordsById.values())

    if (options?.sortBy) {
      return results.sort(options.sortBy)
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

  const hasError = computed(() => error.value !== undefined)

  const handleAdd = (record: TXoObjectInput) => {
    const recordToAdd = options?.beforeAdd ? options.beforeAdd(record) : record

    if (recordToAdd === undefined) {
      return
    }

    recordsById.set(record.id, recordToAdd as TXoObject)
  }

  const handleAfterLoad = (records: TXoObjectInput[]) => {
    records.forEach(record => handleAdd(record))
    isReady.value = true
  }

  const onSubscribe = async () => {
    await execute()

    if (data.value) {
      handleAfterLoad(data.value)
    }
  }

  const onUnsubscribe = () => {
    if (canAbort.value) {
      abort()
    }

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
