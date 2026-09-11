import assert from 'assert/strict'
import Disposable from 'promise-toolbox/Disposable'
import test from 'node:test'
import TimeoutError from 'promise-toolbox/TimeoutError'
import { formatJournalEvents, formatVmBackups } from '@xen-orchestra/backups/formatVmBackups.mjs'

import { BACKUP_JOURNAL_DIR, formatJournalDay, formatJournalTime } from '@xen-orchestra/backups/_backupJournal.mjs'

import BackupNg, { backupsListingRetryDelay } from './index.mjs'

const { afterEach, beforeEach, describe, it, mock } = test

// must be kept in sync with `index.mjs`
const LISTING_TIMEOUT = 30e3
const LISTING_DEBOUNCE = 60e3

// `mock.timers.tick()` is synchronous: yield to the event loop so that the promise continuations
// it scheduled have run before the assertions
const tick = async ms => {
  mock.timers.tick(ms)
  await new Promise(resolve => setImmediate(resolve))
}

const createBackupNg = () =>
  new BackupNg({
    config: { getDuration: () => LISTING_DEBOUNCE },
    hooks: { on() {} },
  })

describe('backupsListingRetryDelay()', () => {
  it('follows the Fibonacci sequence', () => {
    assert.deepEqual([0, 1, 2, 3, 4, 5].map(backupsListingRetryDelay), [30e3, 30e3, 60e3, 90e3, 150e3, 240e3])
  })

  it('is capped at 1h', () => {
    assert.equal(backupsListingRetryDelay(100), 60 * 60 * 1e3)
  })
})

describe('_listVmBackupsWithBackoff()', () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('starts a new listing when the previous one never settled', async () => {
    const backupNg = createBackupNg()
    let calls = 0
    backupNg._listVmBackupsOnRemoteUncached = () => {
      ++calls
      return new Promise(() => {})
    }

    const first = backupNg._listVmBackupsWithBackoff('remote')
    await tick(LISTING_TIMEOUT)
    assert.ok((await first).error instanceof TimeoutError)
    assert.equal(calls, 1)

    // the repository is in its retry delay, it is reported as failing without being listed again
    assert.ok((await backupNg._listVmBackupsWithBackoff('remote')).error instanceof TimeoutError)
    assert.equal(calls, 1)

    // the debounce entry has been dropped even though the underlying listing is still running:
    // this is what putting the timeout *inside* the debounced call buys
    await tick(LISTING_DEBOUNCE)
    backupNg._listVmBackupsWithBackoff('remote')
    assert.equal(calls, 2)
  })

  it('counts a single attempt for all the callers of a listing', async () => {
    const backupNg = createBackupNg()
    const error = new Error('unreachable')
    let calls = 0
    backupNg._listVmBackupsOnRemoteUncached = () => {
      ++calls
      return Promise.reject(error)
    }

    const results = await Promise.all([
      backupNg._listVmBackupsWithBackoff('remote'),
      backupNg._listVmBackupsWithBackoff('remote'),
      backupNg._listVmBackupsWithBackoff('remote'),
    ])

    assert.deepEqual(results, [{ error }, { error }, { error }])
    assert.equal(calls, 1)
    assert.equal(backupNg._backupsListingRetry.remote.attempt, 1)
  })

  it('does not count a caller which arrives after the listing failed', async () => {
    const backupNg = createBackupNg()
    const error = new Error('unreachable')
    let calls = 0
    backupNg._listVmBackupsOnRemoteUncached = () => {
      ++calls
      return Promise.reject(error)
    }

    assert.deepEqual(await backupNg._listVmBackupsWithBackoff('remote'), { error })
    assert.equal(backupNg._backupsListingRetry.remote.attempt, 1)

    // past the retry delay but still inside the debounce window: the caller gets the cached
    // rejection back and it must not be counted a second time
    await tick(backupsListingRetryDelay(0) + 1e3)
    assert.deepEqual(await backupNg._listVmBackupsWithBackoff('remote'), { error })
    assert.equal(calls, 1)
    assert.equal(backupNg._backupsListingRetry.remote.attempt, 1)
  })

  it('increases the retry delay on each consecutive failure', async () => {
    const backupNg = createBackupNg()
    const error = new Error('unreachable')
    backupNg._listVmBackupsOnRemoteUncached = () => Promise.reject(error)

    await backupNg._listVmBackupsWithBackoff('remote')
    assert.equal(backupNg._backupsListingRetry.remote.nextAttemptAt, Date.now() + backupsListingRetryDelay(0))

    // past both the retry delay and the debounce window
    await tick(LISTING_DEBOUNCE + 1e3)
    await backupNg._listVmBackupsWithBackoff('remote')
    assert.equal(backupNg._backupsListingRetry.remote.attempt, 2)
    assert.equal(backupNg._backupsListingRetry.remote.nextAttemptAt, Date.now() + backupsListingRetryDelay(1))
  })

  it('clears the retry state when the listing succeeds again', async () => {
    const backupNg = createBackupNg()
    const backupsByVm = { vm: [] }
    const error = new Error('unreachable')
    let failing = true
    backupNg._listVmBackupsOnRemoteUncached = () => (failing ? Promise.reject(error) : Promise.resolve(backupsByVm))

    assert.deepEqual(await backupNg._listVmBackupsWithBackoff('remote'), { error })
    failing = false

    // the repository is not listed again before its retry delay has passed
    assert.deepEqual(await backupNg._listVmBackupsWithBackoff('remote'), { error })

    await tick(LISTING_DEBOUNCE + 1e3)
    assert.deepEqual(await backupNg._listVmBackupsWithBackoff('remote'), { backupsByVm })
    assert.equal(backupNg._backupsListingRetry.remote, undefined)
  })
})

