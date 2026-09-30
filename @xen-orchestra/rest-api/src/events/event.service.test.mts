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

    const subscriberId = eventService.createSseSubscriber(res)
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
})
