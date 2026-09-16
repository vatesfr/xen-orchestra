import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import Remotes from './remotes.mjs'

const REMOTE_ID = 'a-remote-id'

// instantiates the mixin with the minimum an `Xo` app provides to it
const createRemotes = () => {
  const dropped = []
  const purged = []
  const forgotten = []

  const app = {
    config: { get: () => ({}) },
    forgetVmBackupRepository: id => dropped.push(id),
    hooks: { on() {} },
    invalidateVmBackupsListing: id => purged.push(id),
  }

  const remotes = new Remotes(app)

  const stored = { id: REMOTE_ID, enabled: true, url: 'file:///media/backup' }
  const removed = []
  remotes._remotes = {
    first: async () => ({ ...stored }),
    remove: async id => removed.push(id),
    update: async remote => Object.assign(stored, remote),
  }

  // the handler `getRemoteHandler()` would have created and cached
  remotes._handlers[REMOTE_ID] = {
    forget: async () => forgotten.push(REMOTE_ID),
  }

  return { dropped, forgotten, purged, removed, remotes, stored }
}

describe('updateRemote', () => {
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
