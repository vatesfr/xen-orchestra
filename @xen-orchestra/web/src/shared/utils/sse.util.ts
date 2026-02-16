import type { THandleDelete, THandlePost, THandleWatching } from '@core/packages/remote-resource/sse.store.ts'
import type { ResourceContext } from '@core/packages/remote-resource/types.ts'
import type { XoRecord } from '@vates/types'
import { useEventSource } from '@vueuse/core'
import { watch, watchEffect } from 'vue'

const EVENT_ENDPOINTS = '/rest/v0/events'

// TODO: move into a composable
// https://github.com/vatesfr/xen-orchestra/pull/9183#discussion_r2561650429
export function watchCollectionWrapper<T extends Partial<XoRecord>>({
  resource,
  fields,
  collectionId = resource,
  getIdentifier,
  getType,
  handleDelete,
  handlePost,
  handleWatching,
  predicate,
}: {
  resource: string
  fields?: readonly string[]
  collectionId?: string
  getIdentifier?: (obj: unknown) => string
  getType?: (obj: unknown) => string
  handleDelete?: THandleDelete
  handlePost?: THandlePost
  handleWatching?: THandleWatching
  predicate?: (receivedObj: T | T[], context: ResourceContext<any[]> | undefined) => boolean
}) {
  const _getType: (obj: unknown) => string | undefined = getType ?? ((obj: any) => obj.$subscription)
  const _getIdentifier: (obj: unknown) => string | undefined = getIdentifier ?? ((obj: any) => obj.id)

  if (handleDelete === undefined) {
    handleDelete = async (sseId, subscriptionId) => {
      const resp = await fetch(`${EVENT_ENDPOINTS}/${sseId}/subscriptions/${subscriptionId}`, { method: 'DELETE' })
      if (!resp.ok) {
        throw new Error(
          `cannot remove subscription: ${subscriptionId} status: ${resp.status}, text: ${resp.statusText}`
        )
      }
    }
  }

  if (handlePost === undefined) {
    handlePost = async sseId => {
      const resp = await fetch(`${EVENT_ENDPOINTS}/${sseId}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection: resource,
          fields,
        }),
      })
      if (!resp.ok) {
        throw new Error(`cannot start subscription: status: ${resp.status}, text: ${resp.statusText}`)
      }
      const json = await resp.json()
      return json.id
    }
  }

  if (handleWatching === undefined) {
    handleWatching = (updateSseId, getConfigByResource) => {
      const { data, event, close, error } = useEventSource(EVENT_ENDPOINTS, ['init', 'add', 'update', 'remove'], {
        serializer: {
          read: raw => (raw === undefined ? undefined : JSON.parse(raw)),
        },
      })

      watch(error, value => {
        if (value !== null) {
          // If an error occurs, manually close the SSE on the front side; otherwise,
          // the browser will automatically retry(and then generate a new identifier for subscriptions).
          console.error('Close the SSE connection due to an error', value)
          close()
        }
      })

      function getObjectType(obj: unknown) {
        const type = _getType(obj)
        if (type === undefined) {
          throw new Error(`Cannot found the type of the object: ${JSON.stringify(data.value)}`)
        }

        return type
      }

      watchEffect(() => {
        switch (event.value) {
          case 'init':
            updateSseId(data.value.id)
            break
          case 'add':
            Object.values(getConfigByResource(getObjectType(data.value))?.configs ?? {}).forEach(config =>
              config.add(data.value)
            )
            break
          case 'update':
            Object.values(getConfigByResource(getObjectType(data.value))?.configs ?? {}).forEach(config =>
              config.update(data.value)
            )
            break
          case 'remove':
            Object.values(getConfigByResource(getObjectType(data.value))?.configs ?? {}).forEach(config =>
              config.remove(data.value)
            )
            break
        }
      })
    }
  }

  return {
    resource,
    collectionId,
    getIdentifier: (obj: unknown) => {
      const identifier = _getIdentifier(obj)
      if (identifier === undefined) {
        throw new Error(`Cannot found the identifier of the object: ${JSON.stringify(obj)}`)
      }

      return identifier
    },
    handleDelete,
    handlePost,
    handleWatching,
    predicate,
  }
}
