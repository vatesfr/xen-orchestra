import { createLogger } from '@xen-orchestra/log'
import type { EventEmitter } from 'node:events'
import { AnyPrivilege, hasPrivilegeOn, SupportedResource } from '@xen-orchestra/acl'
import { XAPI_TYPES, type XapiXoRecord, type XoUser } from '@vates/types'
import type { CollectionEventType, EventType, NonXapiListenerType, XoListenerType } from '../events/event.type.mjs'
import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { Subscriber } from '../events/event.class.mjs'
import { XAPI_TYPE_BY_ACL_RESOURCE } from '../middlewares/acl.middleware.mjs'
import type { PrivilegesChange } from './listener.type.mjs'

const log = createLogger('xo:rest-api:listener')

export abstract class Listener<Type extends XoListenerType | undefined = undefined> {
  #subscribers: Map<
    Subscriber['id'],
    { fields: '*' | string[]; subscriber: Subscriber; unregisterOnClear: () => void }
  > = new Map()
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

  get watchedEvent() {
    return this.#watchedEvent
  }

  addSubscriber(subscriber: Subscriber, fields: '*' | string[] = '*') {
    const unregisterOnClear = subscriber.onClear(() => this.removeSubscriber(subscriber.id))

    this.#subscribers.set(subscriber.id, { fields, subscriber, unregisterOnClear })

    if (this.#subscribers.size === 1) {
      this.#watchedEvent.forEach(event => this.#addEventListener(event))
    }
  }

  removeSubscriber(subscriberId: Subscriber['id']) {
    const subscriberWithConf = this.#subscribers.get(subscriberId)
    if (subscriberWithConf === undefined) {
      return
    }

    subscriberWithConf.unregisterOnClear()
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
    this.#subscribers.forEach(({ subscriber }) => this.removeSubscriber(subscriber.id))
    this.#watchedEvent = []
  }

  #addEventListener(event: EventType) {
    if (this.#eventCallbacks.has(event)) {
      return
    }

    const broadcastAllSubscriber = async (...args: unknown[]) => {
      try {
        await Promise.all(
          [...this.#subscribers.values()].map(async conf => {
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
      } catch (error) {
        log.warn('unexpected error broadcasting to subscribers', { error })
      }
    }
    this.#eventCallbacks.set(event, broadcastAllSubscriber)
    this.#eventEmitter.on(event, broadcastAllSubscriber)
  }

  async resync(subscriber: Subscriber, objects: object[], privilegesChange: PrivilegesChange) {
    const conf = this.#subscribers.get(subscriber.id)
    if (conf === undefined) {
      return
    }

    for (const object of objects) {
      const data = await this.handleData({ ...conf, event: 'update' }, object, object, privilegesChange)
      if (data?.event === 'add' || data?.event === 'remove') {
        const { event, ...dataToBroadcast } = data
        subscriber.broadcast(event, dataToBroadcast)
      }
    }
  }

  async getAclEvent({
    event,
    object,
    previousObject,
    userId,
    privilegesChange,
  }: {
    event: CollectionEventType
    object: object | undefined
    previousObject: object | undefined
    userId: XoUser['id']
    privilegesChange?: PrivilegesChange
  }): Promise<CollectionEventType | undefined> {
    if (this.type === undefined || (object === undefined && previousObject === undefined)) {
      return
    }
    if (this.type === 'authentication_token') {
      log.warn('getAclEvent should not be called for authentication_token listener, ownership is checked in handleData')
      return
    }

    const restApi = iocContainer.get(RestApi)
    const user = privilegesChange?.user ?? (await restApi.xoApp.getUser(userId))
    if (user.permission === 'admin') {
      return event
    }

    const userPrivileges =
      privilegesChange?.userPrivileges ?? ((await restApi.xoApp.getAclV2UserPrivileges(user.id)) as AnyPrivilege[])
    const previousUserPrivileges = privilegesChange?.previousUserPrivileges ?? userPrivileges
    let resource: SupportedResource | undefined

    if (!XAPI_TYPES.includes(this.type)) {
      resource = this.type as Exclude<NonXapiListenerType, 'authentication_token'>
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
      case 'update': {
        const canSeeObject =
          object !== undefined &&
          hasPrivilegeOn({
            user,
            userPrivileges,
            action: 'read',
            objects: object,
            resource,
          })

        const canSeePreviousObject =
          previousObject !== undefined &&
          hasPrivilegeOn({
            user,
            userPrivileges: previousUserPrivileges,
            action: 'read',
            objects: previousObject,
            resource,
          })

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
      }
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
