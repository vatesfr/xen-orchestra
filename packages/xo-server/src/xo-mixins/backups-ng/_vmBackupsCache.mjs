// @ts-check

import { compareTimestamp } from '@xen-orchestra/backups/RemoteAdapter.mjs'
import { createLogger } from '@xen-orchestra/log'

/**
 * A backup repository, as required by `VmBackupsCache`.
 *
 * @typedef {object} Repository
 * @property {string} id
 * @property {string} url
 * @property {object} [options]
 * @property {string} [proxy] id of the proxy this repository is attached to, if any
 */

/**
 * A backup, as formatted by `formatVmBackup()`.
 *
 * @typedef {object} FormattedBackup
 * @property {string} id
 */

/**
 * The backups of a VM, keyed by the name of their metadata.
 *
 * @typedef {Record<string, FormattedBackup>} Backups
 */

/**
 * The formatted backups of a repository, keyed by VM UUID then metadata filename.
 *
 * @typedef {Record<string, Backups>} BackupsByVm
 */

/**
 * What happened to a backup since the previous read, as the source reports it: `backup` is its
 * current value, or `undefined` when it is gone.
 *
 * @typedef {object} JournalEvent
 * @property {string} vmUuid
 * @property {string} filename name of the metadata, as the listing keys it
 * @property {FormattedBackup} [backup]
 */

/**
 * @typedef {object} JournalRead
 * @property {JournalEvent[]} events
 * @property {number} lastJournalRead watermark to pass as `since` on the next read
 */

/**
 * Reads the backups of a repository. See `VmBackupsSource`.
 *
 * @typedef {object} Source
 * @property {(repository: Repository) => Promise<{ backupsByVm: BackupsByVm, lastJournalRead: number }>} listAll
 * @property {(repository: Repository, vmUuid: string) => Promise<Backups>} listOneVm
 * @property {(repository: Repository, since: number) => Promise<JournalRead | undefined>} readJournal
 */

/**
 * @typedef {object} Entry
 * @property {BackupsByVm} backupsByVm
 * @property {number} lastJournalRead opaque watermark owned by the source, only ever passed back to
 * it as `since`: it is stamped by the process which reads the journal, which is not necessarily
 * this one, and must therefore never be compared with this process' clock
 * @property {object} [options]
 * @property {string} [proxy]
 * @property {number} refreshedAt when this process last brought the entry up to date, i.e. the only
 * field which may be compared with its clock
 * @property {boolean} stale
 * @property {string} url
 */

const { debug } = createLogger('xo:xo-mixins:backups-ng:vmBackupsCache')

// Journal entries are stamped with the clock of the process which wrote them, which is not
// necessarily this one: read a bit before the watermark of the previous read.
//
// Replaying an entry twice is harmless: `add`/`change` are upserts and `del` is an idempotent
// removal.
const CLOCK_SKEW_TOLERANCE = 5 * 60 * 1e3

const MS_PER_DAY = 24 * 60 * 60 * 1e3

const utcDay = timestamp => Math.floor(timestamp / MS_PER_DAY)

/**
 * @param {Entry} entry
 * @param {Repository} repository
 * @returns {boolean}
 */
const isSameRepository = (entry, repository) =>
  entry.url === repository.url && entry.options === repository.options && entry.proxy === repository.proxy

/**
 * forgets a backup, and the VM it belonged to when it was its last one
 *
 * @param {BackupsByVm} backupsByVm
 * @param {string} vmUuid
 * @param {string} key
 * @returns {void}
 */
const removeBackup = (backupsByVm, vmUuid, key) => {
  const backups = backupsByVm[vmUuid]
  if (backups === undefined) {
    return
  }

  delete backups[key]
  if (Object.keys(backups).length === 0) {
    // `RemoteAdapter#listAllVmBackups` skips the VMs without backups
    delete backupsByVm[vmUuid]
  }
}

/**
 * Turns the backups of a repository into the shape expected by the API:
 * `{ [vmUuid]: <backups sorted by timestamp> }`, restricted to `vmId` when it is given.
 *
 * @param {BackupsByVm} backupsByVm
 * @param {string} remoteId
 * @param {string} [vmId]
 * @returns {Record<string, FormattedBackup[]>}
 */
