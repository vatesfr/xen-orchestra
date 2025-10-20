import { createLogger } from '@xen-orchestra/log'
import type { Response } from 'express'

import type { Listener } from '../abstract-classes/listener.mjs'
import { PingListener, Subscriber, SubscriberManager } from './event.class.mjs'
import type { ListenerType, SubscriberId } from './event.type.mjs'

const log = createLogger('xo:rest-api:event-service')

export class EventService {
  #listeners: Map<string, Listener> = new Map()
  #subscriberManager = new SubscriberManager()

  constructor() {
    process.on('SIGTERM', () => {
      log.debug(`SIGTERM received, close all SSE subscriber (nb: ${this.#subscriberManager.subscribers.size})`)
      this.#subscriberManager.clear()
      this.#listeners.forEach(l => l.clear())
      this.#listeners.clear()
    })
  }

  #getListener(type: ListenerType): Listener {
    if (!this.#listeners.has(type)) {
      this.#listeners.set(type, new PingListener())
    }

    return this.#listeners.get(type)!
  }

  createSseSubscriber(res: Response): SubscriberId {
    const subscriber = new Subscriber(res, this.#subscriberManager)
    subscriber.broadcast('init', { id: subscriber.id })

    const pingListener = this.#getListener('ping')
    pingListener.addSubscriber(subscriber)

    log.debug(`new SSE subscriber added: ${subscriber.id}`)
    log.debug(`nb subscriber: ${this.#subscriberManager.subscribers.size}`)

    return subscriber.id
  }
}
