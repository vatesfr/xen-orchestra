import { createLogger } from '@xen-orchestra/log'
import type { EventEmitter } from 'node:events'
import { hasPrivilegeOn, SupportedResource } from '@xen-orchestra/acl'
import type { XapiXoRecord, XoUser } from '@vates/types'

import type { CollectionEventType, EventType, XoListenerType } from '../events/event.type.mjs'
import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { Subscriber } from '../events/event.class.mjs'
import { XAPI_TYPE_BY_ACL_RESOURCE } from '../middlewares/acl.middleware.mjs'

const log = createLogger('xo:rest-api:listener')

export abstract class Listener<Type extends XoListenerType | undefined = undefined> {
  #subscribers: Map<Subscriber['id'], { fields: '*' | string[]; subscriber: Subscriber }> = new Map()
  #eventEmitter: EventEmitter
  #eventCallbacks: Map<string, (...args: unknown[]) => void> = new Map()
  #watchedEvent: EventType[]
  #type: Type

  constructor(eventEmitter: EventEmitter, watchedEvent: EventType[], type?: Type) {
    this.#eventEmitter = eventEmitter
    this.#watchedEvent = watchedEvent
    // cast needed because Type !== Type | undefined (even if Type extends undefined...)
    this.#type = type as Type
  }

  get subscribers() {
    return this.#subscribers
  }

  get eventEmitter() {
    return this.#eventEmitter
  }

  get type() {
    return this.#type
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
    this.#eventCallbacks.clear()
  }

  clear() {
    this.removeAllEventListeners()
    this.#subscribers.clear()
    this.#watchedEvent = []
  }

  #addEventListener(event: EventType) {
    if (this.#eventCallbacks.has(event)) {
      return
    }

    const broadcastAllSubscriber = async (...args: unknown[]) => {
      await Promise.all(
        this.#subscribers.values().map(async conf => {
          if (!conf.subscriber.isAlive) {
            this.removeSubscriber(conf.subscriber.id)
            return
          }

          let data: Awaited<ReturnType<Listener['handleData']>>
          try {
            data = await this.handleData({ ...conf, event }, ...args)
          } catch (error) {
            log.error(
              `cannot handle data for ${this.type} listener on subscriber: ${conf.subscriber.id} (user: ${conf.subscriber.userId}). Removing it from the subscriber list.`,
              { error }
            )
            this.removeSubscriber(conf.subscriber.id)
            conf.subscriber.clear()
            return
          }
          if (data === undefined) {
            return
          }
          const { event: overridenEvent, ...dataToBroadcast } = data

          conf.subscriber.broadcast(overridenEvent ?? event, dataToBroadcast)
        })
      )
    }
    this.#eventCallbacks.set(event, broadcastAllSubscriber)
    this.#eventEmitter.on(event, broadcastAllSubscriber)
  }

  async getAclEvent({
    event,
    object,
    previousObject,
    userId,
  }: {
    event: CollectionEventType
    object: object | undefined
    previousObject: object | undefined
    userId: XoUser['id']
  }): Promise<CollectionEventType | undefined> {
    if (this.type === undefined || (object === undefined && previousObject === undefined)) {
      return
    }

    const restApi = iocContainer.get(RestApi)
    const user = await restApi.xoApp.getUser(userId)
    if (user.permission === 'admin') {
      return event
    }

    const userPrivileges = await restApi.xoApp.getAclV2UserPrivileges(user.id)
    let resource: SupportedResource | undefined

    // alarm and task are not real `XAPI` type
    if (this.type === 'alarm' || this.type === 'task') {
      resource = this.type
    } else {
      const resourceXapiType = Object.entries(XAPI_TYPE_BY_ACL_RESOURCE).find(([, xapiType]) => xapiType === this.type)
      if (resourceXapiType === undefined) {
        throw new Error(`No resource found for ${this.type} listener type`)
      }
      // cast is necessary because `Object.entries` loses inference on the key (it transforms it into a simple string).
      ;[resource] = resourceXapiType as [keyof typeof XAPI_TYPE_BY_ACL_RESOURCE, XapiXoRecord['type']]
    }

    switch (event) {
      case 'add':
        if (object === undefined) {
          return
        }

        if (!hasPrivilegeOn({ user, userPrivileges, action: 'read', objects: object, resource })) {
          return
        }
        return 'add'
      case 'update':
        // eslint-disable-next-line no-case-declarations
        let canSeeObject = false,
          canSeePreviousObject = false
        if (object !== undefined) {
          canSeeObject = hasPrivilegeOn({
            user,
            userPrivileges,
            action: 'read',
            objects: object,
            resource,
          })
        }

        if (previousObject !== undefined) {
          canSeePreviousObject = hasPrivilegeOn({
            user,
            userPrivileges,
            action: 'read',
            objects: previousObject,
            resource,
          })
        }
        if (canSeeObject && canSeePreviousObject) {
          return 'update'
        }

        if (canSeeObject) {
          return 'add'
        }

        if (canSeePreviousObject) {
          return 'remove'
        }

        return
      case 'remove':
        if (
          !hasPrivilegeOn({
            user,
            userPrivileges,
            action: 'read',
            objects: object ?? previousObject!,
            resource,
          })
        ) {
          return
        }
        return 'remove'
      default:
        // Not supposed to be here
        throw new Error(`${event} event unhandled on ${this.type} listener`)
    }
  }

  abstract handleData(
    conf: { fields: '*' | string[]; subscriber: Subscriber; event: EventType },
    ...args: unknown[]
  ): Promise<(object & { event?: CollectionEventType }) | undefined>
}