export function serveVmBackups(backupsByVm, remoteId, vmId) {
  /** @type {Record<string, FormattedBackup[]>} */
  const result = {}
  for (const vmUuid of vmId === undefined ? Object.keys(backupsByVm) : [vmId]) {
    const backups = backupsByVm[vmUuid]
    result[vmUuid] =
      backups === undefined
        ? []
        : Object.values(backups)
            // inject the remote id on the backup which is needed for importVmBackupNg()
            .map(backup => ({ ...backup, id: `${remoteId}/${backup.id}` }))
            .sort(compareTimestamp)
  }
  return result
}

/**
 * In-memory listing of the VM backups of the backup repositories, as
 * `{ [vmUuid]: { [metadataFilename]: <formatted backup> } }`.
 *
 * Listing a repository costs one directory listing and one metadata read per VM, which is expensive
 * on object storages, and cannot be cached on the repository itself when it is immutable. Instead of
 * re-listing it, an entry is brought up to date by replaying the events its journal recorded since
 * the previous read (see `@xen-orchestra/backups/_backupJournal.mjs`).
 *
 * How a repository is read is `VmBackupsSource`'s business: this class only decides *when* to list
 * it, when to replay it, and what to serve in the meantime.
 *
 * Entries are rebuilt from scratch when they cross a UTC day, which bounds the drift accumulated
 * from the events which could not be journaled, or which are not journaled at all (e.g. the
 * `immutable-backups` daemon lifting the immutability of a backup), when the remote is re-pointed,
 * reconfigured or moved to another proxy, which the entry detects by itself from what it was built
 * from, and when the source turns out not to be able to replay the repository at all.
 */
export class VmBackupsCache {
  // repository id → { backupsByVm, lastJournalRead, options, proxy, refreshedAt, stale, url }
  /** @type {Map<string, Entry>} */
  #entries = new Map()

  /** @type {number} */
  #minRefreshDelay

  // repository id → promise of the ongoing build or replay, to coalesce concurrent listings
  /** @type {Map<string, Promise<BackupsByVm>>} */
  #pending = new Map()

  /** @type {Source} */
  #source

  /**
   * @param {Source} source
   * @param {object} [options]
   * @param {number} [options.minRefreshDelay] minimum delay between two journal reads of the same
   * repository, in milliseconds
   */
  constructor(source, { minRefreshDelay = 0 } = {}) {
    this.#source = source
    this.#minRefreshDelay = minRefreshDelay
  }

  /**
   * Forgets a repository: the next listing will rebuild its entry from scratch.
   *
   * To call when the repository itself is gone or has been reconfigured, or when the caller has a
   * reason to distrust the journal.
   *
   * @param {Repository['id']} repositoryId
   * @returns {void}
   */
  delete(repositoryId) {
    if (this.#entries.delete(repositoryId)) {
      debug('entry deleted', { repositoryId })
    }
  }

  /**
   * Marks a repository as stale: the next listing will replay its journal instead of waiting for the
   * end of the current refresh window.
   *
   * To call after a mutation triggered by this process, so that its effect is visible at once.
   *
   * @param {Repository['id']} repositoryId
   * @returns {void}
   */
  refresh(repositoryId) {
    const entry = this.#entries.get(repositoryId)
    if (entry !== undefined) {
      entry.stale = true
    }
  }

