import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import type { Response } from 'express'

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
  const xoEventEmitters: Record<string, EventEmitter> = {}
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
      vmBackupArchives,
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

  describe('sends the objects whose visibility changed when the RBAC changes', () => {
    const privilege = (resource: string, selector: string, id = 'privilege-1') => ({
      id,
      roleId: 'role-1',
      resource,
      action: 'read',
      effect: 'allow',
      selector,
    })

    /**
     * A connection of a user subscribed to a collection of two objects, `o1` and `o2`. Changing `state` then calling
     * `change()` emits an RBAC trigger (its payload is ignored) and returns the frames it produced.
     */
    async function connect(collection: 'VM' | 'user', privileges: object[], permission = 'none') {
      const state = { error: undefined as Error | undefined, permission, privileges }
      const restApi = createRestApi(new EventEmitter())
      Object.assign(restApi, {
        getCurrentUser: () => ({ id: 'user-2', permission: state.permission }),
        getObjectsByType: () => ({ o1: { id: 'o1' }, o2: { id: 'o2' } }),
      })
      Object.assign(restApi.xoApp, {
        getAclV2UserPrivileges: async () => {
          if (state.error !== undefined) {
            throw state.error
          }
          return state.privileges
        },
        getXoObjectsByType: async () => [{ id: 'o1' }, { id: 'o2' }],
        getUser: async () => ({ id: 'user-2', permission: state.permission }),
        objects: { allIndexes: { type: { getEventEmitterByType: () => new EventEmitter() } } },
      })

      const eventService = new EventService(restApi)
      const { frames, res } = createResponse()
      eventService.addListenerFor(await eventService.createSseSubscriber(res), { type: collection, fields: ['id'] })

      return {
        res,
        state,
        async change(type = 'acl-privilege', times = 1) {
          frames.length = 0
          for (let i = 0; i < times; i++) {
            restApi.xoApp.getXoEventEmitterByType(type).emit('update', {}, {})
          }
          await flush()
          return frames.map(({ event, data }) => `${event} ${data.id}`)
        },
      }
    }

    // a XAPI collection, and a XO one read like its GET endpoint does
    for (const [resource, collection] of [
      ['vm', 'VM'],
      ['user', 'user'],
    ] as const) {
      it(`for the ${collection} collection when a privilege changes`, async t => {
        t.mock.timers.enable({ apis: ['setInterval'] })

        const connection = await connect(collection, [privilege(resource, 'id:o1')])
        connection.state.privileges = [privilege(resource, 'id:o2')]

        assert.deepEqual(await connection.change(), ['remove o1', 'add o2'])
        assert.equal(connection.res.destroyed, false)
      })
    }

    it('once for a burst of changes', async t => {
      t.mock.timers.enable({ apis: ['setInterval'] })

      // two privileges granting `o1` are added at once
      const connection = await connect('VM', [])
      connection.state.privileges = [privilege('vm', 'id:o1'), privilege('vm', 'id:o1', 'privilege-2')]

      assert.deepEqual(await connection.change('acl-privilege', 2), ['add o1'])
    })

    it('when a role is attached to or detached from the user, directly or through a group', async t => {
      t.mock.timers.enable({ apis: ['setInterval'] })

      const connection = await connect('VM', [])
      // the user joins a group which has the role
      connection.state.privileges = [privilege('vm', 'id:o1')]
      assert.deepEqual(await connection.change('user'), ['add o1'])

      // the role is detached
      connection.state.privileges = []
      assert.deepEqual(await connection.change('acl-role'), ['remove o1'])
    })

    it('when the user is no longer an admin', async t => {
      t.mock.timers.enable({ apis: ['setInterval'] })

      const connection = await connect('VM', [privilege('vm', 'id:o1')], 'admin')
      connection.state.permission = 'none'

      assert.deepEqual(await connection.change('user'), ['remove o2'])
    })

    it('or closes the connection when the privileges cannot be read', async t => {
      t.mock.timers.enable({ apis: ['setInterval'] })

      const connection = await connect('VM', [])
      connection.state.error = new Error('cannot check the licence')

      assert.deepEqual(await connection.change(), [])
      assert.equal(connection.res.destroyed, true)
    })
  })
})
