import type { EventEmitter } from 'node:events'
import type { Subscriber } from '../events/event.class.mjs'
import type { EventType } from '../events/event.type.mjs'

export abstract class Listener {
  #subscribers: Map<Subscriber['id'], { fields: '*' | string[]; subscriber: Subscriber }> = new Map()
  #eventEmitter: EventEmitter
  #eventCallbacks: Map<string, (...args: unknown[]) => void> = new Map()
  #watchedEvent: EventType[]

  constructor(eventEmitter: EventEmitter, watchedEvent: EventType[]) {
    this.#eventEmitter = eventEmitter
    this.#watchedEvent = watchedEvent
  }

  get subscribers() {
    return this.#subscribers
  }

  get eventEmitter() {
    return this.#eventEmitter
  }

  addSubscriber(subscriber: Subscriber, fields: '*' | string[] = '*') {
    this.#subscribers.set(subscriber.id, { fields, subscriber })

    if (this.#subscribers.size === 1) {
      this.#watchedEvent.forEach(event => this.#addEventListener(event))
    }
  }

  removeSubscriber(subscriberId: Subscriber['id']) {
    this.#subscribers.delete(subscriberId)

    if (this.#subscribers.size === 0) {
      this.removeAllEventListeners()
    }
  }

  removeAllEventListeners() {
    this.#eventCallbacks.forEach((cb, event) => {
      this.#eventEmitter.off(event, cb)
    })
  }

  clear() {
    this.removeAllEventListeners()
    this.#eventCallbacks.clear()
    this.#subscribers.clear()
    this.#watchedEvent = []
  }

  #addEventListener(event: EventType) {
    if (this.#eventCallbacks.has(event)) {
      return
    }

    const broadcastAllSubscriber = (...args: unknown[]) => {
      this.#subscribers.forEach(conf => {
        if (!conf.subscriber.isAlive) {
          this.removeSubscriber(conf.subscriber.id)
          return
        }

        const data = this.handleData({ ...conf, event }, ...args)
        if (data === undefined) {
          return
        }

        conf.subscriber.broadcast(event, data)
      })
    }
    this.#eventCallbacks.set(event, broadcastAllSubscriber)
    this.#eventEmitter.on(event, broadcastAllSubscriber)
  }

  abstract handleData(
    conf: { fields: '*' | string[]; subscriber: Subscriber; event: EventType },
    ...args: unknown[]
  ): object | undefined
}
