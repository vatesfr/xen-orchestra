import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { serveVmBackups, VmBackupsCache } from './_vmBackupsCache.mjs'

const REPOSITORY = { id: 'repository' }
const VM = 'a-vm-uuid'
const OTHER_VM = 'another-vm-uuid'

const filenameOf = (vmUuid, name) => `xo-vm-backups/${vmUuid}/${name}.json`

const metadataOf = (vmUuid, name, props) => ({
  _filename: filenameOf(vmUuid, name),
  jobId: 'a-job-id',
  mode: 'full',
  scheduleId: 'a-schedule-id',
  size: 1,
  timestamp: Date.parse(`${name}Z`),
  vm: { uuid: vmUuid, name_label: 'a VM', name_description: '', tags: [] },
  ...props,
})

const enoent = () => Object.assign(new Error('ENOENT'), { code: 'ENOENT' })

// mock of the subset of `RemoteAdapter` used by `VmBackupsCache`
class Repository {
  metadataByFilename = new Map()
  journal = []

  nListings = 0
  nMetadataReads = 0
  nJournalReads = 0

  failWith

  constructor(metadata = []) {
    metadata.forEach(_ => this.metadataByFilename.set(_._filename, _))
  }

  // records an event as `RemoteAdapter` would have, i.e. after the mutation
  add(metadata, timestamp) {
    this.metadataByFilename.set(metadata._filename, metadata)
    this.journal.push({ event: 'add', filename: `/${metadata._filename}`, vmUuid: metadata.vm.uuid, date: timestamp })
  }

  change(metadata, timestamp) {
    this.metadataByFilename.set(metadata._filename, metadata)
    this.journal.push({ event: 'change', filename: metadata._filename, vmUuid: metadata.vm.uuid, date: timestamp })
  }

  del(metadata, timestamp) {
    this.metadataByFilename.delete(metadata._filename)
    this.journal.push({ event: 'del', filename: metadata._filename, vmUuid: metadata.vm.uuid, date: timestamp })
  }

  get adapter() {
    return {
      listAllVmBackups: async () => {
        this.#mayFail()
        this.nListings++
        const result = {}
        for (const metadata of this.metadataByFilename.values()) {
          const vmUuid = metadata.vm.uuid
          ;(result[vmUuid] ??= []).push(metadata)
        }
        return result
      },
      readVmBackupMetadata: async path => {
        this.#mayFail()
        this.nMetadataReads++
        const metadata = this.metadataByFilename.get(path)
        if (metadata === undefined) {
          throw enoent()
        }
        return metadata
      },
      readBackupJournal: async since => {
        this.#mayFail()
        this.nJournalReads++
        return this.journal.filter(_ => _.date > since)
      },
    }
  }

  get useAdapter() {
    return (repository, fn) => {
      assert.equal(repository.id, REPOSITORY.id)
      return fn(this.adapter)
    }
  }

  #mayFail() {
    if (this.failWith !== undefined) {
      throw this.failWith
    }
  }
}

const filenames = backupsByVm => Object.values(backupsByVm).flatMap(backups => Object.keys(backups))

// `Date` is mocked in most tests: the cache decides to rebuild or to replay from the current time
const mockTime = (t, now) => {
  t.mock.timers.enable({ apis: ['Date'], now })
  return {
    tick: ms => t.mock.timers.tick(ms),
  }
}

