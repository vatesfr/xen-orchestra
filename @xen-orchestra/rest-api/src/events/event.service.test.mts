import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import type { Response } from 'express'
import { noSuchObject } from 'xo-common/api-errors.js'

// this module depends on the IoC container, which cannot be initialized on its own
// because of circular imports between the services: load the generated routes first,
// like `index.mts` does
import '../open-api/routes/routes.js'

import type { XoUser, XoVmBackupArchive } from '@vates/types'

import { EventService } from './event.service.mjs'
import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { BackupJobService } from '../backup-jobs/backup-job.service.mjs'

const REPOSITORY_ID = '231264c3-af43-4ec0-a3be-394c5b1fdbfc'

const user = { id: 'user-1', permission: 'admin' } as XoUser

const archive = {
  id: `${REPOSITORY_ID}/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json`,
  type: 'xo-vm-backup',
  backupRepository: REPOSITORY_ID,
  size: 1024,
} as unknown as XoVmBackupArchive

/**
 * A `RestApi` whose app exposes the backup archives as a collection, bound both as the dependency of
 * the service and in the container, which is where `Listener#getAclEvent` resolves the user from.
 */
function createRestApi(vmBackupArchives: EventEmitter) {
  const xoEventEmitters: Record<string, EventEmitter> = { 'backup-archive': vmBackupArchives }
  const restApi = {
    getCurrentUser: () => user,
    ioc: {
      get: (service: unknown) => {
        assert.ok(service === AlarmService || service === BackupJobService)
        return {}
      },
    },
    xoApp: {
      config: { get: () => 1 },
      getUser: async () => user,
      getAclV2UserPrivileges: async () => [],
      getXoEventEmitterByType: (type: string) => (xoEventEmitters[type] ??= new EventEmitter()),
    },
  } as unknown as RestApi

  if (iocContainer.isBound(RestApi)) {
    iocContainer.unbind(RestApi)
  }
  iocContainer.bind(RestApi).toConstantValue(restApi)

  return restApi
}

/** An express response a subscriber can be piped into, which collects the SSE frames it is sent. */
function createResponse() {
  const res = new PassThrough() as unknown as Response & PassThrough
  res.setHeaders = () => res

  const frames: { event: string; data: Record<string, unknown> }[] = []
  let buffer = ''
  res.on('data', chunk => {
    buffer += String(chunk)

    let index: number
    while ((index = buffer.indexOf('\n\n')) !== -1) {
      const [eventLine, dataLine] = buffer.slice(0, index).split('\n')
      buffer = buffer.slice(index + 2)
      frames.push({ event: eventLine.slice('event: '.length), data: JSON.parse(dataLine.slice('data: '.length)) })
    }
  })

  return { frames, res }
}

async function flush() {
  for (let i = 0; i < 20; i++) {
    await new Promise(resolve => setImmediate(resolve))
  }
}

