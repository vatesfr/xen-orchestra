import {
  useSseStore,
  type THandleDelete,
  type THandlePost,
  type THandleWatching,
} from '@core/packages/remote-resource/sse.store'
import type { ResourceContext, UseRemoteResource } from '@core/packages/remote-resource/types.ts'
import type { VoidFunction } from '@core/types/utility.type.ts'
import { ifElse } from '@core/utils/if-else.utils.ts'
import { type MaybeRef, noop, useTimeoutPoll } from '@vueuse/core'
import { merge, remove } from 'lodash-es'
import readNDJSONStream from 'ndjson-readablestream'
import {
  computed,
  type ComputedRef,
  type EffectScope,
  getCurrentScope,
  type MaybeRefOrGetter,
  onScopeDispose,
  reactive,
  type Ref,
  ref,
  toRef,
  toValue,
  watch,
} from 'vue'

const DEFAULT_CACHE_EXPIRATION_MS = 10_000

const DEFAULT_POLLING_INTERVAL_MS = 30_000

export function defineRemoteResource<
  TData,
  TState extends object = { data: Ref<TData> },
  TArgs extends any[] = [],
>(config: {
  url: string | ((...args: TArgs) => string)
  initialData: () => TData
  state?: (data: Ref<NoInfer<TData>>, context: ResourceContext<TArgs>) => TState
  onDataReceived?: (data: Ref<NoInfer<TData>>, receivedData: any) => void
  cacheExpirationMs?: number | false
  pollingIntervalMs?: number | false
  stream?: boolean
}): UseRemoteResource<TState, TArgs>

export function defineRemoteResource<TData, TState extends object, TArgs extends any[] = []>(config: {
  url: string | ((...args: TArgs) => string)
  state?: (data: Ref<TData | undefined>, context: ResourceContext<TArgs>) => TState
  onDataReceived?: (data: Ref<TData | undefined>, receivedData: any) => void
  cacheExpirationMs?: number | false
  pollingIntervalMs?: number | false
  stream?: boolean
}): UseRemoteResource<TState, TArgs>

export function defineRemoteResource<
  TData,
  TState extends object = { data: Ref<TData> },
  TArgs extends any[] = [],
>(config: {
  url: string | ((...args: TArgs) => string)
  initialData: () => TData
  state?: (data: Ref<NoInfer<TData>>, context: ResourceContext<TArgs>) => TState
  onDataReceived?: (data: Ref<NoInfer<TData>>, receivedData: any) => void
  onDataRemoved?: (data: Ref<NoInfer<TData>>, receivedData: any) => void
  stream?: boolean
  watchCollection: {
    resource: string // reactivity only on XAPI XO record for now
    getIdentifier: (obj: unknown) => string
    handleDelete: THandleDelete
    handlePost: THandlePost
    handleWatching: THandleWatching
  }
}): UseRemoteResource<TState, TArgs>

export function defineRemoteResource<
  TData,
  TState extends object = { data: Ref<TData> },
  TArgs extends any[] = [],
