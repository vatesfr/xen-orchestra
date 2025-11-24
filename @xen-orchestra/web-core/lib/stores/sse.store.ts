import { defineStore } from 'pinia'
import { ref, watch as watchVue } from 'vue'

type EventFn = (object: unknown) => void
export type THandlePost = (sseId: string) => Promise<string>
export type THandleDelete = (sseId: string, subscriptionId: string) => Promise<void>
export type THandleWatching = (
  updateSseId: (id: string) => void,
  getConfigByResource: (resource: string) =>
    | {
        subscriptionId: string
        events: {
          add: (object: unknown) => void
          update: (object: unknown) => void
          remove: (object: unknown) => void
        }
      }
    | undefined
) => void

export const useSseStore = defineStore('sse', () => {
  const sse = ref<{ id?: string; isWatching: boolean }>({ isWatching: false })
  const configByResource: Map<
    string,
    {
      subscriptionId: string
      events: {
        add: EventFn
        update: EventFn
        remove: EventFn
      }
    }
  > = new Map()

  function updateSseId(id: string) {
    sse.value.id = id
  }

  function getConfigByResource(resource: string) {
    return configByResource.get(resource)
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
        handleWatching(updateSseId, getConfigByResource)
      }
    })
  }

  async function watch({
    resource,
    onDataReceived,
    onDataRemoved,
    handlePost,
    handleWatching,
  }: {
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

    configByResource.set(resource, {
      subscriptionId: id,
      events: {
        add: onDataReceived,
        update: onDataReceived,
        remove: onDataRemoved,
      },
    })
  }

  async function unwatch({ resource, handleDelete }: { resource: string; handleDelete: THandleDelete }) {
    if (sse.value.id === undefined || !configByResource.has(resource)) {
      return
    }

    const subscriptionId = configByResource.get(resource)!.subscriptionId
    await handleDelete(sse.value.id, subscriptionId)

    configByResource.delete(resource)
  }

  return { watch, unwatch }
})
