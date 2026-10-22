import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { EventEmitter } from 'node:events'

import Remotes from './remotes.mjs'

const REMOTE_ID = 'a-remote-id'

// instantiates the mixin with the minimum an `Xo` app provides to it
const createRemotes = () => {
  const dropped = []
  const purged = []
  const forgotten = []
  // the order in which the remote is updated and listed
  const events = []
  const hooks = { __proto__: null }
  const archives = new EventEmitter()

  const app = {
    config: { get: () => ({}) },
    forgetVmBackupRepository: id => dropped.push(id),
    hooks: { on: (name, listener) => (hooks[name] ??= []).push(listener) },
    invalidateVmBackupsListing: id => purged.push(id),
    listVmBackupsNg: async ids => events.push(['list', ids]),
    vmBackupArchives: archives,
  }

  const remotes = new Remotes(app)

  const stored = { id: REMOTE_ID, enabled: true, url: 'file:///media/backup' }
  const removed = []
  remotes._remotes = {
    first: async () => ({ ...stored }),
    get: async () => [],
    remove: async id => removed.push(id),
    update: async remote => {
      events.push(['update', remote.enabled])
      return Object.assign(stored, remote)
    },
  }

  // the handler `getRemoteHandler()` would have created and cached
  remotes._handlers[REMOTE_ID] = {
    forget: async () => forgotten.push(REMOTE_ID),
  }

  return { archives, dropped, events, forgotten, hooks, purged, removed, remotes, stored }
}

describe('updateRemote', () => {
  it('lists a remote which is enabled, once the update is stored', async () => {
    const { events, remotes, stored } = createRemotes()
    stored.enabled = false

    await remotes.updateRemote(REMOTE_ID, { enabled: true })

    // announced and polled from now on, as the remotes listed at start; the listing reads the record,
    // so it must come after the update
    assert.deepEqual(events, [
      ['update', true],
      ['list', [REMOTE_ID]],
    ])
  })

  it('drops the handler and the backups of a remote which is disabled', async () => {
    const { dropped, forgotten, purged, remotes } = createRemotes()

    await remotes.updateRemote(REMOTE_ID, { enabled: false })

    // it will not be listed again: its backups leave the collection instead of waiting for a
    // listing which will never happen
    assert.deepEqual(dropped, [REMOTE_ID])
    assert.deepEqual(purged, [])
    assert.deepEqual(forgotten, [REMOTE_ID])
    assert.equal(remotes._handlers[REMOTE_ID], undefined)
  })

  it('purges the VM backups cache when the remote is re-pointed', async () => {
    const { dropped, purged, remotes, stored } = createRemotes()

    await remotes.updateRemote(REMOTE_ID, { url: 'file:///media/other' })

    // it is going to be read again: only what actually changed is announced
    assert.deepEqual(purged, [REMOTE_ID])
    assert.deepEqual(dropped, [])
    assert.equal(stored.url, 'file:///media/other')
  })
})

describe('removeRemote', () => {
  it('drops the handler and the backups of the remote', async () => {
    const { dropped, forgotten, purged, removed, remotes } = createRemotes()

    await remotes.removeRemote(REMOTE_ID)

    assert.deepEqual(dropped, [REMOTE_ID])
    assert.deepEqual(purged, [])
    assert.deepEqual(forgotten, [REMOTE_ID])
    assert.deepEqual(removed, [REMOTE_ID])
    assert.equal(remotes._handlers[REMOTE_ID], undefined)
  })
})

describe('VM backup archives', () => {
  // they emit what the collections registered with the app emit: an array of archives on `add` and
  // `update`, of their ids on `remove`
  it('refreshes the info of the repository whose archives changed', async () => {
    const { archives, hooks, remotes } = createRemotes()
    const scheduled = []
    remotes._scheduleBackupRepositoryInfoRefresh = id => scheduled.push(id)
    await Promise.all(hooks.start.map(listener => listener()))

    archives.emit('add', [{ id: `${REMOTE_ID}/xo-vm-backups/a-vm/20261021T000000Z.json`, backupRepository: REMOTE_ID }])
    archives.emit('remove', ['another-remote-id/xo-vm-backups/a-vm/20261021T000000Z.json'])

    assert.deepEqual(scheduled, [REMOTE_ID, 'another-remote-id'])
  })

  it('stops listening to them when the app stops', async () => {
    const { archives, hooks } = createRemotes()
    await Promise.all(hooks.start.map(listener => listener()))
    await Promise.all(hooks.stop.map(listener => listener()))

    assert.deepEqual(archives.eventNames(), [])
  })
})