describe('listVmBackupsNg()', () => {
  // as returned by a listing: a VM without any backup is not listed at all
  const BACKUPS_BY_VM = { vmWithBackups: [{ id: 'remote/backup' }] }

  // records `'*'` for a listing of the whole repository, the VM id for a per-VM one
  const createListing = backupNg => {
    const calls = []
    backupNg._listVmBackupsOnRemoteUncached = (remoteId, { vmId } = {}) => {
      calls.push(vmId ?? '*')
      return Promise.resolve(vmId === undefined ? { ...BACKUPS_BY_VM } : { [vmId]: BACKUPS_BY_VM[vmId] ?? [] })
    }
    return calls
  }

  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('does not narrow down the listing of a caller which asked for every VM', async () => {
    const backupNg = createBackupNg()
    const calls = createListing(backupNg)

    // the VM dashboard asks for a single VM, which has no backup on this repository
    assert.deepEqual(await backupNg.listVmBackupsNg(['remote'], { vmId: 'vmWithoutBackups' }), {
      remote: { vmWithoutBackups: [] },
    })

    // inside the debounce window, a caller which asked for every VM must still see them all,
    // which requires listing the repository as a whole
    assert.deepEqual(await backupNg.listVmBackupsNg(['remote']), { remote: BACKUPS_BY_VM })
    assert.deepEqual(calls, ['vmWithoutBackups', '*'])
  })

  it('narrows down the listing to the requested VM', async () => {
    const backupNg = createBackupNg()
    const calls = createListing(backupNg)

    assert.deepEqual(await backupNg.listVmBackupsNg(['remote']), { remote: BACKUPS_BY_VM })

    // inside the debounce window, a caller which asked for a single VM must only get that one
    assert.deepEqual(await backupNg.listVmBackupsNg(['remote'], { vmId: 'vmWithBackups' }), {
      remote: { vmWithBackups: BACKUPS_BY_VM.vmWithBackups },
    })

    // a VM without any backup is not listed by the repository, it must still be reported as empty
    assert.deepEqual(await backupNg.listVmBackupsNg(['remote'], { vmId: 'vmWithoutBackups' }), {
      remote: { vmWithoutBackups: [] },
    })

    // a listing of the whole repository has its own cache entry: each VM is listed on its own
    assert.deepEqual(calls, ['*', 'vmWithBackups', 'vmWithoutBackups'])
  })

  it('lists a VM alone when the repository has not been listed as a whole', async () => {
    const backupNg = createBackupNg()
    const calls = createListing(backupNg)

    assert.deepEqual(await backupNg.listVmBackupsNg(['remote'], { vmId: 'vmWithBackups' }), {
      remote: { vmWithBackups: BACKUPS_BY_VM.vmWithBackups },
    })
    assert.deepEqual(calls, ['vmWithBackups'])
  })

  it('does not reuse the listing of a VM for another one', async () => {
    const backupNg = createBackupNg()
    const calls = createListing(backupNg)

    await backupNg.listVmBackupsNg(['remote'], { vmId: 'vmWithoutBackups' })
    assert.deepEqual(await backupNg.listVmBackupsNg(['remote'], { vmId: 'vmWithBackups' }), {
      remote: { vmWithBackups: BACKUPS_BY_VM.vmWithBackups },
    })

    assert.deepEqual(calls, ['vmWithoutBackups', 'vmWithBackups'])
  })

  it('lists a VM only once for all the callers of a debounce window', async () => {
    const backupNg = createBackupNg()
    const calls = createListing(backupNg)

    await Promise.all([
      backupNg.listVmBackupsNg(['remote'], { vmId: 'vmWithBackups' }),
      backupNg.listVmBackupsNg(['remote'], { vmId: 'vmWithBackups' }),
    ])
    assert.deepEqual(calls, ['vmWithBackups'])

    await tick(LISTING_DEBOUNCE + 1e3)
    await backupNg.listVmBackupsNg(['remote'], { vmId: 'vmWithBackups' })
    assert.deepEqual(calls, ['vmWithBackups', 'vmWithBackups'])
  })

  it('counts a single attempt for all the callers of a failed per-VM listing', async () => {
    const backupNg = createBackupNg()
    const error = new Error('unreachable')
    let calls = 0
    backupNg._listVmBackupsOnRemoteUncached = () => {
      ++calls
      return Promise.reject(error)
    }

    await Promise.all([
      backupNg.listVmBackupsNg(['remote'], { vmId: 'vmWithBackups' }),
      backupNg.listVmBackupsNg(['remote'], { vmId: 'vmWithBackups' }),
    ])

    assert.equal(calls, 1)
    assert.equal(backupNg._backupsListingRetry.remote.attempt, 1)
  })

  it('reports a failed listing as `null` whether a VM was requested or not', async () => {
    const backupNg = createBackupNg()
    backupNg._listVmBackupsOnRemoteUncached = () => Promise.reject(new Error('unreachable'))

    assert.deepEqual(await backupNg.listVmBackupsNg(['remote']), { remote: null })
    assert.deepEqual(await backupNg.listVmBackupsNg(['remote'], { vmId: 'vmWithBackups' }), { remote: null })
  })

  it('lists a repository only once for all the callers of a debounce window', async () => {
    const backupNg = createBackupNg()
    const calls = createListing(backupNg)

    await Promise.all([backupNg.listVmBackupsNg(['remote']), backupNg.listVmBackupsNg(['remote'])])
    assert.equal(calls.length, 1)

    await tick(LISTING_DEBOUNCE + 1e3)
    await backupNg.listVmBackupsNg(['remote'])
    assert.equal(calls.length, 2)
  })
})

