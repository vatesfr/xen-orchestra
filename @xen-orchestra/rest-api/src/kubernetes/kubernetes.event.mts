import { EventEmitter } from 'node:events'
import { KubernetesService } from './kubernetes.service.mjs'
import { createLogger } from '@xen-orchestra/log'
import { createSseParser, SseEvent } from './kubernetes.sse.helper.mjs'
import { Readable } from 'node:stream'
import { setTimeout as delay } from 'node:timers/promises'

const log = createLogger('xo:rest-api:kubernetes-event')

const COLLECTION_EVENTS: readonly string[] = ['add', 'update', 'remove']
const RETRY_MIN = 1000
const RETRY_MAX = 30000
const HEALTHY_CONNECTION = 10000

export class KubernetesEventService {
  #kubernetesService: KubernetesService
  #emitter = new EventEmitter()
  #watchers = new Map<string, { abortController: AbortController; lastKnown: Map<string, object> }>()

  get emitter(): EventEmitter {
    return this.#emitter
  }

  constructor(kubernetesService: KubernetesService) {
    this.#kubernetesService = kubernetesService

    this.#emitter.on('newListener', name => {
      if (typeof name === 'string' && COLLECTION_EVENTS.includes(name) && this.#getListenerCount() === 0) {
        this.#startWatching().catch(error => log.warn('Kubernetes watcher failed to start', { error }))
      }
    })

    this.#emitter.on('removeListener', name => {
      if (typeof name === 'string' && COLLECTION_EVENTS.includes(name) && this.#getListenerCount() === 0) {
        this.#stopWatching()
      }
    })

    process.on('SIGTERM', () => {
      this.#stopWatching()
    })
  }

  async #startWatching(): Promise<void> {
    const clusters = await this.#kubernetesService.listClusters()

    if (Array.isArray(clusters)) {
      for (const cluster of clusters) {
        if (typeof cluster === 'object' && cluster !== null && typeof cluster['id'] === 'string') {
          const abortController = new AbortController()
          this.#watchers.set(cluster.id, { abortController, lastKnown: new Map() })

          this.#watchCluster(cluster.id, abortController).catch(error =>
            log.warn('kubernetes cluster watcher stopped', { id: cluster.id, error })
          )
        } else {
          log.warn('Cluster entry skipped', { cluster })
        }
      }
    }
  }

  #stopWatching(): void {
    for (const { abortController } of this.#watchers.values()) {
      abortController.abort()
    }

    this.#watchers.clear()
  }

  async #watchCluster(clusterId: string, abortController: AbortController) {
    let attempt = 0

    while (!abortController.signal.aborted) {
      let openedAt: number | undefined
      try {
        const path = `api/kubernetes/clusters/${encodeURIComponent(clusterId)}/events`
        const stream = await this.#kubernetesService.openEventStream(path, { signal: abortController.signal })

        openedAt = Date.now()

        const parser = createSseParser()
        for await (const chunk of Readable.fromWeb(stream)) {
          this.#handleEvents(clusterId, parser.push(chunk as Uint8Array))
        }

        this.#handleEvents(clusterId, parser.end())

        log.debug('Stream ended', { clusterId })
      } catch (error) {
        if (!abortController.signal.aborted) {
          log.warn('Kubernetes event stream failed', { clusterId, error })
        }
      }

      if (abortController.signal.aborted) break

      if (openedAt !== undefined && Date.now() - openedAt > HEALTHY_CONNECTION) {
        attempt = 0
      }

      let reconnectionDelay = Math.min(RETRY_MAX, RETRY_MIN * 2 ** attempt)
      reconnectionDelay = reconnectionDelay / 2 + (Math.random() * reconnectionDelay) / 2

      try {
        await delay(reconnectionDelay, undefined, { signal: abortController.signal })
      } catch {
        break
      }

      attempt++
    }
  }

  #handleEvents(clusterId: string, events: SseEvent[]) {
    for (const event of events) {
      if (event.event === 'ping') {
        // Ignore
      } else if (event.event === 'error') {
        log.warn('Event stream returned an error', { data: event.data })
      } else if (event.event === 'init' || COLLECTION_EVENTS.includes(event.event)) {
        if (typeof event.data === 'object' && event.data !== null && typeof event.data['id'] === 'string') {
          const objectId = event.data['id']
          const watcher = this.#watchers.get(clusterId)

          switch (event.event) {
            case 'init':
            case 'add':
              this.#emitter.emit('add', event.data)

              watcher?.lastKnown.set(objectId, event.data)
              break
            case 'update':
              this.#emitter.emit('update', event.data, watcher?.lastKnown.get(objectId))

              watcher?.lastKnown.set(objectId, event.data)
              break
            case 'remove':
              this.#emitter.emit('remove', event.data)

              watcher?.lastKnown.delete(objectId)
              break
          }
        } else {
          log.warn('Event data malformed', { data: event.data })
        }
      }
    }
  }

  #getListenerCount(): number {
    let listenerCount = 0

    for (const event of COLLECTION_EVENTS) {
      listenerCount += this.#emitter.listenerCount(event)
    }

    return listenerCount
  }
}
