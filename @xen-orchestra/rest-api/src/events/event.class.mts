import { createLogger } from '@xen-orchestra/log'
import type { Response } from 'express'
import { EventEmitter } from 'node:events'

import { Listener } from '../abstract-classes/listener.mjs'
import { ApiError } from '../helpers/error.helper.mjs'
import type { EventType, SubscriberId } from './event.type.mjs'

const log = createLogger('xo:rest-api:event-service')

export class Subscriber {
  #id: SubscriberId
  #manager: SubscriberManager
  #connection: Response
  #isAlive: boolean

  get id() {
    return this.#id
  }

  get isAlive() {
    return this.#isAlive
  }

  get connection() {
    return this.#connection
  }

  constructor(res: Response, manager: SubscriberManager) {
    this.#id = crypto.randomUUID() as SubscriberId

    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    })
    res.setHeaders(headers)
    res.on('close', () => this.clear())

    manager.addSubscriber(this)

    this.#connection = res
    this.#manager = manager
    this.#isAlive = true
  }

  broadcast(event: EventType, data: object) {
    if (!this.#isAlive) {
      log.warn('broadcast called on a subscriber that is not alive, but still in memory! Force clear and do nothing')
      this.clear()
      return
    }
    this.#connection.write(`event:${event}\n`)
    this.#connection.write(`data:${JSON.stringify(data)}\n\n`)
  }

  clear() {
    this.#isAlive = false
    this.#manager.removeSubscriber(this.id)
  }
}
export class PingListener extends Listener {
  #intervalId: NodeJS.Timeout
  constructor() {
    super(new EventEmitter(), ['ping'])

    this.#intervalId = setInterval(() => {
      this.eventEmitter.emit('ping')
    }, 1000 * 30)
  }

  handleData(): { ping: number } {
    return { ping: Date.now() }
  }

  clear(): void {
    clearInterval(this.#intervalId)
    super.clear()
  }
}

export class SubscriberManager {
  #subscribers: Map<string, Subscriber> = new Map()

  get subscribers() {
    return this.#subscribers
  }

  getSubscriber(id: SubscriberId) {
    const subscriber = this.#subscribers.get(id)
    if (subscriber === undefined) {
      throw new ApiError(`no SSE subscriber for ID: ${id}`, 404)
    }

    return subscriber
  }

  addSubscriber(subscriber: Subscriber) {
    this.#subscribers.set(subscriber.id, subscriber)
  }

  removeSubscriber(id: string) {
    this.#subscribers.delete(id)
  }

  clear() {
    this.#subscribers.forEach(subscriber => {
      if (!subscriber.connection.closed) {
        subscriber.connection.destroy()
      }
      this.#subscribers.delete(subscriber.id)
    })
  }
}
