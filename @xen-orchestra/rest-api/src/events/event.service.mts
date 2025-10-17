import { createLogger } from '@xen-orchestra/log'
import type { Response } from 'express'

import { RestApi } from '../rest-api/rest-api.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { Listener } from '../abstract-classes/listener.mjs'
import { PingListener, Subscriber, SubscriberManager, XapiXoListener } from './event.class.mjs'
import type { ListenerType, SubscriberId, XapiXoListenerType } from './event.type.mjs'

const log = createLogger('xo:rest-api:event-service')

export class EventService {
  #alarmService: AlarmService
  #restApi: RestApi
  #listeners: Map<string, Listener> = new Map()
  #subscriberManager = new SubscriberManager()

  constructor(restApi: RestApi) {
    process.on('SIGTERM', () => {
      log.debug(`SIGTERM received, close all SSE subscriber (nb: ${this.#subscriberManager.subscribers.size})`)
      this.#subscriberManager.clear()
      this.#listeners.forEach(l => l.clear())
      this.#listeners.clear()
    })

    this.#restApi = restApi
    this.#alarmService = restApi.ioc.get(AlarmService)
  }

  #getListener(type: ListenerType): Listener {
    if (!this.#listeners.has(type)) {
      if (type === 'ping') {
        this.#listeners.set(type, new PingListener())
      } else {
        const ee = this.#restApi.xoApp.objects.allIndexes.type.getEventEmitterByType(
          type === 'alarm' ? 'message' : type
        )
        this.#listeners.set(type, new XapiXoListener(type, ee, this.#alarmService))
      }
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

  addXapiXoListenerFor(id: SubscriberId, { fields, collection }: { fields?: string; collection: XapiXoListenerType }) {
    const subscriber = this.#subscriberManager.getSubscriber(id)
    const listener = this.#getListener(collection)

    listener.addSubscriber(subscriber, fields)
  }

  removeListenerFor(id: SubscriberId, type: XapiXoListenerType): void {
    const subscriber = this.#subscriberManager.getSubscriber(id)
    const listener = this.#getListener(type)

    listener.removeSubscriber(subscriber.id)
  }
}
