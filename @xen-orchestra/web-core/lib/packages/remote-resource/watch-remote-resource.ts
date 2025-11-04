import type { XapiXoRecord } from '@vates/types/'
import { useEventSource } from '@vueuse/core'
import { ref, watch, watchEffect } from 'vue'

type EventFn = (object: XapiXoRecord) => void

const sse = ref<{ id?: string; isWatching: boolean }>({ isWatching: false, id: undefined })
const configByType: Map<
  XapiXoRecord['type'],
  {
    events: {
      add: EventFn
      update: EventFn
      remove: EventFn
    }
    subscriptionId: string
  }
> = new Map()

export function watchRemoteResource<TResourceType extends XapiXoRecord['type']>(
  resource?: TResourceType,
  fields?: (keyof Extract<XapiXoRecord, { type: TResourceType }>)[]
) {
  function initializeWatcher() {
    return new Promise((resolve, reject) => {
      if (sse.value.id !== undefined) {
        return reject(new Error('SSE already initialized'))
      }

      watch(
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
        const { data, event } = useEventSource('/rest/v0/events', ['init', 'add', 'update', 'remove'], {
          serializer: {
            read: raw => (raw === undefined ? undefined : JSON.parse(raw)),
          },
        })

        watchEffect(() => {
          switch (event.value) {
            case 'init':
              sse.value.id = data.value.id
              break
            case 'add':
              configByType.get(data.value.type)?.events.add(data.value)
              break
            case 'update':
              configByType.get(data.value.type)?.events.update(data.value)
              break
            case 'remove':
              configByType.get(data.value.type)?.events.remove(data.value)
              break
          }
        })
      }
    })
  }

  async function start(functions: { onDataReceived: EventFn; onDataRemoved: EventFn }) {
    if (resource === undefined) {
      throw new Error('Resource is missing')
    }
    if (configByType.has(resource)) {
      throw new Error('Resource already watched')
    }

    if (sse.value.id === undefined) {
      await initializeWatcher()
    }

    if (fields !== undefined) {
      // the type property is necessary in order to dispatch received event into the good collection
      if (fields.find(f => f === 'type') === undefined) {
        fields.push('type')
      }
    }

    const resp = await fetch(`/rest/v0/events/${sse.value.id}/subscriptions`, {
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

    configByType.set(resource, {
      subscriptionId: json.id,
      events: {
        add: functions.onDataReceived,
        update: functions.onDataReceived,
        remove: functions.onDataRemoved,
      },
    })
  }

  async function stop() {
    if (sse.value.id === undefined || resource === undefined || !configByType.has(resource)) {
      return
    }

    const resp = await fetch(
      `/rest/v0/events/${sse.value.id}/subscriptions/${configByType.get(resource)!.subscriptionId}`,
      { method: 'DELETE' }
    )
    if (!resp.ok) {
      throw new Error(
        `cannot remove subscription: ${configByType.get(resource)!.subscriptionId} status: ${resp.status}, text: ${resp.statusText}`
      )
    }

    configByType.delete(resource)
  }

  return {
    start,
    stop,
  }
}
