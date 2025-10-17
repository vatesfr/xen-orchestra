import { XapiXoRecord } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import type { Response } from 'express'

import { ApiError } from '../helpers/error.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { Listener } from '../abstract-classes/listener.mjs'
import { PingListener, Subscriber, SubscriberManager, XapiXoListener } from './event.class.mjs'
import { SubscriberId } from './event.type.mjs'

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
      this.#listeners.forEach(l => l.destroy())
      this.#listeners.clear()
    })

    this.#restApi = restApi
    this.#alarmService = restApi.ioc.get(AlarmService)
  }

  #getListener(collection: XapiXoRecord['type'] | 'alarm' | 'ping'): Listener {
    if (!this.#listeners.has(collection)) {
      if (collection === 'ping') {
        this.#listeners.set(collection, new PingListener())
      } else {
        const ee = this.#restApi.xoApp.objects.allIndexes.type.getEventEmitterByType(
          collection === 'alarm' ? 'message' : collection
        )
        if (ee === undefined) {
          throw new ApiError(`no Event Emitter found for collection: ${collection}`, 404)
        }
        this.#listeners.set(collection, new XapiXoListener(collection, ee, this.#alarmService))
      }
    }

    return this.#listeners.get(collection)!
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

  addXapiXoListenerFor(
    id: SubscriberId,
    { fields, collection }: { fields?: string; collection: XapiXoRecord['type'] | 'alarm' }
  ) {
    const subscriber = this.#subscriberManager.getSubscriber(id)
    const listener = this.#getListener(collection)

    listener.addSubscriber(subscriber, fields)
  }

  removeListenerFor(id: SubscriberId, collection: XapiXoRecord['type'] | 'alarm'): void {
    const subscriber = this.#subscriberManager.getSubscriber(id)
    const listener = this.#getListener(collection)

    listener.removeSubscriber(subscriber.id)
  }
}
