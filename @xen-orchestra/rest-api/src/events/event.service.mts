import isEqual from 'lodash/isEqual.js'
import xorWith from 'lodash/xorWith.js'
import { createLogger } from '@xen-orchestra/log'
import { noSuchObject } from 'xo-common/api-errors.js'
import { PassThrough, pipeline } from 'node:stream'
import type { EventEmitter } from 'node:events'
import type { Response } from 'express'

import type { Listener } from '../abstract-classes/listener.mjs'
import type { UserPrivileges } from '../abstract-classes/listener.type.mjs'
import { PingListener, Subscriber, SubscriberManager, XoListener } from './event.class.mjs'
import type { ListenerType, SubscriberId, XoListenerType } from './event.type.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import { XAPI_TYPES, type XapiXoRecord, type XoUser } from '@vates/types'
import { BackupJobService } from '../backup-jobs/backup-job.service.mjs'
import { SUPPORTED_ACTIONS_BY_RESOURCE, type AnyPrivilege, type SupportedResource } from '@xen-orchestra/acl'
import { XAPI_TYPE_BY_ACL_RESOURCE } from '../middlewares/acl.middleware.mjs'

const log = createLogger('xo:rest-api:event-service')

export class EventService {
  #alarmService: AlarmService
  #backupJobService: BackupJobService
  #restApi: RestApi
  #listeners: Map<string, Listener | Listener<XoListenerType>> = new Map()
  #subscriberManager = new SubscriberManager()
  #privilegesBySubscriber = new WeakMap<Subscriber, UserPrivileges>()
  #rbacChanges = 0
  #isResyncing = false

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

    // what a user can see depends on its permission, its groups and their roles and privileges (attaching a role to a
    // group touches the role, and joining or leaving a group updates the user)
    for (const type of ['acl-privilege', 'acl-role', 'user']) {
      for (const event of ['add', 'update', 'remove']) {
        restApi.xoApp.getXoEventEmitterByType(type).on(event, () => this.#resyncAll())
      }
    }
  }

  // TODO: remove once the PR that block RBAC on admin user is merged
  // Just here to test the feature
  async #getUserPrivileges(userId: XoUser['id']): Promise<UserPrivileges> {
    const { xoApp } = this.#restApi
    const user = await xoApp.getUser(userId)
    const userPrivileges = user.permission === 'admin' ? [] : await xoApp.getAclV2UserPrivileges(userId)
    return { user, userPrivileges: userPrivileges as AnyPrivilege[] }
  }

  async #resyncAll() {
    this.#rbacChanges++
    if (this.#isResyncing) {
      return
    }
    this.#isResyncing = true
    let handledChanges: number
    do {
      handledChanges = this.#rbacChanges
      await Promise.all(
        [...this.#subscriberManager.subscribers.values()].map(subscriber =>
          this.#resync(subscriber).catch(error => {
            // a role deleted during the read: the round its removal triggers re-diffs from this snapshot
            if (noSuchObject.is(error, { type: 'role' })) {
              return
            }

            log.error('cannot resync the SSE connection after an RBAC change', { error })
            subscriber.clear()
          })
        )
      )
    } while (handledChanges !== this.#rbacChanges)
    this.#isResyncing = false
  }

  async #resync(subscriber: Subscriber) {
    const previous = this.#privilegesBySubscriber.get(subscriber)
    if (previous === undefined) {
      throw new Error('calling the #resync without initializing SSE')
    }

    const current = await this.#getUserPrivileges(subscriber.userId)
    const resources =
      current.user.permission !== previous.user.permission
        ? // if the user permission change (e.g from admin to -> non admin)
          // we need to considere all resource to be changed
          (Object.keys(SUPPORTED_ACTIONS_BY_RESOURCE) as SupportedResource[])
        : xorWith(current.userPrivileges, previous.userPrivileges, isEqual).map(({ resource }) => resource)
    const privilegesChange = {
      ...current,
      previousUser: previous.user,
      previousUserPrivileges: previous.userPrivileges,
    }

    for (const resource of new Set(resources)) {
      const listener = this.#listeners.get(XAPI_TYPE_BY_ACL_RESOURCE[resource] ?? resource)
      if (listener?.subscribers.has(subscriber.id)) {
        // alarms are messages
        const type = resource === 'alarm' ? 'message' : XAPI_TYPE_BY_ACL_RESOURCE[resource]
        const objects =
          type !== undefined
            ? Object.values(this.#restApi.getObjectsByType(type))
            : await this.#restApi.xoApp.getXoObjectsByType(resource === 'backup-job' ? 'job' : resource)
        await listener.resync(subscriber, objects, privilegesChange)
      }
    }
    this.#privilegesBySubscriber.set(subscriber, current)
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

  async createSseSubscriber(res: Response): Promise<SubscriberId> {
    const user = this.#restApi.getCurrentUser()
    const rbacChanges = this.#rbacChanges
    const privileges = await this.#getUserPrivileges(user.id)

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

    const subscriber = new Subscriber(connection, this.#subscriberManager, user.id)
    this.#privilegesBySubscriber.set(subscriber, privileges)
    if (rbacChanges !== this.#rbacChanges) {
      // a sync started during the read may have missed this connection
      this.#resyncAll()
    }
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
