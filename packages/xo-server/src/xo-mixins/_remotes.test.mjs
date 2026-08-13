import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import Remotes from './remotes.mjs'

const REMOTE_ID = 'a-remote-id'

// instantiates the mixin with the minimum an `Xo` app provides to it
const createRemotes = () => {
  const purged = []
  const forgotten = []

  const app = {
    config: { get: () => ({}) },
    hooks: { on() {} },
    purgeVmBackupsCache: id => purged.push(id),
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

  return { forgotten, purged, removed, remotes, stored }
}

describe('updateRemote', () => {
  it('drops the handler and purges the VM backups cache', async () => {
    const { forgotten, purged, remotes } = createRemotes()

    await remotes.updateRemote(REMOTE_ID, { enabled: false })

    assert.deepEqual(purged, [REMOTE_ID])
    assert.deepEqual(forgotten, [REMOTE_ID])
    assert.equal(remotes._handlers[REMOTE_ID], undefined)
  })

  it('purges the VM backups cache when the remote is re-pointed', async () => {
    const { purged, remotes, stored } = createRemotes()

    await remotes.updateRemote(REMOTE_ID, { url: 'file:///media/other' })

    assert.deepEqual(purged, [REMOTE_ID])
    assert.equal(stored.url, 'file:///media/other')
  })
})

describe('removeRemote', () => {
  it('drops the handler and purges the VM backups cache', async () => {
    const { forgotten, purged, removed, remotes } = createRemotes()

    await remotes.removeRemote(REMOTE_ID)

    assert.deepEqual(purged, [REMOTE_ID])
    assert.deepEqual(forgotten, [REMOTE_ID])
    assert.deepEqual(removed, [REMOTE_ID])
    assert.equal(remotes._handlers[REMOTE_ID], undefined)
  })
})
