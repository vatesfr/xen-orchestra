import pick from 'lodash/pick.js'
import { createLogger } from '@xen-orchestra/log'
import { PassThrough, pipeline } from 'node:stream'
import type { EventEmitter } from 'node:events'
import type { Response } from 'express'

import type { Listener } from '../abstract-classes/listener.mjs'
import { PingListener, Subscriber, SubscriberManager, XoListener } from './event.class.mjs'
import type { ListenerType, SubscriberId, XoListenerType } from './event.type.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { XAPI_TYPES, XoUser, type XapiXoRecord } from '@vates/types'
import { BackupJobService } from '../backup-jobs/backup-job.service.mjs'
import { hasPrivilegeOn, type AnyPrivilege, type SupportedResource } from '@xen-orchestra/acl'
import { XAPI_TYPE_BY_ACL_RESOURCE } from '../middlewares/acl.middleware.mjs'

const log = createLogger('xo:rest-api:event-service')

export class EventService {
  #alarmService: AlarmService
  #backupJobService: BackupJobService
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
    this.#backupJobService = restApi.ioc.get(BackupJobService)

    const fn = this.#clearSseOnPrivilegechange.bind(this)
    const privilegeListener = this.#getListener('acl-privilege')
    privilegeListener.watchedEvent.map(event => privilegeListener.eventEmitter.on(event, fn))
  }

  async #clearSseOnPrivilegechange(privilege?: AnyPrivilege, previousPrivilege?: AnyPrivilege) {
    const roleIds = [privilege?.roleId, previousPrivilege?.roleId].filter(id => id !== undefined)
    const impactedResources = new Set(
      [privilege?.resource, previousPrivilege?.resource].filter(resource => resource !== undefined)
    )

    const roles = await Promise.all(roleIds.map(roleId => this.#restApi.xoApp.getAclV2Role(roleId))).catch(err => {
      log.error('TBD', { error: err })
      return []
    })
    const userIds = new Set<XoUser['id']>()
    roles.forEach(role => {
      if ('userIds' in role) {
        role.userIds.forEach(id => userIds.add(id))
      }
    })

    for (const resource of impactedResources) {
      const impactedListener = this.#listeners.get(XAPI_TYPE_BY_ACL_RESOURCE[resource] ?? resource)

      if (impactedListener === undefined) {
        continue
      }

      for (const [_, conf] of impactedListener.subscribers) {
        if (!userIds.has(conf.subscriber.userId)) {
          continue
        }

        try {
          await this.#resync(impactedListener, conf, resource, privilege, previousPrivilege)
        } catch (error) {
          log.error('cannot resync the SSE connection after a privilege change', { error })
          conf.subscriber.clear()
        }
      }
    }
  }

  // sends `add`/`remove` for the objects the user can now see / can no longer see
  async #resync(
    listener: Listener | Listener<XoListenerType>,
    { subscriber, fields }: { subscriber: Subscriber; fields: '*' | string[] },
    resource: SupportedResource,
    privilege?: AnyPrivilege,
    previousPrivilege?: AnyPrivilege
  ) {
    const type = XAPI_TYPE_BY_ACL_RESOURCE[resource]
    // only the XAPI objects are in memory (and messages exclude the alarms): the client fetches the others again
    if (type === undefined || type === 'message') {
      log.debug('clear SSE connection because privileges changed for this user', { user: subscriber.userId })
      return subscriber.clear()
    }

    const { xoApp } = this.#restApi
    const user = await xoApp.getUser(subscriber.userId)
    const privileges = (await xoApp.getAclV2UserPrivileges(user.id)) as AnyPrivilege[]

    const changedId = (privilege ?? previousPrivilege)!.id
    const previousPrivileges = privileges.filter(({ id }) => id !== changedId).concat(previousPrivilege ?? [])
    const canSee = (userPrivileges: AnyPrivilege[], object: object) =>
      hasPrivilegeOn({ user, userPrivileges, action: 'read', resource, objects: object })

    for (const object of Object.values(this.#restApi.getObjectsByType(type))) {
      const visible = canSee(privileges, object)
      if (visible !== canSee(previousPrivileges, object)) {
        subscriber.broadcast(visible ? 'add' : 'remove', {
          $subscription: listener.type,
          ...(fields === '*' ? object : pick(object, fields)),
        })
      }
    }
  }

  #getListener<Type extends ListenerType>(type: Type): Listener | Listener<XoListenerType> {
    if (this.#listeners.has(type)) {
      return this.#listeners.get(type)!
    }

    let listener: Listener<XoListenerType> | Listener
    if (type === 'ping') {
      listener = new PingListener()
    } else {
      const isBackupJob = type === 'backup-job'
      const isMessage = type === 'alarm' || type === 'message'

      let eventEmitter: EventEmitter
      if (type === 'task') {
        eventEmitter = this.#restApi.xoApp.tasks
      } else if (type === 'backup-archive') {
        // the backup archives are not a registered collection: the backups cache owns their emitter
        eventEmitter = this.#restApi.xoApp.vmBackupArchives
      } else if (type === 'backup-log') {
        eventEmitter = this.#restApi.xoApp.backupLogsEe
      } else if (XAPI_TYPES.includes(isMessage ? 'message' : type)) {
        // alarm is purely XO-related; it doesn't exist at the XAPI level.
        // alarm is a message with parsed values. So, in the case of an alarm listener, it listens for message collection.
        eventEmitter = this.#restApi.xoApp.objects.allIndexes.type.getEventEmitterByType(
          isMessage ? 'message' : (type as XapiXoRecord['type'])
        )
      } else {
        eventEmitter = this.#restApi.xoApp.getXoEventEmitterByType(isBackupJob ? 'job' : type)
      }

      listener = new XoListener(type, eventEmitter, {
        alarmService: isMessage ? this.#alarmService : undefined,
        backupJobService: isBackupJob ? this.#backupJobService : undefined,
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
