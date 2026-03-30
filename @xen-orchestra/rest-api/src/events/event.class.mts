import pick from 'lodash/pick.js'
import isEqual from 'lodash/isEqual.js'
import { createLogger } from '@xen-orchestra/log'
import type { Response } from 'express'
import { EventEmitter } from 'node:events'
import { noSuchObject } from 'xo-common/api-errors.js'

import { Listener } from '../abstract-classes/listener.mjs'
import type { CollectionEventType, EventType, SubscriberId, XoListenerType } from './event.type.mjs'
import type { XapiXoRecord, XoAlarm, XoTask, XoUser } from '@vates/types'
import type { AlarmService } from '../alarms/alarm.service.mjs'

const log = createLogger('xo:rest-api:event-service')

export class Subscriber {
  #id: SubscriberId
  #manager: SubscriberManager
  #connection: Response
  #isAlive: boolean
  #userId: XoUser['id']

  get id() {
    return this.#id
  }

  get isAlive() {
    return this.#isAlive
  }

  get connection() {
    return this.#connection
  }

  get userId() {
    return this.#userId
  }

  constructor(res: Response, manager: SubscriberManager, userId: XoUser['id']) {
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
    this.#userId = userId
  }

  broadcast(event: EventType | 'init', data: object) {
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

export class XoListener extends Listener<XoListenerType> {
  #alarmService?: AlarmService

  constructor(type: XoListenerType, eventEmitter: EventEmitter, alarmService?: AlarmService) {
    super(eventEmitter, ['add', 'update', 'remove'], type)
    this.#alarmService = alarmService
  }

  async handleData<T extends Exclude<XapiXoRecord, XoAlarm> | XoTask>(
    { fields, event, subscriber }: { fields: '*' | string[]; subscriber: Subscriber; event: CollectionEventType },
    object: T | undefined,
    previousObj?: T
  ): Promise<
    (Partial<XapiXoRecord | XoTask> & { $subscription: XoListenerType; event: CollectionEventType }) | undefined
  > {
    let _object: Partial<XapiXoRecord | XoTask> | undefined = object
    let _prevObject: Partial<XapiXoRecord | XoTask> | undefined = previousObj

    if (this.type === 'alarm') {
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

    const aclEvent = await this.getAclEvent({
      event,
      object: _object,
      previousObject: _prevObject,
      userId: subscriber.userId,
    })
    // If the user has no 'read' privileges for the changes, don't send the update
    if (aclEvent === undefined) {
      return
    }
    event = aclEvent

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
    return { $subscription: this.type, event, ...(_object ?? _prevObject) }
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

  async handleData(): Promise<{ ping: number }> {
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
