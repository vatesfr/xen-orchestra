import type { EventEmitter } from 'node:events'
import type { Subscriber } from '../events/event.class.mjs'

export abstract class Listener {
  #subscribers: Map<Subscriber['id'], Subscriber> = new Map()
  #eventEmitter: EventEmitter
  #eventCallbacks: Map<string, (...args: unknown[]) => void> = new Map()
  #watchedEvent: 'ping'[]

  constructor(eventEmitter: EventEmitter, watchedEvent: 'ping'[]) {
    this.#eventEmitter = eventEmitter
    this.#watchedEvent = watchedEvent
  }

  get subscribers() {
    return this.#subscribers
  }

  get eventEmitter() {
    return this.#eventEmitter
  }

  addSubscriber(subscriber: Subscriber) {
    this.#subscribers.set(subscriber.id, subscriber)

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

  #addEventListener(event: 'ping') {
    if (this.#eventCallbacks.has(event)) {
      return
    }

    const broadcastAllSubscriber = (...args: unknown[]) => {
      this.#subscribers.forEach(subscriber => {
        if (!subscriber.isAlive) {
          this.removeSubscriber(subscriber.id)
          return
        }

        const data = this.handleData({ subscriber, event }, ...args)
        if (data === undefined) {
          return
        }

        subscriber.broadcast(event, data)
      })
    }
    this.#eventCallbacks.set(event, broadcastAllSubscriber)
    this.#eventEmitter.on(event, broadcastAllSubscriber)
  }

  abstract handleData(conf: { subscriber: Subscriber; event: 'ping' }, ...args: unknown[]): object | undefined
}
