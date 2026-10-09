import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'

// this module depends on the IoC container, which cannot be initialized on its own
// because of circular imports between the services: load the generated routes first,
// like `index.mts` does
import '../open-api/routes/routes.js'

import type { AnyPrivilege } from '@xen-orchestra/acl'
import type { XoUser, XoVmBackupArchive } from '@vates/types'

import { Subscriber, SubscriberManager, XoListener } from './event.class.mjs'
import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

const REPOSITORY_ID = '231264c3-af43-4ec0-a3be-394c5b1fdbfc'
const OTHER_REPOSITORY_ID = '1af95910-01b4-4e87-9c2f-d895cafe0776'

function createArchive(backupRepository: string, timestamp: number, props?: Partial<XoVmBackupArchive>) {
  return {
    id: `${backupRepository}/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json`,
    type: 'xo-vm-backup',
    backupRepository,
    disks: [],
    jobId: 'job-1',
    mode: 'delta',
    scheduleId: 'schedule-1',
    size: 1024,
    timestamp,
    vm: { uuid: '6ef7c09e-677b-1e6f-0546-7ab30413c61c', name_description: '', name_label: 'web', tags: [] },
    withMemory: false,
    ...props,
  } as unknown as XoVmBackupArchive
}

/**
 * Binds a `RestApi` serving a single user with the given privileges, which is what
 * `Listener#getAclEvent` resolves the subscriber against.
 */
function bindRestApi(user: Partial<XoUser>, userPrivileges: AnyPrivilege[] = []) {
  const _user = { id: 'user-1', permission: 'none', ...user } as XoUser

  if (iocContainer.isBound(RestApi)) {
    iocContainer.unbind(RestApi)
  }
  iocContainer.bind(RestApi).toConstantValue({
    xoApp: {
      getUser: async () => _user,
      getAclV2UserPrivileges: async () => userPrivileges,
    },
  } as unknown as RestApi)

  return _user
}

/** Collects the SSE frames written on the wire, parsed back into `{ event, data }`. */
function createSubscriber(userId: XoUser['id']) {
  const connection = new PassThrough()
  const frames: { event: string; data: Record<string, unknown> }[] = []

  let buffer = ''
  connection.on('data', chunk => {
    buffer += String(chunk)

    let index: number
    while ((index = buffer.indexOf('\n\n')) !== -1) {
      const [eventLine, dataLine] = buffer.slice(0, index).split('\n')
      buffer = buffer.slice(index + 2)
      frames.push({ event: eventLine.slice('event: '.length), data: JSON.parse(dataLine.slice('data: '.length)) })
    }
  })

  const subscriber = new Subscriber(connection, new SubscriberManager(), userId)
  // drop the `init` frame the subscriber does not send itself
  frames.length = 0

  return { frames, subscriber }
}

/** Lets the listener broadcast: it handles the data asynchronously, and the stream is async too. */
async function flush() {
  for (let i = 0; i < 20; i++) {
    await new Promise(resolve => setImmediate(resolve))
  }
}

describe('XoListener on the backup-archive collection', () => {
  it('broadcasts the archive of each change, tagged with its subscription', async () => {
    const user = bindRestApi({ permission: 'admin' })
    const { frames, subscriber } = createSubscriber(user.id)

    const emitter = new EventEmitter()
    const listener = new XoListener('backup-archive', emitter)
    listener.addSubscriber(subscriber)

    // a backup has been discovered by a listing
    const added = createArchive(REPOSITORY_ID, 1)
    emitter.emit('add', added, undefined)
    // it has been merged: same archive, bigger
    const merged = createArchive(REPOSITORY_ID, 1, { size: 2048 })
    emitter.emit('update', merged, added)
    // it is gone from the repository
    emitter.emit('remove', undefined, merged)

    await flush()

    assert.deepEqual(
      frames.map(({ event }) => event),
      ['add', 'update', 'remove']
    )
    // every frame carries the archive itself, tagged with the collection it comes from
    frames.forEach(({ data }) => {
      assert.equal(data.$subscription, 'backup-archive')
      assert.equal(data.id, added.id)
      assert.equal(data.backupRepository, REPOSITORY_ID)
    })
    assert.equal(frames[0].data.size, 1024)
    assert.equal(frames[1].data.size, 2048)
    // a remove carries the value the archive had, since it no longer has one
    assert.equal(frames[2].data.size, 2048)
  })

  it('sends nothing to a user without the backup-archive:read privilege', async () => {
    const user = bindRestApi({ permission: 'none' }, [])
    const { frames, subscriber } = createSubscriber(user.id)

    const emitter = new EventEmitter()
    const listener = new XoListener('backup-archive', emitter)
    listener.addSubscriber(subscriber)

    const archive = createArchive(REPOSITORY_ID, 1)
    emitter.emit('add', archive, undefined)
    emitter.emit('update', createArchive(REPOSITORY_ID, 1, { size: 2048 }), archive)
    emitter.emit('remove', undefined, archive)

    await flush()

    assert.deepEqual(frames, [])
  })

  it('sends the archives a user has the backup-archive:read privilege on, and only those', async () => {
    const user = bindRestApi({ permission: 'none' }, [
      {
        id: 'privilege-1',
        resource: 'backup-archive',
        action: 'read',
        selector: `backupRepository:${REPOSITORY_ID}`,
        effect: 'allow',
        roleId: 'role-1',
      },
    ] as unknown as AnyPrivilege[])
    const { frames, subscriber } = createSubscriber(user.id)

    const emitter = new EventEmitter()
    const listener = new XoListener('backup-archive', emitter)
    listener.addSubscriber(subscriber)

    const readable = createArchive(REPOSITORY_ID, 1)
    const hidden = createArchive(OTHER_REPOSITORY_ID, 2)
    emitter.emit('add', readable, undefined)
    emitter.emit('add', hidden, undefined)

    await flush()

    assert.equal(frames.length, 1)
    assert.equal(frames[0].event, 'add')
    assert.equal(frames[0].data.backupRepository, REPOSITORY_ID)
  })
})
