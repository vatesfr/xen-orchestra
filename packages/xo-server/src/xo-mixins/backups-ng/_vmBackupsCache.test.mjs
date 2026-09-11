import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatVmBackupAt } from '@xen-orchestra/backups/formatVmBackups.mjs'
import { resolve } from 'node:path'

import { serveVmBackups, VmBackupsCache } from './_vmBackupsCache.mjs'

const REPOSITORY = { id: 'repository' }
const VM = 'a-vm-uuid'
const OTHER_VM = 'another-vm-uuid'

// `RemoteAdapter` lists and writes the metadata with a leading slash
const filenameOf = (vmUuid, name) => `/xo-vm-backups/${vmUuid}/${name}.json`

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

// mock of the `VmBackupsSource` the cache reads its repositories through
class Repository {
  metadataByFilename = new Map()
  journal = []

  nListings = 0
  nOneVmListings = 0
  nJournalReads = 0
  journalReadsSince = []

  failWith

  // the watermarks are stamped by whoever reads the journal, which is not necessarily this process
  clockSkew = 0

  // set to make the source report that it cannot replay this repository
  cannotReplay = false

  constructor(metadata = []) {
    metadata.forEach(_ => this.metadataByFilename.set(_._filename, _))
  }

  // records an event as `RemoteAdapter` would have, i.e. after the mutation
  add(metadata, timestamp) {
    this.metadataByFilename.set(metadata._filename, metadata)
    this.journal.push({ event: 'add', filename: metadata._filename, vmUuid: metadata.vm.uuid, date: timestamp })
  }

  // journaled without the leading slash, to check the entry is keyed by the normalized name
  change(metadata, timestamp) {
    this.metadataByFilename.set(metadata._filename, metadata)
    this.journal.push({
      event: 'change',
      filename: metadata._filename.slice(1),
      vmUuid: metadata.vm.uuid,
      date: timestamp,
    })
  }

  del(metadata, timestamp) {
    this.metadataByFilename.delete(metadata._filename)
    this.journal.push({ event: 'del', filename: metadata._filename, vmUuid: metadata.vm.uuid, date: timestamp })
  }