describe('invalidateVmBackupsListing()', () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('lists the repository again instead of waiting for its retry delay', async () => {
    const backupNg = createBackupNg()
    const backupsByVm = { vm: [] }
    let failing = true
    backupNg._listVmBackupsOnRemoteUncached = () =>
      failing ? Promise.reject(new Error('unreachable')) : Promise.resolve(backupsByVm)

    await backupNg._listVmBackupsWithBackoff('remote')
    failing = false

    backupNg.invalidateVmBackupsListing('remote')

    assert.deepEqual(await backupNg._listVmBackupsWithBackoff('remote'), { backupsByVm })
  })

  it('drops the listing of the whole repository and the per-VM ones', async () => {
    const backupNg = createBackupNg()
    const calls = []
    backupNg._listVmBackupsOnRemoteUncached = (remoteId, { vmId } = {}) => {
      calls.push(vmId ?? '*')
      return Promise.resolve(vmId === undefined ? { vm: [] } : { [vmId]: [] })
    }

    await backupNg.listVmBackupsNg(['remote'])
    await backupNg.listVmBackupsNg(['remote'], { vmId: 'vm' })
    assert.deepEqual(calls, ['*', 'vm'])

    backupNg.invalidateVmBackupsListing('remote')

    // both entries are gone: the per-VM one has its own cache key, which is not reached by
    // dropping the entry of the repository
    await backupNg.listVmBackupsNg(['remote'])
    await backupNg.listVmBackupsNg(['remote'], { vmId: 'vm' })
    assert.deepEqual(calls, ['*', 'vm', '*', 'vm'])
  })

  it('ignores the outcome of a listing which is still running', async () => {
    const backupNg = createBackupNg()
    let rejectListing
    backupNg._listVmBackupsOnRemoteUncached = () =>
      new Promise((resolve, reject) => {
        rejectListing = reject
      })

    const pending = backupNg._listVmBackupsWithBackoff('remote')
    backupNg.invalidateVmBackupsListing('remote')

    rejectListing(new Error('unreachable'))
    await pending

    // this listing no longer represents the state of the repository, it must not put it in a
    // retry delay
    assert.equal(backupNg._backupsListingRetry.remote, undefined)
  })
})