describe('VmBackupsCache', () => {
  it('lists the repository on the first call and serves the cache afterwards', async t => {
    mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.useAdapter, { minRefreshDelay: 60e3 })

    const backups = await cache.get(REPOSITORY)
    assert.deepEqual(filenames(backups), [filenameOf(VM, '20260811T090000')])
    assert.equal(repository.nListings, 1)

    await cache.get(REPOSITORY)
    assert.equal(repository.nListings, 1)
    assert.equal(repository.nJournalReads, 0)
  })

  it('coalesces concurrent calls', async t => {
    mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.useAdapter)

    const results = await Promise.all([cache.get(REPOSITORY), cache.get(REPOSITORY), cache.get(REPOSITORY)])

    assert.equal(repository.nListings, 1)
    results.forEach(result => assert.equal(result, results[0]))
  })

  it('replays the journal instead of listing the repository again', async t => {
    const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const kept = metadataOf(VM, '20260811T090000')
    const removed = metadataOf(VM, '20260811T093000')
    const repository = new Repository([kept, removed])
    const cache = new VmBackupsCache(repository.useAdapter, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    tick(60e3)

    const added = metadataOf(OTHER_VM, '20260811T100000')
    repository.add(added, Date.now())
    repository.del(removed, Date.now())

    const backups = await cache.get(REPOSITORY)

    assert.equal(repository.nListings, 1)
    assert.equal(repository.nJournalReads, 1)
    assert.deepEqual(filenames(backups).sort(), [kept._filename, added._filename].sort())
  })

  it('updates a backup changed in place and forgets a VM without backups', async t => {
    const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const metadata = metadataOf(VM, '20260811T090000')
    const repository = new Repository([metadata, metadataOf(OTHER_VM, '20260811T093000')])
    const cache = new VmBackupsCache(repository.useAdapter, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    tick(60e3)

    repository.change({ ...metadata, size: 42 }, Date.now())
    repository.del(repository.metadataByFilename.get(filenameOf(OTHER_VM, '20260811T093000')), Date.now())

    const backups = await cache.get(REPOSITORY)

    assert.equal(backups[VM][metadata._filename].size, 42)
    assert.equal(backups[OTHER_VM], undefined)
  })

  it('ignores an event on a missing backup and an unsupported event', async t => {
    const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.useAdapter, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    tick(60e3)

    // added then deleted between two reads
    const transient = metadataOf(VM, '20260811T100000')
    repository.add(transient, Date.now())
    repository.del(transient, Date.now())
    repository.journal.push({ event: 'from-a-future-version', filename: 'whatever', vmUuid: VM, date: Date.now() })

    const backups = await cache.get(REPOSITORY)

    assert.deepEqual(filenames(backups), [filenameOf(VM, '20260811T090000')])
  })

  it('replays the events of the previous minutes, to tolerate the clock skew of the writers', async t => {
    const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.useAdapter, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    const listedAt = Date.now()
    tick(60e3)

    // stamped before the previous read by a writer whose clock is late
    const added = metadataOf(VM, '20260811T100000')
    repository.add(added, listedAt - 60e3)

    const backups = await cache.get(REPOSITORY)

    assert.ok(filenames(backups).includes(added._filename))
  })

  it('replays the events which happened since the previous read, however old they are', async t => {
    const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.useAdapter, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)

    // a job which ran long before the next read, i.e. more than `CLOCK_SKEW_TOLERANCE` ago
    tick(20 * 60e3)
    const added = metadataOf(VM, '20260811T102000')
    repository.add(added, Date.now())
    tick(30 * 60e3)

    const backups = await cache.get(REPOSITORY)

    assert.equal(repository.nListings, 1)
    assert.ok(filenames(backups).includes(added._filename))
  })

  it('rebuilds when the entry crosses a UTC day', async t => {
    const { tick } = mockTime(t, Date.parse('2026-08-11T23:59:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.useAdapter, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    tick(120e3)
    await cache.get(REPOSITORY)

    assert.equal(repository.nListings, 2)
    assert.equal(repository.nJournalReads, 0)
  })

  it('rebuilds when the remote is re-pointed or reconfigured', async t => {
    mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.useAdapter, { minRefreshDelay: 60e3 })

    await cache.get({ ...REPOSITORY, url: 'nfs://old', options: 'an-option' })
    assert.equal(repository.nListings, 1)

    // same remote id, another repository: its journal says nothing about the backups the entry holds
    await cache.get({ ...REPOSITORY, url: 'nfs://new', options: 'an-option' })
    assert.equal(repository.nListings, 2)

    await cache.get({ ...REPOSITORY, url: 'nfs://new', options: 'another-option' })
    assert.equal(repository.nListings, 3)

    // unchanged: still served from the entry, without even reading the journal
    await cache.get({ ...REPOSITORY, url: 'nfs://new', options: 'another-option' })
    assert.equal(repository.nListings, 3)
    assert.equal(repository.nJournalReads, 0)
  })

  it('refresh() replays before the end of the refresh window', async t => {
    mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.useAdapter, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    const added = metadataOf(VM, '20260811T100000')
    repository.add(added, Date.now())

    cache.refresh(REPOSITORY.id)
    const backups = await cache.get(REPOSITORY)

    assert.equal(repository.nListings, 1)
    assert.equal(repository.nJournalReads, 1)
    assert.ok(filenames(backups).includes(added._filename))
  })

  it('delete() forces a rebuild', async t => {
    mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.useAdapter, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    cache.delete(REPOSITORY.id)
    await cache.get(REPOSITORY)

    assert.equal(repository.nListings, 2)
    assert.equal(repository.nJournalReads, 0)
  })

  it('forgets a repository which cannot be read anymore', async t => {
    mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.useAdapter, { minRefreshDelay: 0 })

    await cache.get(REPOSITORY)

    repository.failWith = new Error('repository is offline')
    await assert.rejects(cache.get(REPOSITORY), /offline/)

    // the listing is not served anymore, the next read starts from scratch
    repository.failWith = undefined
    await cache.get(REPOSITORY)
    assert.equal(repository.nListings, 2)
  })
})

describe('serveVmBackups', () => {
  const cached = {
    [VM]: {
      [filenameOf(VM, 'b')]: { id: filenameOf(VM, 'b'), timestamp: 2 },
      [filenameOf(VM, 'a')]: { id: filenameOf(VM, 'a'), timestamp: 1 },
    },
    [OTHER_VM]: { [filenameOf(OTHER_VM, 'c')]: { id: filenameOf(OTHER_VM, 'c'), timestamp: 3 } },
  }

  it('prefixes the ids with the repository id and sorts the backups', () => {
    assert.deepEqual(serveVmBackups(cached, 'repository'), {
      [VM]: [
        { id: `repository/${filenameOf(VM, 'a')}`, timestamp: 1 },
        { id: `repository/${filenameOf(VM, 'b')}`, timestamp: 2 },
      ],
      [OTHER_VM]: [{ id: `repository/${filenameOf(OTHER_VM, 'c')}`, timestamp: 3 }],
    })
  })

  it('does not alter the cached backups', () => {
    serveVmBackups(cached, 'repository')
    assert.equal(cached[VM][filenameOf(VM, 'a')].id, filenameOf(VM, 'a'))
  })

  it('restricts the result to a VM', () => {
    assert.deepEqual(serveVmBackups(cached, 'repository', OTHER_VM), {
      [OTHER_VM]: [{ id: `repository/${filenameOf(OTHER_VM, 'c')}`, timestamp: 3 }],
    })
    assert.deepEqual(serveVmBackups(cached, 'repository', 'a-vm-without-backups'), { 'a-vm-without-backups': [] })
  })

  it('accepts the arrays of backups returned by a proxy', () => {
    assert.deepEqual(serveVmBackups({ [VM]: [{ id: filenameOf(VM, 'a'), timestamp: 1 }] }, 'repository'), {
      [VM]: [{ id: `repository/${filenameOf(VM, 'a')}`, timestamp: 1 }],
    })
  })
})
