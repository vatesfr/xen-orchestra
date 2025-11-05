import { createLogger } from '@xen-orchestra/log'
import type { Response } from 'express'

import type { Listener } from '../abstract-classes/listener.mjs'
import { PingListener, Subscriber, SubscriberManager, XapiXoListener } from './event.class.mjs'
import type { ListenerType, SubscriberId } from './event.type.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

const log = createLogger('xo:rest-api:event-service')

export class EventService {
  #alarmService: AlarmService
  #restApi: RestApi
  #listeners: Map<string, Listener> = new Map()
  #subscriberManager = new SubscriberManager()

  constructor(restApi: RestApi) {
    process.on('SIGTERM', () => {
      log.debug(`SIGTERM received, close all SSE subscribers (nb: ${this.#subscriberManager.subscribers.size})`)
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
        const isAlarm = type === 'alarm'
        // alarm is purely XO-related; it doesn't exist at the XAPI level.
        // alarm is a message with parsed values. So, in the case of an alarm listener, it listens for message collection.
        const ee = this.#restApi.xoApp.objects.allIndexes.type.getEventEmitterByType(isAlarm ? 'message' : type)
        this.#listeners.set(type, new XapiXoListener(type, ee, isAlarm ? this.#alarmService : undefined))
      }
    }

    return this.#listeners.get(type)!
  }

  createSseSubscriber(res: Response): SubscriberId {
    const subscriber = new Subscriber(res, this.#subscriberManager)
    subscriber.broadcast('init', { id: subscriber.id })

    this.addListenerFor(subscriber.id, { type: 'ping' })

    log.debug(`new SSE subscriber added: ${subscriber.id}`)
    log.debug(`nb subscriber: ${this.#subscriberManager.subscribers.size}`)

    return subscriber.id
  }

  addListenerFor(id: SubscriberId, { fields, type }: { fields?: '*' | string[]; type: ListenerType }) {
    const subscriber = this.#subscriberManager.getSubscriber(id)
    const listener = this.#getListener(type)

    listener.addSubscriber(subscriber, fields)
  }

  removeListenerFor(id: SubscriberId, type: ListenerType): void {
    const subscriber = this.#subscriberManager.getSubscriber(id)
    const listener = this.#getListener(type)

    listener.removeSubscriber(subscriber.id)
  }
}
