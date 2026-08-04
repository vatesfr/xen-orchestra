import { createLogger } from '@xen-orchestra/log'
import { PassThrough, pipeline } from 'node:stream'
import type { EventEmitter } from 'node:events'
import type { Response } from 'express'

import type { Listener } from '../abstract-classes/listener.mjs'
import { PingListener, Subscriber, SubscriberManager, XoListener } from './event.class.mjs'
import type { ListenerType, SubscriberId, XoListenerType } from './event.type.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { XAPI_TYPES, type XapiXoRecord } from '@vates/types'
import { UserService } from '../users/user.service.mjs'

const log = createLogger('xo:rest-api:event-service')

export class EventService {
  #alarmService: AlarmService
  #userService: UserService
  #restApi: RestApi
  #listeners: Map<string, Listener | Listener<XoListenerType>> = new Map()
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
    this.#userService = restApi.ioc.get(UserService)
  }

  #getListener<Type extends ListenerType>(type: Type): Listener | Listener<XoListenerType> {
    if (this.#listeners.has(type)) {
      return this.#listeners.get(type)!
    }

    let listener: Listener<XoListenerType> | Listener
    if (type === 'ping') {
      listener = new PingListener()
    } else {
      const isMessage = type === 'alarm' || type === 'message'

      let eventEmitter: EventEmitter
      if (type === 'task') {
        eventEmitter = this.#restApi.xoApp.tasks
      } else if ((XAPI_TYPES as readonly string[]).includes(isMessage ? 'message' : type)) {
        // `as` required, because type is typed as string. but XAPI_TYPES.includes only accept `XapiXoRecord['type']` string.
        // that make no sense as here, we want to known if the string is a XAPI type
        // alarm is purely XO-related; it doesn't exist at the XAPI level.
        // alarm is a message with parsed values. So, in the case of an alarm listener, it listens for message collection.
        eventEmitter = this.#restApi.xoApp.objects.allIndexes.type.getEventEmitterByType(
          isMessage ? 'message' : (type as XapiXoRecord['type'])
        )
      } else {
        eventEmitter = this.#restApi.xoApp.getXoEventEmitterByType(type)
      }

      listener = new XoListener(type, eventEmitter, {
        alarmService: isMessage ? this.#alarmService : undefined,
        userService: type === 'user' ? this.#userService : undefined,
      })
    }

    this.#listeners.set(type, listener)
    return listener
  }

  createSseSubscriber(res: Response): SubscriberId {
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    })
    res.setHeaders(headers)

    const maxRam = this.#restApi.xoApp.config.get<number>('rest-api.maxRamAllocatedPerSseClient')
    const connection = new PassThrough({
      highWaterMark: Math.round(1024 * 1024 * maxRam),
    })
    pipeline(connection, res, error => {
      if (error?.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
        log.error(error)
      }
    })

    const user = this.#restApi.getCurrentUser()
    const subscriber = new Subscriber(connection, this.#subscriberManager, user.id)
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