const REMOTE_ID = 'a-remote-id'
const VM = 'a-vm-uuid'

// `RemoteAdapter` lists and writes the metadata with a leading slash
const filenameOf = name => `/xo-vm-backups/${VM}/${name}.json`

const metadataOf = name => ({
  _filename: filenameOf(name),
  jobId: 'a-job-id',
  mode: 'full',
  scheduleId: 'a-schedule-id',
  size: 1,
  timestamp: Date.parse(`${name}Z`),
  vm: { uuid: VM, name_label: 'a VM', name_description: '', tags: [] },
})

// a real, sortable path, like the one a real journal entry would get, see `_vmBackupsCache.test.mjs`
let journalSeq = 0
const journalEntryPath = date =>
  `/${BACKUP_JOURNAL_DIR}/${formatJournalDay(date)}/${formatJournalTime(date)}-${String(journalSeq++).padStart(6, '0')}`

// mock of the subset of `RemoteAdapter` used to list and delete the backups
class Repository {
  metadataByFilename = new Map()
  journal = []

  nListings = 0

  constructor(metadata) {
    metadata.forEach(_ => this.metadataByFilename.set(_._filename, _))
  }

  get adapter() {
    return {
      deleteVmBackups: async filenames => {
        for (const filename of filenames) {
          this.metadataByFilename.delete(filename)
          const date = Date.now()
          this.journal.push({ event: 'del', filename, vmUuid: VM, date, _filename: journalEntryPath(date) })
        }
      },
      listAllVmBackups: async () => {
        this.nListings++
        return { [VM]: [...this.metadataByFilename.values()] }
      },
      readBackupJournalEvents: async cursor => {
        const entries = cursor === undefined ? this.journal.slice() : this.journal.filter(_ => _._filename > cursor)
        if (entries.length > 0) {
          cursor = entries[entries.length - 1]._filename
        }
        return {
          cursor,
          events: entries.map(({ event, filename, vmUuid }) => {
            const metadata = this.metadataByFilename.get(filename)
            // a backup which is gone is reported as deleted, whatever its last event says
            return metadata === undefined ? { event: 'del', vmUuid, filename } : { event, vmUuid, filename, metadata }
          }),
        }
      },
    }
  }
}

// instantiates the mixin with the minimum an `Xo` app provides to it
const createBackupNgWithRepository = repository => {
  const app = {
    config: { getDuration: () => LISTING_DEBOUNCE },
    getBackupsRemoteAdapter: () => new Disposable(() => {}, repository.adapter),
    getRemoteWithCredentials: async id => {
      assert.equal(id, REMOTE_ID)
      return { id: REMOTE_ID, url: 'file:///media/backup' }
    },
    hooks: { on() {} },
  }
  return new BackupNg(app)
}

const PROXY_ID = 'a-proxy-id'

// serves the same in-memory repository through the RPCs a proxy exposes
const createBackupNgWithProxiedRepository = (repository, { journal = true, failsToList = false } = {}) => {
  const adapter = repository.adapter
  const app = {
    config: { getDuration: () => LISTING_DEBOUNCE },
    getRemoteWithCredentials: async id => {
      assert.equal(id, REMOTE_ID)
      return { id: REMOTE_ID, url: 'file:///media/backup', proxy: PROXY_ID }
    },
    callProxyMethod: async (proxyId, method, params) => {
      assert.equal(proxyId, PROXY_ID)

      if (method === 'backup.listVmBackups') {
        // the proxy omits the repositories it failed to list
        return failsToList ? {} : { [REMOTE_ID]: formatVmBackups(await adapter.listAllVmBackups(), REMOTE_ID) }
      }

      if (method === 'backup.listVmBackupsJournal') {
        if (!journal) {
          throw { code: -32601, message: `method not found: ${method}`, data: method } // eslint-disable-line no-throw-literal
        }
        const { events, cursor } = await adapter.readBackupJournalEvents(params.cursor, { mustExist: params.mustExist })
        return { events: formatJournalEvents(events, REMOTE_ID), cursor }
      }

      if (method === 'backup.deleteVmBackups') {
        return adapter.deleteVmBackups(params.filenames)
      }

      throw new Error(`unexpected proxy method ${method}`)
    },
    hooks: { on() {} },
  }
  return new BackupNg(app)
}