  /**
   * Returns the up-to-date backups of a repository.
   *
   * The returned value is the cache itself: it must not be mutated by the caller.
   *
   * @param {Repository} repository
   * @returns {Promise<BackupsByVm>}
   */
  async get(repository) {
    const { id } = repository

    let pending = this.#pending.get(id)
    if (pending === undefined) {
      pending = this.#refresh(repository).finally(() => {
        this.#pending.delete(id)
      })
      this.#pending.set(id, pending)
    }
    return pending
  }

  /**
   * @param {Repository} repository
   * @returns {Promise<BackupsByVm>}
   */
  async #refresh(repository) {
    const { id } = repository
    const entry = this.#entries.get(id)
    const now = Date.now()

    try {
      if (entry === undefined || !isSameRepository(entry, repository) || utcDay(entry.refreshedAt) !== utcDay(now)) {
        return await this.#build(repository)
      }

      if (
        (entry.stale || now - entry.refreshedAt >= this.#minRefreshDelay) &&
        !(await this.#replay(repository, entry))
      ) {
        // the source cannot replay this repository, e.g. it is attached to a proxy which does not
        // expose its journal: the only way to bring the entry up to date is to list it again
        return await this.#build(repository)
      }

      return entry.backupsByVm
    } catch (error) {
      // the repository is probably unreachable: don't keep serving a listing which cannot be
      // refreshed anymore
      this.delete(id)
      throw error
    }
  }

  /**
   * Returns the up-to-date backups of a single VM, without paying for a listing of every VM on
   * the repository when the entry is still cold.
   *
   * Delegates to `get()` whenever an entry already exists or is being built or replayed, since a
   * dedicated read would not save anything there; otherwise reads just this VM and lets `get()`
   * build the full entry in the background, for the callers which do want every VM.
   *
   * @param {Repository} repository
   * @param {string} vmUuid
   * @returns {Promise<BackupsByVm>}
   */
  async getOneVm(repository, vmUuid) {
    const { id } = repository

    if (this.#entries.has(id) || this.#pending.has(id)) {
      const backupsByVm = await this.get(repository)
      return backupsByVm[vmUuid] === undefined ? {} : { [vmUuid]: backupsByVm[vmUuid] }
    }

    const backups = await this.#source.listOneVm(repository, vmUuid)

    // warms the entry in the background for the callers which want every VM
    this.get(repository).catch(() => {})

    // `RemoteAdapter#listAllVmBackups` skips the VMs without backups
    return Object.keys(backups).length === 0 ? {} : { [vmUuid]: backups }
  }

  /**
   * @param {Repository} repository
   * @returns {Promise<BackupsByVm>}
   */
  async #build(repository) {
    const { id } = repository

    const entry = {
      backupsByVm: undefined,
      lastJournalRead: undefined,
      options: repository.options,
      proxy: repository.proxy,
      refreshedAt: Date.now(),
      stale: false,
      url: repository.url,
    }

    // registered before the listing: if the entry is deleted while it is being built, it is not
    // resurrected, only this call sees the result
    this.#entries.set(id, entry)

    // the source takes the watermark before the listing, so that the events which happen during it
    // are replayed on the next read
    const { backupsByVm, lastJournalRead } = await this.#source.listAll(repository)

    debug('entry built', { repositoryId: id, nVms: Object.keys(backupsByVm).length })

    entry.backupsByVm = backupsByVm
    entry.lastJournalRead = lastJournalRead
    return backupsByVm
  }

  /**
   * @param {Repository} repository
   * @param {Entry} entry
   * @returns {Promise<boolean>} whether the entry could be brought up to date from the journal
   */
  async #replay(repository, entry) {
    const { backupsByVm } = entry

    const since = entry.lastJournalRead - CLOCK_SKEW_TOLERANCE

    // taken and cleared before the journal read, so that a mutation or a `refresh()` which happens
    // during it is not swallowed and the next listing replays again
    //
    // this is also why they are left as they are when the source turns out not to be replayable:
    // the rebuild which follows is at least as fresh as the replay would have been
    const refreshedAt = Date.now()
    entry.stale = false

    const read = await this.#source.readJournal(repository, since)
    if (read === undefined) {
      return false
    }

    // the source reduced the events to the last one of each backup, therefore they are independent
    // and the order they are applied in does not matter
    for (const { vmUuid, filename, backup } of read.events) {
      if (backup === undefined) {
        removeBackup(backupsByVm, vmUuid, filename)
      } else {
        ;(backupsByVm[vmUuid] ??= {})[filename] = backup
      }
    }

    entry.lastJournalRead = read.lastJournalRead
    entry.refreshedAt = refreshedAt

    debug('entry replayed', { repositoryId: repository.id, nEvents: read.events.length })

    return true
  }
}
