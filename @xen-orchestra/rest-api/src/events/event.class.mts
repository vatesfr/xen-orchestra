import pick from 'lodash/pick.js'
import isEqual from 'lodash/isEqual.js'
import { createLogger } from '@xen-orchestra/log'
import { EventEmitter } from 'node:events'
import { noSuchObject } from 'xo-common/api-errors.js'
import type { PassThrough } from 'node:stream'

import { Listener } from '../abstract-classes/listener.mjs'
import type { CollectionEventType, EventType, SubscriberId, XoListenerType } from './event.type.mjs'
import type { XapiXoRecord, XoAlarm, XoTask } from '@vates/types'
import type { AlarmService } from '../alarms/alarm.service.mjs'

const log = createLogger('xo:rest-api:event-service')

export class Subscriber {
  #id: SubscriberId
  #manager: SubscriberManager
  #connection: PassThrough
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

  constructor(connection: PassThrough, manager: SubscriberManager) {
    this.#id = crypto.randomUUID() as SubscriberId

    connection.on('close', () => this.clear())

    manager.addSubscriber(this)

    this.#connection = connection
    this.#manager = manager
    this.#isAlive = true
  }

  #safeWrite(payload: string) {
    const ok = this.#connection.write(payload)

    if (!ok) {
      log.error(
        `Too much data in queue for the client ${this.id} (${Math.round(this.#connection.writableLength / 1024 / 1024)} MB). The connection is going to be destroyed`
      )
      this.clear()
    }
  }

  broadcast(event: EventType | 'init', data: object) {
    if (!this.#isAlive) {
      log.warn('broadcast called on a subscriber that is not alive, but still in memory! Force clear and do nothing')
      this.clear()
      return
    }

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

    this.#safeWrite(payload)
  }

  clear() {
    this.#isAlive = false
    if (!this.#connection.closed || !this.#connection.destroyed) {
      this.#connection.destroy()
    }
    this.#manager.removeSubscriber(this.id)
  }
}

export class XoListener extends Listener {
  #type: XoListenerType
  #alarmService?: AlarmService

  constructor(type: XoListenerType, eventEmitter: EventEmitter, alarmService?: AlarmService) {
    super(eventEmitter, ['add', 'update', 'remove'])
    this.#type = type
    this.#alarmService = alarmService
  }

  handleData<T extends Exclude<XapiXoRecord, XoAlarm> | XoTask>(
    { fields, event }: { fields: '*' | string[]; subscriber: Subscriber; event: CollectionEventType },
    object: T | undefined,
    previousObj?: T
  ): (Partial<XapiXoRecord | XoTask> & { $subscription: XoListenerType }) | undefined {
    let _object: Partial<XapiXoRecord | XoTask> | undefined = object
    let _prevObject: Partial<XapiXoRecord | XoTask> | undefined = previousObj

    if (this.#type === 'alarm') {
      if (
        object !== undefined &&
        'type' in object &&
        object.type === 'message' &&
        this.#alarmService?.isAlarm(object)
      ) {
        _object = this.#alarmService.parseAlarm(object)
      }
      if (
        previousObj !== undefined &&
        'type' in previousObj &&
        previousObj.type === 'message' &&
        this.#alarmService?.isAlarm(previousObj)
      ) {
        _prevObject = this.#alarmService.parseAlarm(previousObj)
      }
    }

    if (fields !== '*') {
      if (_object !== undefined) {
        _object = pick(_object, fields)
      }
      if (_prevObject !== undefined) {
        _prevObject = pick(_prevObject, fields)
      }
    }

    if (event === 'update' && fields !== '*' && isEqual(_object, _prevObject)) {
      // if no changes from user perspective, don't send update
      return
    }

    // if _object === undefined, this means we are on a remove event, so _prevObject will not be undefined
    return { $subscription: this.#type, ...(_object ?? _prevObject) }
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
      throw noSuchObject(id, 'event')
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
