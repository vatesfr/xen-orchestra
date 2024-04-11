import type { ObjectType, ObjectTypeToRecord, XenApiRecord } from '@/libs/xen-api/xen-api.types'
import { ifElse } from '@core/utils/if-else.utils'
import { computed, type ComputedRef, onBeforeUnmount, type Ref, ref, watch } from 'vue'

type SubscribeContext<TRecord extends XenApiRecord<any>> = {
  records: ComputedRef<TRecord[]>
  getByOpaqueRef: (opaqueRef: TRecord['$ref']) => TRecord | undefined
  getByUuid: (uuid: TRecord['uuid']) => TRecord | undefined
}

type Subscriber<TSubscribeContext extends SubscribeContext<any>> = <TDefer extends boolean = false>(options?: {
  defer: TDefer
}) => TSubscribeContext & (TDefer extends true ? { start: () => void } : object)

// type ExtendedSubscriber<TSubscribeContext extends SubscribeContext<any>, TMoreContext extends object> = <
//   TDefer extends boolean = false,
// >(options?: {
//   defer: TDefer
// }) => TSubscribeContext & TMoreContext & (TDefer extends true ? { start: () => void } : object)

type ExtractDependencyContext<TDependencies extends { subscribe: Subscriber<any> }[]> = TDependencies extends [
  { subscribe: Subscriber<infer T> },
  ...infer TRest,
]
  ? TRest extends { subscribe: Subscriber<any> }[]
    ? [T, ...ExtractDependencyContext<TRest>]
    : [T]
  : []

type Extender<
  TSubscribeContext extends SubscribeContext<any>,
  TMoreContext extends object,
  TDependencies extends { subscribe: Subscriber<any> }[] = [],
> = (context: TSubscribeContext, ...depsContexts: ExtractDependencyContext<TDependencies>) => TMoreContext

type Dependencies = { subscribe: Subscriber<any> }[]

/* Overload 1: Simple subscriber */
export function createSubscribe<
  TObjectType extends ObjectType,
  TRecord extends ObjectTypeToRecord<TObjectType>,
  TSubscribeContext extends SubscribeContext<TRecord>,
>(type: TObjectType): Subscriber<TSubscribeContext>

/* Overload 2: Extended subscriber */
export function createSubscribe<
  TObjectType extends ObjectType,
  TRecord extends ObjectTypeToRecord<TObjectType>,
  TSubscribeContext extends SubscribeContext<TRecord>,
  TMoreContext extends object,
>(type: TObjectType, extender: Extender<TSubscribeContext, TMoreContext>): Subscriber<TSubscribeContext & TMoreContext>

/* Overload 3: Extended subscriber with dependencies */
export function createSubscribe<
  TObjectType extends ObjectType,
  TRecord extends ObjectTypeToRecord<TObjectType>,
  TSubscribeContext extends SubscribeContext<TRecord>,
  TMoreContext extends object,
  const TDependencies extends Dependencies,
>(
  type: TObjectType,
  dependsOn: TDependencies,
  extender: Extender<TSubscribeContext, TMoreContext, TDependencies>
): Subscriber<TSubscribeContext & TMoreContext>

/* Implementation */
export function createSubscribe<
  TObjectType extends ObjectType,
  TRecord extends ObjectTypeToRecord<TObjectType>,
  TSubscribeContext extends SubscribeContext<TRecord>,
  TMoreContext extends object,
  TDependencies extends Dependencies,
>(
  type: TObjectType,
  extenderOrDependsOn?: Extender<TSubscribeContext, TMoreContext> | TDependencies,
  extenderOrNone?: Extender<TSubscribeContext, TMoreContext, TDependencies>
) {
  const dependsOn = Array.isArray(extenderOrDependsOn) ? extenderOrDependsOn : []
  const extender = Array.isArray(extenderOrDependsOn) ? extenderOrNone : extenderOrDependsOn

  const subscriptions = ref(new Set<symbol>())
  const hasSubscriptions = computed(() => subscriptions.value.size > 0)
  const recordMap = ref(new Map()) as Ref<Map<string, TRecord>>
  const records = computed(() => Array.from(recordMap.value.values()))
  const getByOpaqueRef = (opaqueRef: TRecord['$ref']) => recordMap.value.get(opaqueRef)
  const getByUuid = (uuid: TRecord['uuid']) => records.value.find(record => record.uuid === uuid)

  watch(
    () => subscriptions.value.size,
    count => {
      // eslint-disable-next-line no-console
      console.log(`%c${type}%c has %c${count}%c subscriptions`, 'color: blue;', '', 'color: green;', '')
    }
  )

  ifElse(
    hasSubscriptions,
    () => {
      // eslint-disable-next-line no-console
      console.log(
        `%c${type}%c has a %cfirst subscription%c. %cEnabling request & polling...`,
        'color: blue;',
        '',
        'color: green;',
        '',
        'color: grey'
      )
    },
    () => {
      // eslint-disable-next-line no-console
      console.log(
        `%c${type}%c has %cno longer subscription%c. %cCancelling current request if any & stopping polling...`,
        'color: blue;',
        '',
        'color: red;',
        '',
        'color: grey'
      )
    }
  )

  const subscribeContext = {
    records,
    getByOpaqueRef,
    getByUuid,
  } as TSubscribeContext

  function subscribe(options?: { defer: boolean }) {
    const id = Symbol(`${type} subscriber`)

    const dependencies = dependsOn.map(dependency => dependency.subscribe({ defer: options?.defer ?? false }))

    const start = () => {
      if (options?.defer) {
        dependencies.forEach(dependency => dependency.start())
      }

      return subscriptions.value.add(id)
    }

    onBeforeUnmount(() => {
      return subscriptions.value.delete(id)
    })

    if (!options?.defer) {
      start()
    }

    if (extender) {
      if (options?.defer) {
        return {
          ...subscribeContext,
          ...extender(subscribeContext, ...(dependencies as ExtractDependencyContext<TDependencies>)),
          start,
        }
      }

      return {
        ...subscribeContext,
        ...extender(subscribeContext, ...(dependencies as ExtractDependencyContext<TDependencies>)),
      }
    }

    if (options?.defer) {
      return { ...subscribeContext, start }
    }

    return subscribeContext
  }

  return subscribe
}
