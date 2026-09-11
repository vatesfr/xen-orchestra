// @ts-check

import { compareTimestamp } from '@xen-orchestra/backups/RemoteAdapter.mjs'
import { createLogger } from '@xen-orchestra/log'
import { journalCursorAt } from '@xen-orchestra/backups/_backupJournal.mjs'

/**
 * A backup repository, as required by `VmBackupsCache`.
 *
 * @typedef {import('@vates/types').XoBackupRepository} Repository
 */

/**
 * A backup, as formatted by `formatVmBackup()`.
 *
 * @typedef {import('@vates/types').XoVmBackupArchive} FormattedBackup
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
 * @property {string} [cursor] path bounding the next journal read, see `readBackupJournal()`;
 * unchanged from the cursor passed in when nothing new was read
 */

/**
 * Reads the backups of a repository. See `VmBackupsSource`.
 *
 * @typedef {object} Source
 * @property {(repository: Repository) => Promise<BackupsByVm>} listAll
 * @property {(repository: Repository, vmUuid: string) => Promise<Backups>} listOneVm
 * @property {(repository: Repository, cursor: string | undefined, opts: { mustExist: boolean }) => Promise<JournalRead>} readJournal
 */

/**
 * @typedef {object} Entry
 * @property {BackupsByVm} [backupsByVm] set once the initial listing has completed
 * @property {string} cursor path bounding the next journal read, see `readBackupJournal()`
 * @property {boolean} [journalConfirmed] whether the journal directory has already been read
 * successfully once, i.e. whether it disappearing on the next replay is anomalous rather than benign
 * @property {number} lastJournalRead this process' clock, for the day-rollover and refresh-window
 * checks only: it is never passed to the source, which owns the cursor
 * @property {Repository['options']} [options]
 * @property {boolean} stale
 * @property {string} url
 */

const { debug, warn } = createLogger('xo:xo-mixins:backups-ng:vmBackupsCache')

// Journal entries are stamped with the clock of the process which wrote them, which is not
// necessarily this one. There is no journal entry to anchor the very first replay of an entry on, so
// its cursor is bootstrapped from this process' clock instead, read a bit before the listing's
// watermark to cover the gap between the two clocks; every replay after that chains on the cursor of
// the previous one, which is immune to clock skew.
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
const isSameRepository = (entry, repository) => entry.url === repository.url && entry.options === repository.options

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
 * `backupsByVm` maps each VM to its backups, either as an array (as a proxy returns them) or keyed by
 * metadata filename (as `VmBackupsCache` stores them).
 *
 * @param {Record<string, FormattedBackup[] | Record<string, FormattedBackup>>} backupsByVm
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
            .map(backup => /** @type {FormattedBackup} */ ({ ...backup, id: `${remoteId}/${backup.id}` }))
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
 * `immutable-backups` daemon lifting the immutability of a backup), and when the remote is
 * re-pointed or reconfigured, which the entry detects by itself from the `url` and the `options` it
 * was built from.
 */
export class VmBackupsCache {
  // repository id → { backupsByVm, lastJournalRead, options, stale, url }
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
   * Also drops a build or replay still in flight for this repository, if any: a caller of `get()`
   * arriving after `delete()` must not be served the outcome of an operation which started before it,
   * e.g. against a since-reconfigured repository.
   *
   * @param {Repository['id']} repositoryId
   * @returns {void}
   */
  delete(repositoryId) {
    if (this.#entries.delete(repositoryId)) {
      debug('entry deleted', { repositoryId })
    }
    this.#pending.delete(repositoryId)
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
        if (this.#pending.get(id) === pending) {
          this.#pending.delete(id)
        }
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
      if (
        entry === undefined ||
        !isSameRepository(entry, repository) ||
        utcDay(entry.lastJournalRead) !== utcDay(now)
      ) {
        return await this.#build(repository)
      }

      if (entry.stale || now - entry.lastJournalRead >= this.#minRefreshDelay) {
        await this.#replay(repository, entry)
      }

      // populated: this branch is only reached for an entry `#build()` has already completed
      return /** @type {BackupsByVm} */ (entry.backupsByVm)
    } catch (error) {
      // the repository is probably unreachable: don't keep serving a listing which cannot be
      // refreshed anymore
      if (this.#entries.get(id) === entry) {
        this.delete(id)
      }
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
    this.get(repository).catch(error => {
      warn('failed to warm the entry', { repositoryId: id, error })
    })

    // `RemoteAdapter#listAllVmBackups` skips the VMs without backups
    return Object.keys(backups).length === 0 ? {} : { [vmUuid]: backups }
  }

  /**
   * @param {Repository} repository
   * @returns {Promise<BackupsByVm>}
   */
  async #build(repository) {
    const { id } = repository

    // the cursor is bootstrapped from this process' clock before the listing, so that the events
    // which happen during it are replayed on the next read
    const now = Date.now()
    const entry = {
      backupsByVm: undefined,
      cursor: journalCursorAt(now - CLOCK_SKEW_TOLERANCE),
      lastJournalRead: now,
      options: repository.options,
      stale: false,
      url: repository.url,
    }

    // registered before the listing: if the entry is deleted while it is being built, it is not
    // resurrected, only this call sees the result
    this.#entries.set(id, entry)

    const backupsByVm = await this.#source.listAll(repository)

    debug('entry built', { repositoryId: id, nVms: Object.keys(backupsByVm).length })

    entry.backupsByVm = backupsByVm
    return backupsByVm
  }

  /**
   * @param {Repository} repository
   * @param {Entry} entry
   * @returns {Promise<void>}
   */
  async #replay(repository, entry) {
    // populated: `#replay()` is only called for an entry `#build()` has already completed
    const backupsByVm = /** @type {BackupsByVm} */ (entry.backupsByVm)

    // reset before the journal read, so that a mutation which happens during it is not missed by
    // the next one
    entry.lastJournalRead = Date.now()
    entry.stale = false

    const { events, cursor } = await this.#source.readJournal(repository, entry.cursor, {
      mustExist: entry.journalConfirmed,
    })

    if (events.length > 0) {
      entry.cursor = cursor
      // the journal has now actually been observed to exist: it disappearing on a later replay is
      // anomalous rather than a repository which has simply never been written to
      entry.journalConfirmed = true
    }

    // the source reduced the events to the last one of each backup, therefore they are independent
    // and the order they are applied in does not matter
    for (const { vmUuid, filename, backup } of events) {
      if (backup === undefined) {
        removeBackup(backupsByVm, vmUuid, filename)
      } else {
        ;(backupsByVm[vmUuid] ??= {})[filename] = backup
      }
    }

    debug('entry replayed', { repositoryId: repository.id, nEvents: events.length })
  }
}