>(config: {
  url: string | ((...args: TArgs) => string)
  initialData?: () => TData
  state?: (data: Ref<TData>, context: ResourceContext<TArgs>) => TState
  onDataReceived?: (data: Ref<NoInfer<TData>>, receivedData: any) => void
  onDataRemoved?: (data: Ref<NoInfer<TData>>, receivedData: any) => void
  cacheExpirationMs?: number | false
  pollingIntervalMs?: number | false
  stream?: boolean
  watchCollection?: {
    resource: string // reactivity only on XAPI XO record for now
    getIdentifier: (obj: unknown) => string
    handleDelete: THandleDelete
    handlePost: THandlePost
    handleWatching: THandleWatching
  }
}) {
  const cache = new Map<
    string,
    {
      count: number
      pause: VoidFunction
      resume: VoidFunction
      state: object
      isReady: Ref<boolean>
      isFetching: Ref<boolean>
      lastError: Ref<Error | undefined>
      hasError: ComputedRef<boolean>
    }
  >()

  const buildUrl = typeof config.url === 'string' ? () => config.url as string : config.url

  const buildData = config.initialData ?? (() => undefined as TData | undefined)

  const buildState = config.state ?? ((data: Ref<TData>) => ({ data }))

  const cacheExpiration = config.
  
  
  ?? DEFAULT_CACHE_EXPIRATION_MS

  const pollingInterval = config.pollingIntervalMs ?? DEFAULT_POLLING_INTERVAL_MS

  const removeData = (data: TData[], dataToRemove: any) => {
    const getIdentifier = config.watchCollection?.getIdentifier ?? JSON.stringify

    remove(data, item => {
      if (typeof item === 'object') {
        return getIdentifier(item) === getIdentifier(dataToRemove)
      }

      return item === dataToRemove
    })
  }

  const onDataReceived =
    config.onDataReceived ??
    ((data: Ref<TData>, receivedData: any) => {
      if (data.value === undefined || (Array.isArray(data.value) && Array.isArray(receivedData))) {
        data.value = receivedData
        return
      }

      if (Array.isArray(data.value)) {
        removeData(data.value, receivedData)
        data.value.push(receivedData)
        return
      }

      merge(data.value, receivedData)
    })

  const onDataRemoved =
    config.onDataRemoved ??
    ((data: Ref<TData>, receivedData: any) => {
      // for now only support `onDataRemoved` when watching XapiXoRecord collection
      if (Array.isArray(data.value) && !Array.isArray(receivedData)) {
        removeData(data.value, receivedData)
        return
      }

      console.warn('onDataRemoved received but unhandled for:', receivedData)
    })

  function subscribeToUrl(url: string) {
    const entry = cache.get(url)

    if (!entry) {
      return
    }

    entry.count += 1

    if (entry.count === 1) {
      entry.resume()
    }
  }

  function unsubscribeFromUrl(url: string) {
    const entry = cache.get(url)

    if (!entry) {
      return
    }

    entry.count -= 1

    if (entry.count > 0) {
      return
    }

    entry.pause()

    if (cacheExpiration !== false) {
      setTimeout(() => {
        cache.delete(url)
      }, cacheExpiration)
    }
  }

  function registerUrl(url: string, context: ResourceContext<TArgs>) {
    if (cache.has(url)) {
      return
    }

    const isReady = ref(false)

    const isFetching = ref(false)

    const lastError = ref<Error>()

    const hasError = computed(() => lastError.value !== undefined)

    const data = ref(buildData()) as Ref<TData>

    async function execute() {
      try {
        isFetching.value = true

        const response = await fetch(url)

        if (!response.ok) {
          lastError.value = Error(`Failed to fetch: ${response.statusText}`)
          return
        }

        if (!response.body) {
          return
        }

        if (config.stream) {
          for await (const event of readNDJSONStream(response.body)) {
            onDataReceived(data, event)
          }
        } else {
          onDataReceived(data, await response.json())
        }

        isReady.value = true
      } catch (error) {
        lastError.value = error instanceof Error ? error : new Error(String(error))
      } finally {
        isFetching.value = false
      }
    }

    let pause: VoidFunction = noop
    let resume: VoidFunction = execute

    if (config.watchCollection !== undefined) {
      const { resource, handleDelete, handlePost, handleWatching } = config.watchCollection
      const { watch, unwatch } = useSseStore()

      pause = () => unwatch({ resource, handleDelete })
      resume = async function () {
        await execute()
        await watch({
          handleWatching,
          handlePost,
          resource,
          onDataReceived: receivedData => onDataReceived(data, receivedData),
          onDataRemoved: receivedData => onDataRemoved(data, receivedData),
        })
      }
    } else if (pollingInterval !== false) {
      const timeoutPoll = useTimeoutPoll(execute, pollingInterval, {
        immediateCallback: true,
        immediate: false,
      })

      pause = timeoutPoll.pause
      resume = timeoutPoll.resume
    }

    const state = buildState(data, context)

    cache.set(url, {
      count: 0,
      pause,
      resume,
      state,
      isReady,
      isFetching,
      lastError,
      hasError,
    })
  }

  function initializeUrl(url: ComputedRef<string>, context: ResourceContext<TArgs>) {
    watch(
      url,
      (toUrl, fromUrl) => {
        registerUrl(toUrl, context)

        if (context.isEnabled.value) {
          subscribeToUrl(toUrl)
        }

        if (fromUrl) {
          unsubscribeFromUrl(fromUrl)
        }
      },
      { immediate: true }
    )
  }

  return function useRemoteResource(
    optionsOrParentContext?: { isEnabled?: MaybeRef<boolean>; scope?: EffectScope },
    ...args: { [K in keyof TArgs]: MaybeRefOrGetter<TArgs[K]> }
  ) {
    const scope = optionsOrParentContext?.scope ?? getCurrentScope()

    if (!scope) {
      throw new Error('No effect scope found. Please provide a scope or use this function within a Vue component.')
    }

    const isEnabled = toRef(optionsOrParentContext?.isEnabled ?? true)

    return scope.run(() => {
      const url = computed(() => buildUrl(...(args.map(arg => toValue(arg)) as TArgs)))

      onScopeDispose(() => {
        unsubscribeFromUrl(url.value)
      })

      const context: ResourceContext<TArgs> = {
        scope,
        args,
        isReady: computed(() => cache.get(url.value)?.isReady.value ?? false),
        isFetching: computed(() => cache.get(url.value)?.isFetching?.value ?? false),
        lastError: computed(() => cache.get(url.value)?.lastError.value),
        hasError: computed(() => cache.get(url.value)?.hasError.value ?? false),
        isEnabled,
        enable: () => {
          isEnabled.value = true
        },
        disable: () => {
          isEnabled.value = false
        },
        forceReload: () => {
          cache.get(url.value)?.pause()
          cache.get(url.value)?.resume()
        },
      }

      initializeUrl(url, context)

      const state = reactive({} as TState)

      ifElse(
        isEnabled,
        () => subscribeToUrl(url.value),
        () => unsubscribeFromUrl(url.value)
      )

      watch(
        url,
        () => {
          Object.assign(state, cache.get(url.value)!.state)
        },
        { immediate: true }
      )

      return {
        ...Object.fromEntries(
          Object.entries(state).map(([key, value]) =>
            typeof value === 'function' ? [key, value] : [key, toRef(state, key as any)]
          )
        ),
        $context: context,
      }
    })!
  }
}