describe('EventService', () => {
  afterEach(() => process.removeAllListeners('SIGTERM'))

  it('streams the changes of the backup archives of the app to a backup-archive subscriber', async t => {
    // the ping listener the subscriber always gets would otherwise keep the test process alive
    t.mock.timers.enable({ apis: ['setInterval'] })

    const vmBackupArchives = new EventEmitter()
    const eventService = new EventService(createRestApi(vmBackupArchives))
    const { frames, res } = createResponse()

    const subscriberId = await eventService.createSseSubscriber(res)
    eventService.addListenerFor(subscriberId, { type: 'backup-archive' })

    vmBackupArchives.emit('add', archive, undefined)
    await flush()

    // the `init` frame of the connection, then the archive
    assert.deepEqual(
      frames.map(({ event }) => event),
      ['init', 'add']
    )
    assert.equal(frames[1].data.$subscription, 'backup-archive')
    assert.equal(frames[1].data.id, archive.id)

    // stops listening to the collection once nobody subscribes to it anymore
    eventService.removeListenerFor(subscriberId, 'backup-archive')
    assert.equal(vmBackupArchives.listenerCount('add'), 0)
  })

  describe('closes the connection when the RBAC changes what the user can see in a subscribed collection', () => {
    const privilege = (resource: string, action = 'read') => ({
      id: 'privilege-1',
      roleId: 'role-1',
      resource,
      action,
      effect: 'allow',
      selector: 'id:o1',
    })

    /**
     * A connection of a user subscribed to the VM collection. Changing `state` then calling `change()` emits a change
     * of a `type` object (by default, a read privilege is added) and tells whether the connection was closed.
     * `whileOpening` changes `state` and emits a privilege change right after the privileges of the opening stream are
     * read. `state.reads` counts the reads of the privileges.
     */
    async function connect(
      privileges: object[],
      permission = 'none',
      whileOpening?: (state: { privileges: object[] }) => void
    ) {
      const state = { fail: undefined as (() => void) | undefined, permission, privileges, reads: 0 }
      const restApi = createRestApi(new EventEmitter())
      const emit = (type: string, object?: object, previousObject?: object) =>
        restApi.xoApp.getXoEventEmitterByType(type).emit('update', object, previousObject)
      Object.assign(restApi, { getCurrentUser: () => ({ id: 'user-2', permission: state.permission }) })
      Object.assign(restApi.xoApp, {
        getAclV2UserPrivileges: async () => {
          state.reads++
          state.fail?.()
          const { privileges } = state
          if (whileOpening !== undefined) {
            whileOpening(state)
            whileOpening = undefined
            emit('acl-privilege', privilege('vm'))
          }
          return privileges
        },
        getUser: async () => ({ id: 'user-2', permission: state.permission }),
        objects: { allIndexes: { type: { getEventEmitterByType: () => new EventEmitter() } } },
      })

      const eventService = new EventService(restApi)
      const { res } = createResponse()
      eventService.addListenerFor(await eventService.createSseSubscriber(res), { type: 'VM' })

      return {
        state,
        async change(type = 'acl-privilege', object: object | undefined = privilege('vm'), previousObject?: object) {
          emit(type, object, previousObject)
          await flush()
          return res.destroyed
        },
      }
    }

    const role = (userIds: string[], name = 'role') => ({ id: 'role-1', name, userIds, groupIds: [] })
    const user = (groups: string[], preferences = {}) => ({ id: 'user-2', permission: 'none', groups, preferences })

    // what a user can see depends on its privileges, roles, groups and permission
    for (const [type, object, previousObject] of [
      ['acl-privilege', privilege('vm'), undefined],
      ['acl-role', role(['user-2']), role([])],
      ['user', user(['group-1']), user([])],
    ] as const) {
      it(`on a change of ${type}`, async t => {
        t.mock.timers.enable({ apis: ['setInterval'] })

        const connection = await connect([])
        connection.state.privileges = [privilege('vm')]

        assert.equal(await connection.change(type, object, previousObject), true)
      })
    }

    it('without resyncing when the change cannot change what a user can see', async t => {
      t.mock.timers.enable({ apis: ['setInterval'] })

      const connection = await connect([])
      connection.state.reads = 0

      assert.equal(await connection.change('acl-privilege', privilege('vm', 'start')), false)
      assert.equal(
        await connection.change('acl-role', role(['user-2', 'user-3'], 'renamed'), role(['user-2', 'user-3'])),
        false
      )
      assert.equal(await connection.change('user', user([], { theme: 'dark' }), user([])), false)
      assert.equal(connection.state.reads, 0)
    })

    it('but not when the privileges change on another collection or for another action', async t => {
      t.mock.timers.enable({ apis: ['setInterval'] })

      const connection = await connect([])
      connection.state.privileges = [privilege('host'), privilege('vm', 'start')]

      assert.equal(await connection.change(), false)
    })

    for (const [from, to] of [
      ['admin', 'none'],
      ['none', 'admin'],
    ]) {
      it(`when the user permission changes from ${from} to ${to}`, async t => {
        t.mock.timers.enable({ apis: ['setInterval'] })

        const connection = await connect([], from)
        connection.state.permission = to

        assert.equal(
          await connection.change('user', { ...user([]), permission: to }, { ...user([]), permission: from }),
          true
        )
      })
    }

    it('including a change made while the stream was opening', async t => {
      t.mock.timers.enable({ apis: ['setInterval'] })

      // `o1` is granted after the privileges of the connection were read
      const connection = await connect([], 'none', state => (state.privileges = [privilege('vm')]))
      await flush()

      connection.state.privileges = []
      assert.equal(await connection.change('acl-privilege', undefined, privilege('vm')), true)
    })

    it('reading the privileges at most twice for a burst of changes', async t => {
      t.mock.timers.enable({ apis: ['setInterval'] })

      const connection = await connect([])
      connection.state.reads = 0

      for (let i = 0; i < 4; i++) {
        connection.change()
      }
      assert.equal(await connection.change(), false)
      assert.equal(connection.state.reads, 2)
    })

    it('or when the privileges cannot be read', async t => {
      t.mock.timers.enable({ apis: ['setInterval'] })

      const connection = await connect([])
      connection.state.fail = () => {
        throw new Error('cannot check the licence')
      }

      assert.equal(await connection.change(), true)
    })

    it('but not when a role is deleted while the privileges are read', async t => {
      t.mock.timers.enable({ apis: ['setInterval'] })

      const connection = await connect([privilege('vm')])
      connection.state.fail = () => noSuchObject('role-1', 'role')

      assert.equal(await connection.change(), false)

      // the round the removal of the role triggers diffs from the privileges before it
      connection.state.fail = undefined
      connection.state.privileges = []
      assert.equal(await connection.change('acl-role', undefined, role(['user-2'])), true)
    })
  })
})
