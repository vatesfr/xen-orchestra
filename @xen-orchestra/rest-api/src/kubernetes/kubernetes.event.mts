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

const KUBERNETES_COLLECTIONS = ['kubernetes-cluster', 'kubernetes-node'] as const
export type KubernetesCollections = (typeof KUBERNETES_COLLECTIONS)[number]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export class KubernetesEventService {
  #kubernetesService: KubernetesService
  #emitters: Map<KubernetesCollections, EventEmitter>
  #watcher: { abortController: AbortController; lastKnown: Map<KubernetesCollections, Map<string, object>> } | undefined

  constructor(kubernetesService: KubernetesService) {
    this.#kubernetesService = kubernetesService
    this.#emitters = new Map()

    for (const collection of KUBERNETES_COLLECTIONS) {
      const emitter = new EventEmitter()
      this.#emitters.set(collection, emitter)

      emitter.on('newListener', name => {
        if (typeof name === 'string' && COLLECTION_EVENTS.includes(name) && this.#getListenerCount() === 0) {
          this.#startWatching().catch(error => log.warn('Kubernetes watcher failed to start', { error }))
        }
      })

      emitter.on('removeListener', name => {
        if (typeof name === 'string' && COLLECTION_EVENTS.includes(name) && this.#getListenerCount() === 0) {
          this.#stopWatching()
        }
      })
    }

    process.on('SIGTERM', () => {
      this.#stopWatching()
    })
  }

  emitterFor(collection: KubernetesCollections): EventEmitter {
    const emitter = this.#emitters.get(collection)
    if (!emitter) {
      throw new Error(`collection ${collection} has no emitter`)
    }

    return emitter
  }

  async #startWatching(): Promise<void> {
    const abortController = new AbortController()

    const lastKnown = new Map()
    for (const collection of KUBERNETES_COLLECTIONS) lastKnown.set(collection, new Map())

    this.#watcher = { abortController, lastKnown }

    this.#watch(abortController).catch(error => log.warn('CAPI watcher stopped', { error }))
  }

  #stopWatching(): void {
    if (this.#watcher) {
      this.#watcher.abortController.abort()
    }

    this.#watcher = undefined
  }

  async #watch(abortController: AbortController) {
    let attempt = 0
    let firstConnection = true

    while (!abortController.signal.aborted) {
      let openedAt: number | undefined
      try {
        const path = `kubernetes/events`
        const stream = await this.#kubernetesService.openEventStream(path, { signal: abortController.signal })

        openedAt = Date.now()

        try {
          await this.#resync(!firstConnection)
        } catch (error) {
          log.warn('could not resynchronise the kubernetes collections', { error })
        }
        firstConnection = false

        const parser = createSseParser()
        for await (const chunk of Readable.fromWeb(stream)) {
          this.#handleEvents(parser.push(chunk as Uint8Array))
        }

        this.#handleEvents(parser.end())

        log.debug('Stream ended')
      } catch (error) {
        if (!abortController.signal.aborted) {
          log.warn('Kubernetes event stream failed', { error })
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

  #handleEvents(events: SseEvent[]): void {
    for (const event of events) {
      this.#handleEvent(event)
    }
  }

  /**
   * Turns an event of the kubernetes API into an event of the collection it belongs to
   *
   * The name of the event gives both the kind of the object (`cluster.created` -> `cluster`)
   * and what happened to it, and the object itself is nested under a key named after its kind
   */
  #handleEvent({ data, event }: SseEvent): void {
    if (event === 'ping') {
      return
    }

    if (event === 'error') {
      log.warn('the kubernetes API answered an error on the event stream', { data })
      return
    }

    const match = /^(?<payloadKey>[^.]+)\.(?<action>.+)$/.exec(event)
    if (match === null) {
      log.debug('ignoring an event which is not named after an object', { event })
      return
    }

    const { action = '', payloadKey = '' } = match.groups ?? {}

    const collection = this.#getCollectionType(payloadKey)
    if (collection === undefined) {
      log.debug('ignoring an event of an object which is not exposed by XO', { event })
      return
    }

    if (!isRecord(data)) {
      log.warn('ignoring an event whose data is not an object', { data, event })
      return
    }

    const { id } = data
    if (typeof id !== 'string') {
      log.warn('ignoring an event whose object has no identifier', { data, event })
      return
    }

    const emitter = this.emitterFor(collection)

    // the objects are kept to be sent as the previous version of an updated or removed
    // object, which the subscribers' privileges are checked against
    const lastKnowns = this.#watcher?.lastKnown.get(collection)

    // the object of a removed event is not sent by the kubernetes API, only its last
    // known version is available
    if (action === 'deleted') {
      emitter.emit('remove', undefined, lastKnowns?.get(id))
      lastKnowns?.delete(id)
      return
    }

    const object = data[payloadKey]
    if (!isRecord(object)) {
      // e.g. `cluster.kubeconfig.available` only describes a change of context
      log.debug('ignoring an event which does not carry its object', { event })
      return
    }

    if (action === 'created') {
      emitter.emit('add', object)
    } else {
      emitter.emit('update', object, lastKnowns?.get(id))
    }

    lastKnowns?.set(id, object)
  }

  async #resync(emit: boolean) {
    const [clusters, nodes] = await Promise.all([
      this.#kubernetesService.listClusters(),
      this.#kubernetesService.listNodes(),
    ])

    if (Array.isArray(clusters)) {
      this.#resyncCollection(emit, 'kubernetes-cluster', clusters)
    }

    if (Array.isArray(nodes)) {
      this.#resyncCollection(emit, 'kubernetes-node', nodes)
    }
  }

  #resyncCollection(emit: boolean, collection: KubernetesCollections, records: unknown[]) {
    const emitter = this.emitterFor(collection)
    const lastKnowns = this.#watcher?.lastKnown.get(collection)

    for (const record of records) {
      if (isRecord(record) && typeof record['id'] === 'string') {
        const recordId = record.id
        if (emit) {
          if (lastKnowns?.has(recordId)) {
            emitter.emit('update', record, lastKnowns?.get(recordId))
          } else {
            emitter.emit('add', record)
          }
        }

        lastKnowns?.set(record.id, record)
      }
    }

    if (lastKnowns) {
      for (const [id, lastKnown] of lastKnowns) {
        if (!records.find(record => isRecord(record) && record.id === id)) {
          if (emit) emitter.emit('remove', undefined, lastKnown)

          lastKnowns.delete(id)
        }
      }
    }
  }

  #getListenerCount(): number {
    let listenerCount = 0

    for (const emitter of this.#emitters.values()) {
      for (const event of COLLECTION_EVENTS) {
        listenerCount += emitter.listenerCount(event)
      }
    }

    return listenerCount
  }

  #getCollectionType(type: string): KubernetesCollections | undefined {
    switch (type) {
      case 'node':
        return 'kubernetes-node'
      case 'cluster':
        return 'kubernetes-cluster'
    }

    return undefined
  }
}