  #format(metadata) {
    return formatVmBackupAt(metadata, metadata._filename, REPOSITORY.id)
  }

  // the backups of a VM, keyed the way the cache stores them
  #backupsOf(metadata) {
    const result = {}
    for (const backup of metadata.map(_ => this.#format(_))) {
      result[backup.id] = backup
    }
    return result
  }

  get source() {
    return {
      listAll: async repository => {
        assert.equal(repository.id, REPOSITORY.id)
        this.#mayFail()
        this.nListings++

        const lastJournalRead = Date.now() + this.clockSkew
        const backupsByVm = {}
        for (const metadata of this.metadataByFilename.values()) {
          const backup = this.#format(metadata)
          ;(backupsByVm[metadata.vm.uuid] ??= {})[backup.id] = backup
        }
        return { backupsByVm, lastJournalRead }
      },
      listOneVm: async (repository, vmUuid) => {
        this.#mayFail()
        this.nOneVmListings++
        return this.#backupsOf([...this.metadataByFilename.values()].filter(_ => _.vm.uuid === vmUuid))
      },
      readJournal: async (repository, since) => {
        this.#mayFail()
        this.nJournalReads++

        if (this.cannotReplay) {
          return undefined
        }

        this.journalReadsSince.push(since)
        const lastJournalRead = Date.now() + this.clockSkew

        // `VmBackupsSource` hands the cache the current value of each backup an event is about, or
        // nothing at all when the backup is gone
        const events = this.journal
          .filter(_ => _.date > since)
          .map(({ filename, vmUuid }) => {
            const key = resolve('/', filename)
            const metadata = this.metadataByFilename.get(key)
            return metadata === undefined
              ? { vmUuid, filename: key }
              : { vmUuid, filename: key, backup: this.#format(metadata) }
          })
        return { events, lastJournalRead }
      },
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
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

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
    const cache = new VmBackupsCache(repository.source)

    const results = await Promise.all([cache.get(REPOSITORY), cache.get(REPOSITORY), cache.get(REPOSITORY)])

    assert.equal(repository.nListings, 1)
    results.forEach(result => assert.equal(result, results[0]))
  })

  it('replays the journal instead of listing the repository again', async t => {
    const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const kept = metadataOf(VM, '20260811T090000')
    const removed = metadataOf(VM, '20260811T093000')
    const repository = new Repository([kept, removed])
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

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
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    tick(60e3)

    repository.change({ ...metadata, size: 42 }, Date.now())
    repository.del(repository.metadataByFilename.get(filenameOf(OTHER_VM, '20260811T093000')), Date.now())

    const backups = await cache.get(REPOSITORY)

    assert.equal(backups[VM][metadata._filename].size, 42)
    assert.equal(backups[OTHER_VM], undefined)
  })

  it('keys the entry by the normalized filename, so a replayed event hits the backup the listing built', async t => {
    const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const metadata = metadataOf(VM, '20260811T090000')
    const repository = new Repository([metadata])
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

    const built = await cache.get(REPOSITORY)
    assert.deepEqual(Object.keys(built[VM]), [metadata._filename])
    assert.equal(built[VM][metadata._filename].id, metadata._filename)

    tick(60e3)
    repository.del(metadata, Date.now())

    assert.deepEqual(await cache.get(REPOSITORY), {})
  })

  it('ignores an event about a backup it does not hold', async t => {
    const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    tick(60e3)

    // added then deleted between two reads: the source reports a backup which is already gone
    const transient = metadataOf(VM, '20260811T100000')
    repository.add(transient, Date.now())
    repository.del(transient, Date.now())

    const backups = await cache.get(REPOSITORY)

    assert.deepEqual(filenames(backups), [filenameOf(VM, '20260811T090000')])
  })

  it('replays the events of the previous minutes, to tolerate the clock skew of the writers', async t => {
    const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

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
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

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
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    tick(120e3)
    await cache.get(REPOSITORY)

    assert.equal(repository.nListings, 2)
    assert.equal(repository.nJournalReads, 0)
  })

  it('rebuilds when the remote is re-pointed or reconfigured', async t => {
    mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

    await cache.get({ ...REPOSITORY, url: 'nfs://old', options: 'an-option' })
    assert.equal(repository.nListings, 1)

    // same remote id, another repository: its journal says nothing about the backups the entry holds
    await cache.get({ ...REPOSITORY, url: 'nfs://new', options: 'an-option' })
    assert.equal(repository.nListings, 2)

    await cache.get({ ...REPOSITORY, url: 'nfs://new', options: 'another-option' })
    assert.equal(repository.nListings, 3)

    // moved to a proxy: same url, same options, but not read the same way anymore
    await cache.get({ ...REPOSITORY, url: 'nfs://new', options: 'another-option', proxy: 'a-proxy-id' })
    assert.equal(repository.nListings, 4)

    // unchanged: still served from the entry, without even reading the journal
    await cache.get({ ...REPOSITORY, url: 'nfs://new', options: 'another-option', proxy: 'a-proxy-id' })
    assert.equal(repository.nListings, 4)
    assert.equal(repository.nJournalReads, 0)
  })

  it('refresh() replays before the end of the refresh window', async t => {
    mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

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
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    cache.delete(REPOSITORY.id)
    await cache.get(REPOSITORY)

    assert.equal(repository.nListings, 2)
    assert.equal(repository.nJournalReads, 0)
  })

  it('reads the journal from the watermark of the source, not from its own clock', async t => {
    const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    repository.clockSkew = 30e3
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    const listedAt = Date.now() + repository.clockSkew
    tick(60e3)
    await cache.get(REPOSITORY)

    assert.deepEqual(repository.journalReadsSince, [listedAt - 5 * 60e3])
  })

  it('refreshes on its own clock, whatever the clock of the source', async t => {
    // a source whose watermarks are ahead would otherwise never look stale enough to be replayed,
    // and one whose watermarks are behind would be replayed on every single call
    for (const clockSkew of [30 * 60e3, -30 * 60e3]) {
      const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
      const repository = new Repository([metadataOf(VM, '20260811T090000')])
      repository.clockSkew = clockSkew
      const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

      await cache.get(REPOSITORY)

      // inside the refresh window: served from the entry
      tick(30e3)
      await cache.get(REPOSITORY)
      assert.equal(repository.nJournalReads, 0, `replayed too early with a skew of ${clockSkew}ms`)

      // past it
      tick(30e3)
      await cache.get(REPOSITORY)
      assert.equal(repository.nJournalReads, 1, `not replayed with a skew of ${clockSkew}ms`)

      t.mock.timers.reset()
    }
  })

  it('rebuilds on its own clock, whatever the clock of the source', async t => {
    // a source whose watermarks are a day off would otherwise look like it crossed a UTC day on
    // every call, and be listed in full forever
    const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    repository.clockSkew = 24 * 60 * 60e3
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    tick(60e3)
    await cache.get(REPOSITORY)

    assert.equal(repository.nListings, 1)
    assert.equal(repository.nJournalReads, 1)
  })

  it('lists the repository again when the source cannot replay it', async t => {
    const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    repository.cannotReplay = true
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

    await cache.get(REPOSITORY)
    tick(60e3)

    const added = metadataOf(VM, '20260811T100000')
    repository.add(added, Date.now())

    const backups = await cache.get(REPOSITORY)

    assert.equal(repository.nListings, 2)
    assert.ok(filenames(backups).includes(added._filename))

    // the entry was not purged: it is still served for the rest of the window
    tick(30e3)
    await cache.get(REPOSITORY)
    assert.equal(repository.nListings, 2)
  })

  it('forgets a repository which cannot be read anymore', async t => {
    mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 0 })

    await cache.get(REPOSITORY)

    repository.failWith = new Error('repository is offline')
    await assert.rejects(cache.get(REPOSITORY), /offline/)

    // the listing is not served anymore, the next read starts from scratch
    repository.failWith = undefined
    await cache.get(REPOSITORY)
    assert.equal(repository.nListings, 2)
  })

  describe('getOneVm()', () => {
    it('lists a single VM instead of the whole repository on a cold entry', async t => {
      mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
      const repository = new Repository([metadataOf(VM, '20260811T090000'), metadataOf(OTHER_VM, '20260811T093000')])
      const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

      const backups = await cache.getOneVm(REPOSITORY, VM)

      assert.deepEqual(filenames(backups), [filenameOf(VM, '20260811T090000')])
      assert.equal(repository.nOneVmListings, 1, 'the answer must come from a single-VM listing')
    })

    it('returns no entry for a VM without backups', async t => {
      mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
      const repository = new Repository([metadataOf(OTHER_VM, '20260811T093000')])
      const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

      assert.deepEqual(await cache.getOneVm(REPOSITORY, VM), {})
    })

    it('warms the whole entry in the background, for the callers which want every VM', async t => {
      mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
      const repository = new Repository([metadataOf(VM, '20260811T090000'), metadataOf(OTHER_VM, '20260811T093000')])
      const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

      await cache.getOneVm(REPOSITORY, VM)
      const backups = await cache.get(REPOSITORY)

      assert.equal(repository.nListings, 1)
      assert.deepEqual(
        filenames(backups).sort(),
        [filenameOf(VM, '20260811T090000'), filenameOf(OTHER_VM, '20260811T093000')].sort()
      )

      // the background build already served every VM: no need to list again
      await cache.get(REPOSITORY)
      assert.equal(repository.nListings, 1)
    })

    it('reuses the entry instead of listing a single VM once it is built', async t => {
      mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
      const repository = new Repository([metadataOf(VM, '20260811T090000')])
      const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

      await cache.get(REPOSITORY)
      const backups = await cache.getOneVm(REPOSITORY, VM)

      assert.deepEqual(filenames(backups), [filenameOf(VM, '20260811T090000')])
      assert.equal(repository.nOneVmListings, 0)
    })

    it('reuses an ongoing build instead of listing a single VM again', async t => {
      mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
      const repository = new Repository([metadataOf(VM, '20260811T090000')])
      const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 60e3 })

      const [, backups] = await Promise.all([cache.get(REPOSITORY), cache.getOneVm(REPOSITORY, VM)])

      assert.deepEqual(filenames(backups), [filenameOf(VM, '20260811T090000')])
      assert.equal(repository.nListings, 1)
      assert.equal(repository.nOneVmListings, 0)
    })
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
})
