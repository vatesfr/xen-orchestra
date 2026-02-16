import { useNow } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch as watchVue } from 'vue'

type EventFn = (object: unknown) => void
export type THandlePost = (sseId: string) => Promise<string>
export type THandleDelete = (sseId: string, subscriptionId: string) => Promise<void>
export type THandleWatching = (
  updateSseId: (id: string) => void,
  getConfigByResource: (resource: string) =>
    | {
        subscriptionId: string
        configs: Record<
          string,
          {
            add: (object: unknown) => void
            update: (object: unknown) => void
            remove: (object: unknown) => void
          }
        >
      }
    | undefined
) => void

export const useSseStore = defineStore('sse', () => {
  const sse = ref<{ id?: string; isWatching: boolean; lastPing?: number; errorSse?: unknown | null }>({
    isWatching: false,
    errorSse: null,
  })
  const configsByResource: Map<
    string,
    {
      subscriptionId: string
      configs: Record<
        string,
        {
          add: EventFn
          update: EventFn
          remove: EventFn
        }
      >
    }
  > = new Map()

  const now = useNow({ interval: 1000 })

  const isError = computed(() => {
    if (!sse.value.lastPing) {
      return false
    }

    return now.value.getTime() - sse.value.lastPing > 32_000
  })

  const lastPing = computed(() => sse.value.lastPing)
  const hasErrorSse = computed(() => isError.value || sse.value.errorSse !== null)

  function setErrorSse(error: unknown | null) {
    sse.value.errorSse = error
  }

  function updateSseId(id: string) {
    sse.value.id = id
  }

  function setPing(timestamp: number) {
    sse.value.lastPing = timestamp
  }

  function getConfigsByResource(resource: string) {
    return configsByResource.get(resource)
  }

  function initializeWatcher(handleWatching: THandleWatching) {
    return new Promise((resolve, reject) => {
      if (sse.value.id !== undefined) {
        return reject(new Error('SSE already initialized'))
      }

      watchVue(
        sse,
        value => {
          if (value.id !== undefined) {
            resolve(undefined)
          }
        },
        { deep: true }
      )

      if (!sse.value.isWatching) {
        sse.value.isWatching = true
        handleWatching(updateSseId, getConfigsByResource)
      }
    })
  }

  async function watch({
    collectionId,
    resource,
    onDataReceived,
    onDataRemoved,
    handlePost,
    handleWatching,
  }: {
    collectionId: string
    resource: string
    onDataReceived: EventFn
    onDataRemoved: EventFn
    handlePost: THandlePost
    handleWatching: THandleWatching
  }) {
    if (sse.value.id === undefined) {
      await initializeWatcher(handleWatching)
    }

    const id = await handlePost(sse.value.id!)

    const { subscriptionId, configs } = configsByResource.get(resource) ?? {}

    if (subscriptionId !== undefined && id !== subscriptionId) {
      throw new Error(`Previous subscription ID: ${subscriptionId} and new one: ${id} are not the same`)
    }

    configsByResource.set(resource, {
      subscriptionId: id,
      configs: {
        ...configs,
        [collectionId]: {
          add: onDataReceived,
          update: onDataReceived,
          remove: onDataRemoved,
        },
      },
    })
  }

  async function unwatch({
    collectionId,
    resource,
    handleDelete,
  }: {
    collectionId: string
    resource: string
    handleDelete: THandleDelete
  }) {
    if (sse.value.id === undefined || !configsByResource.has(resource)) {
      return
    }

    const { configs, subscriptionId } = configsByResource.get(resource)!
    delete configs[collectionId]

    if (Object.keys(configs).length === 0) {
      await handleDelete(sse.value.id, subscriptionId)
      configsByResource.delete(resource)
    } else {
      configsByResource.set(resource, {
        subscriptionId,
        configs,
      })
    }
  }
  // TODO need to be improve
  function retry() {
    window.location.reload()
  }

  return { watch, unwatch, retry, isError, lastPing, hasErrorSse, setErrorSse, setPing }
})
