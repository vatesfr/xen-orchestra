import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatVmBackupAt } from '@xen-orchestra/backups/formatVmBackups.mjs'
import { resolve } from 'node:path'

import { BACKUP_JOURNAL_DIR, formatJournalDay, formatJournalTime } from '@xen-orchestra/backups/_backupJournal.mjs'

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

const enoent = () => Object.assign(new Error('ENOENT'), { code: 'ENOENT' })

// a real, sortable path, like the one a real journal entry would get: the cursor bootstrapped by
// `#build()` is in this same day/time format, and comparisons between the two must make sense
let journalSeq = 0
const journalEntryPath = date =>
  `/${BACKUP_JOURNAL_DIR}/${formatJournalDay(date)}/${formatJournalTime(date)}-${String(journalSeq++).padStart(6, '0')}`

// mock of the `VmBackupsSource` the cache reads its repositories through
class Repository {
  metadataByFilename = new Map()
  journal = []
  journalDirMissing = false

  nListings = 0
  nOneVmListings = 0
  nJournalReads = 0

  failWith

  // set to make the source report that it cannot replay this repository
  cannotReplay = false

  constructor(metadata = []) {
    metadata.forEach(_ => this.metadataByFilename.set(_._filename, _))
  }

  // records an event as `RemoteAdapter` would have, i.e. after the mutation
  add(metadata, timestamp) {
    this.metadataByFilename.set(metadata._filename, metadata)
    this.pushEvent('add', metadata._filename, metadata.vm.uuid, timestamp)
  }

  // journaled without the leading slash, to check the entry is keyed by the normalized name
  change(metadata, timestamp) {
    this.metadataByFilename.set(metadata._filename, metadata)
    this.pushEvent('change', metadata._filename.slice(1), metadata.vm.uuid, timestamp)
  }

  del(metadata, timestamp) {
    this.metadataByFilename.delete(metadata._filename)
    this.pushEvent('del', metadata._filename, metadata.vm.uuid, timestamp)
  }

  // appends a journal entry with a real, sortable `_filename`; `add()`/`change()`/`del()` cover the
  // usual cases, this is for the tests which need an event they cannot express, e.g. an unsupported
  // one or a `change` without a prior write
  pushEvent(event, filename, vmUuid, timestamp) {
    this.journal.push({ event, filename, vmUuid, date: timestamp, _filename: journalEntryPath(timestamp) })
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

        const backupsByVm = {}
        for (const metadata of this.metadataByFilename.values()) {
          const backup = this.#format(metadata)
          ;(backupsByVm[metadata.vm.uuid] ??= {})[backup.id] = backup
        }
        return backupsByVm
      },
      listOneVm: async (repository, vmUuid) => {
        this.#mayFail()
        this.nOneVmListings++
        return this.#backupsOf([...this.metadataByFilename.values()].filter(_ => _.vm.uuid === vmUuid))
      },
      readJournal: async (repository, cursor, { mustExist = false } = {}) => {
        this.#mayFail()
        this.nJournalReads++

        if (this.cannotReplay) {
          return undefined
        }

        if (this.journalDirMissing) {
          if (mustExist) {
            throw enoent()
          }
          return { events: [], cursor }
        }

        const entries = cursor === undefined ? this.journal.slice() : this.journal.filter(_ => _._filename > cursor)
        if (entries.length > 0) {
          cursor = entries[entries.length - 1]._filename
        }

        // `VmBackupsSource` hands the cache the current value of each backup an event is about, or
        // nothing at all when the backup is gone
        const events = entries.map(({ filename, vmUuid }) => {
          const key = resolve('/', filename)
          const metadata = this.metadataByFilename.get(key)
          return metadata === undefined
            ? { vmUuid, filename: key }
            : { vmUuid, filename: key, backup: this.#format(metadata) }
        })
        return { events, cursor }
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

  it('tolerates a journal directory which has never existed', async t => {
    mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 0 })

    repository.journalDirMissing = true
    await cache.get(REPOSITORY)
    // a repository which is never written to keeps replaying a journal directory which never gets
    // created, this must stay tolerated however many times it is read
    await cache.get(REPOSITORY)
    await cache.get(REPOSITORY)

    assert.equal(repository.nListings, 1)
  })

  it('forces a rebuild when the journal directory disappears after an entry has been read from it', async t => {
    const { tick } = mockTime(t, Date.parse('2026-08-11T10:00:00Z'))
    const repository = new Repository([metadataOf(VM, '20260811T090000')])
    const cache = new VmBackupsCache(repository.source, { minRefreshDelay: 0 })

    await cache.get(REPOSITORY)
    tick(60e3)
    repository.add(metadataOf(OTHER_VM, '20260811T100000'), Date.now())
    await cache.get(REPOSITORY) // replays the `add`, confirming the journal directory exists

    repository.journalDirMissing = true
    await assert.rejects(cache.get(REPOSITORY), /ENOENT/)

    // the listing is not served anymore, the next read starts from scratch
    repository.journalDirMissing = false
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