const idsOf = backupsByVmByRemote => backupsByVmByRemote[REMOTE_ID][VM].map(_ => _.id)

describe('deleteVmBackupsNg', () => {
  it('makes the deletion visible at once, without listing the repository again', async () => {
    const repository = new Repository([metadataOf('20260811T090000'), metadataOf('20260811T093000')])
    const backupNg = createBackupNgWithRepository(repository)

    assert.deepEqual(idsOf(await backupNg.listVmBackupsNg([REMOTE_ID])), [
      `${REMOTE_ID}/${filenameOf('20260811T090000')}`,
      `${REMOTE_ID}/${filenameOf('20260811T093000')}`,
    ])

    await backupNg.deleteVmBackupsNg([`${REMOTE_ID}/${filenameOf('20260811T093000')}`])

    // the deletion is replayed from the journal, well before the end of the refresh window
    assert.deepEqual(idsOf(await backupNg.listVmBackupsNg([REMOTE_ID])), [
      `${REMOTE_ID}/${filenameOf('20260811T090000')}`,
    ])
    assert.equal(repository.nListings, 1)
  })
})

describe('on a repository attached to a proxy', () => {
  const idOf = name => `${REMOTE_ID}/${filenameOf(name)}`

  it('makes a deletion visible at once, without listing the repository again', async () => {
    const repository = new Repository([metadataOf('20260811T090000'), metadataOf('20260811T093000')])
    const backupNg = createBackupNgWithProxiedRepository(repository)

    assert.deepEqual(idsOf(await backupNg.listVmBackupsNg([REMOTE_ID])), [
      idOf('20260811T090000'),
      idOf('20260811T093000'),
    ])

    await backupNg.deleteVmBackupsNg([idOf('20260811T093000')])

    // the deletion is replayed from the journal the proxy exposes, well before the end of the
    // refresh window
    assert.deepEqual(idsOf(await backupNg.listVmBackupsNg([REMOTE_ID])), [idOf('20260811T090000')])
    assert.equal(repository.nListings, 1)
  })

  it('lists a proxy which does not expose its journal again, instead of failing', async () => {
    const repository = new Repository([metadataOf('20260811T090000')])
    const backupNg = createBackupNgWithProxiedRepository(repository, { journal: false })

    assert.deepEqual(idsOf(await backupNg.listVmBackupsNg([REMOTE_ID])), [idOf('20260811T090000')])
    assert.equal(repository.nListings, 1)

    await backupNg.deleteVmBackupsNg([idOf('20260811T090000')])

    // the journal cannot be read, so the repository is listed again rather than reported as failing
    assert.deepEqual(await backupNg.listVmBackupsNg([REMOTE_ID]), { [REMOTE_ID]: { [VM]: [] } })
    assert.equal(repository.nListings, 2)
  })

  it('reports a repository the proxy could not read as failing, and forgets it', async () => {
    const repository = new Repository([metadataOf('20260811T090000')])
    const backupNg = createBackupNgWithProxiedRepository(repository, { failsToList: true })

    assert.deepEqual(await backupNg.listVmBackupsNg([REMOTE_ID]), { [REMOTE_ID]: null })
    assert.equal(backupNg._backupsListingRetry[REMOTE_ID].attempt, 1)
  })
})

describe('invalidateVmBackupsListing() on a cached repository', () => {
  it('makes the next listing read the repository from scratch', async () => {
    const repository = new Repository([metadataOf('20260811T090000')])
    const backupNg = createBackupNgWithRepository(repository)

    await backupNg.listVmBackupsNg([REMOTE_ID])
    assert.equal(repository.nListings, 1)

    // as the `remotes` mixin does when the repository is gone or has been reconfigured
    backupNg.invalidateVmBackupsListing(REMOTE_ID)

    await backupNg.listVmBackupsNg([REMOTE_ID])
    assert.equal(repository.nListings, 2)
  })
})
