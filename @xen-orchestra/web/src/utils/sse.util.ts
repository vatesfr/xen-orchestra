import { useEventSource } from '@vueuse/core'
import { watchEffect } from 'vue'

const EVENT_ENDPOINTS = '/rest/v0/events'

export function watchCollectionWrapper({
  resource,
  fields,
  getIdentifier,
  getType,
  handleDelete,
  handlePost,
  handleWatching,
}: {
  resource: string
  fields?: string[]
  getIdentifier?: (obj: unknown) => string
  getType?: (obj: unknown) => string
  handleDelete?: (sseId: string, subscriptionId: string) => Promise<void>
  handlePost?: (sseId: string) => Promise<any>
  handleWatching?: (
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
}) {
  const _getType: (obj: unknown) => string | undefined = getType ?? ((obj: any) => obj.type)
  const _getIdentifier: (obj: unknown) => string | undefined = getIdentifier ?? ((obj: any) => obj.id)

  if (handleDelete === undefined) {
    handleDelete = async (sseId: string, subscriptionId: string) => {
      const resp = await fetch(`${EVENT_ENDPOINTS}/${sseId}/subscriptions/${subscriptionId}`, { method: 'DELETE' })
      if (!resp.ok) {
        throw new Error(
          `cannot remove subscription: ${subscriptionId} status: ${resp.status}, text: ${resp.statusText}`
        )
      }
    }
  }

  if (handlePost === undefined) {
    handlePost = async (sseId: string) => {
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
      return json
    }
  }

  if (handleWatching === undefined) {
    handleWatching = (
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
    ) => {
      const { data, event } = useEventSource(EVENT_ENDPOINTS, ['init', 'add', 'update', 'remove'], {
        serializer: {
          read: raw => (raw === undefined ? undefined : JSON.parse(raw)),
        },
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
            getConfigByResource(getObjectType(data.value))?.events.add(data.value)
            break
          case 'update':
            getConfigByResource(getObjectType(data.value))?.events.update(data.value)
            break
          case 'remove':
            getConfigByResource(getObjectType(data.value))?.events.remove(data.value)
            break
        }
      })
    }
  }

  return {
    resource,
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
  }
}
