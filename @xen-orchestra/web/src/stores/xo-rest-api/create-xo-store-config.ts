import type { SubscribableStoreConfig } from '@core/utils/create-subscribable-store-context.util'
import { useFetch } from '@vueuse/core'
import { computed, type ComputedRef, readonly, type Ref, ref, shallowReactive } from 'vue'

declare const __brand: unique symbol

// eslint-disable-next-line no-use-before-define
export type RecordId<Type extends XoObjectType> = string & { [__brand]: `${Type}Id` }

export type Pool = {
  id: RecordId<'pool'>
  type: 'pool'
  $pool: string
  $apiType: 'pools'
  master: string
  name_description: string
  name_label: string
  _xapiRef: string
}

export type Vm = {
  id: RecordId<'VM'>
  type: 'VM'
  $apiType: 'vms'
  $container: RecordId<'host'>
  $pool: string
  _xapiRef: string
  name_label: string
  name_description: string
  power_state: string
  addresses: Record<string, string>
  mainIpAddress: string
}

export type Host = {
  id: RecordId<'host'>
  type: 'host'
  $pool: RecordId<'pool'>
  _xapiRef: string
  address: string
  enabled: boolean
  name_label: string
  name_description: string
  power_state: string
  residentVms: string[]
}

type XoObject = Vm | Host | Pool

type XoObjectType = XoObject['type']

type XoObjectTypeToXoObject<TType extends XoObjectType> = {
  [TObject in XoObject as TObject['type']]: TObject
}[TType]

const XoObjectTypeToApiSlug: Record<XoObjectType, string> = {
  VM: 'vms',
  host: 'hosts',
  pool: 'pools',
}

export type XoObjectContext<TXoObject> = {
  records: ComputedRef<TXoObject[]>
  get: (id: string) => TXoObject | undefined
  has: (id: string) => boolean
  isFetching: Readonly<Ref<boolean>>
  isReady: Readonly<Ref<boolean>>
  lastError: Readonly<Ref<string | undefined>>
  hasError: ComputedRef<boolean>
}

export function createXoStoreConfig<
  TType extends XoObjectType,
  TXoObjectInput extends XoObjectTypeToXoObject<TType>,
  TBeforeAdd extends (input: TXoObjectInput) => undefined | XoObject = (input: TXoObjectInput) => TXoObjectInput,
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

  const fields = computed(() => {
    const fieldsByType = {
      VM: 'id,name_label,power_state,$container',
      host: 'id,name_label,power_state,residentVms,$pool',
      pool: 'id,name_label,master',
    }

    return fieldsByType[type]
  })

  const params = new URLSearchParams(`fields=${fields.value}`)

  const { isFetching, error, execute, canAbort, abort, data } = useFetch(
    `/rest/v0/${XoObjectTypeToApiSlug[type]}?${params}`,
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

  function handleAdd(record: TXoObjectInput) {
    const recordToAdd = options?.beforeAdd ? options.beforeAdd(record) : record

    if (recordToAdd === undefined) {
      return
    }

    recordsById.set(record.id, recordToAdd as TXoObject)
  }

  // const handleRemove = (id: TXoObject['id']) => {
  //   recordsById.delete(id)
  // }

  const handleAfterLoad = (records: TXoObjectInput[]) => {
    records.forEach(record => handleAdd(record))
    isReady.value = true
  }

  const onSubscribe = async () => {
    await execute()

    if (data.value) {
      handleAfterLoad(data.value)
      isReady.value = true
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
    hasError: readonly(hasError),
  } as XoObjectContext<TXoObject>

  return {
    context,
    onSubscribe,
    onUnsubscribe,
    isEnabled: true,
  }
}
