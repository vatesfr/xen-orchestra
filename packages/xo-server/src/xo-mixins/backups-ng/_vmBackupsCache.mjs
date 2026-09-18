// @ts-check

import { asyncEach } from '@vates/async-each'
import { compareTimestamp } from '@xen-orchestra/backups/RemoteAdapter.mjs'
import { createLogger } from '@xen-orchestra/log'
import { formatVmBackup } from '@xen-orchestra/backups/formatVmBackups.mjs'
import { journalCursorAt } from '@xen-orchestra/backups/_backupJournal.mjs'
import { resolve } from 'node:path'

/** @typedef {import('@xen-orchestra/backups/RemoteAdapter.mjs').RemoteAdapter} RemoteAdapter */

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
 * The formatted backups of a repository, keyed by VM UUID then metadata filename.
 *
 * @typedef {Record<string, Record<string, FormattedBackup>>} BackupsByVm
 */

/**
 * @typedef {object} Entry
 * @property {BackupsByVm} [backupsByVm] set once the initial listing has completed
 * @property {string} cursor path bounding the next journal read, see `readBackupJournal()`
 * @property {boolean} [journalConfirmed] whether the journal directory has already been read
 * successfully once, i.e. whether it disappearing on the next replay is anomalous rather than benign
 * @property {number} lastJournalRead
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

// journal entries and cache keys don't necessarily agree on the leading slash, they must be keyed
// by the same name for a replayed event to hit the entry the listing built
//
// the leading slash is the form `RemoteAdapter` produces, both when it lists a repository
// (`handler.list()` prepends the normalized dir) and when it writes a metadata
/**
 * @param {string} filename
 * @returns {string}
 */
const normalizeFilename = filename => resolve('/', filename)

// `formatVmBackup` expects the metadata as `RemoteAdapter#listVmBackups` returns it, i.e. with the
// `id` which the on-repository cache injects
/**
 * @param {object} metadata
 * @param {string} backupRepositoryId
 * @param {string} filename
 * @returns {FormattedBackup}
 */
const format = (metadata, backupRepositoryId, filename) =>
  /** @type {FormattedBackup} */ (
    formatVmBackup({ ...metadata, _filename: filename, backupRepositoryId, id: filename })
  )

/**
 * @param {Entry} entry
 * @param {Repository} repository
 * @returns {boolean}
 */
const isSameRepository = (entry, repository) => entry.url === repository.url && entry.options === repository.options

/**
 * @typedef {<T>(repository: Repository, fn: (adapter: RemoteAdapter) => Promise<T>) => Promise<T>} UseAdapter
 */

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

  /** @type {UseAdapter} */
  #useAdapter

  /**
   * @param {UseAdapter} useAdapter
   * @param {object} [options]
   * @param {number} [options.minRefreshDelay] minimum delay between two journal reads of the same
   * repository, in milliseconds
   */
  constructor(useAdapter, { minRefreshDelay = 0 } = {}) {
    this.#useAdapter = useAdapter
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
  /**
   * @param {Repository} repository
   * @returns {Promise<BackupsByVm>}
   */
  async #refresh(repository) {
    const { id } = repository
    const entry = this.#entries.get(id)
    const now = Date.now()
    // `#build()` installs its own entry, and removes it itself if the listing fails: an entry which
    // is not the one this call started from must not be touched here
    if (entry === undefined || !isSameRepository(entry, repository) || utcDay(entry.lastJournalRead) !== utcDay(now)) {
      return await this.#build(repository)
    }
    if (entry.stale || now - entry.lastJournalRead >= this.#minRefreshDelay) {
      try {
        await this.#replay(repository, entry)
      } catch (error) {
        // the repository is probably unreachable: don't keep serving a listing which cannot be
        // refreshed anymore, unless a newer build has already replaced this entry
        if (this.#entries.get(id) === entry) {
          this.#entries.delete(id)
          debug('entry deleted', { repositoryId: id })
        }
        throw error
      }
    }
    // populated: this branch is only reached for an entry `#build()` has already completed
    return /** @type {BackupsByVm} */ (entry.backupsByVm)
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

    const backups = await this.#useAdapter(repository, adapter => adapter.listVmBackups(vmUuid))

    // warms the entry in the background for the callers which want every VM
    this.get(repository).catch(error => {
      warn('failed to warm the entry', { repositoryId: id, error })
    })

    if (backups.length === 0) {
      return {}
    }

    /** @type {Record<string, FormattedBackup>} */
    const byFilename = {}
    for (const backup of backups) {
      const key = normalizeFilename(backup._filename)
      byFilename[key] = format(backup, id, key)
    }
    return { [vmUuid]: byFilename }
  }

  /**
   * @param {Repository} repository
   * @returns {Promise<BackupsByVm>}
   */
  async #build(repository) {
    const { id } = repository

    // the watermark is taken before the listing, so that the events which happen during the listing
    // are replayed on the next read
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
    try {
      const backupsByVm = await this.#useAdapter(repository, async adapter => {
        /** @type {BackupsByVm} */
        const result = {}
        for (const [vmUuid, backups] of Object.entries(await adapter.listAllVmBackups())) {
          const byFilename = (result[vmUuid] = {})
          for (const backup of backups) {
            const key = normalizeFilename(backup._filename)
            byFilename[key] = format(backup, id, key)
          }
        }
        return result
      })

      debug('entry built', { repositoryId: id, nVms: Object.keys(backupsByVm).length })

      entry.backupsByVm = backupsByVm
      return backupsByVm
    } catch (error) {
      // don't leave a half-built entry behind, but don't wipe one a newer build has published
      if (this.#entries.get(id) === entry) {
        this.#entries.delete(id)
      }
      throw error
    }
  }

  /**
   * @param {Repository} repository
   * @param {Entry} entry
   * @returns {Promise<void>}
   */
  async #replay(repository, entry) {
    // populated: `#replay()` is only called for an entry `#build()` has already completed
    const backupsByVm = /** @type {BackupsByVm} */ (entry.backupsByVm)

    // both are reset before the journal read, so that a mutation which happens during the replay is
    // not missed by the next one
    entry.lastJournalRead = Date.now()
    entry.stale = false

    let nEvents = 0
    await this.#useAdapter(repository, async adapter => {
      const events = await adapter.readBackupJournal(entry.cursor, { mustExist: entry.journalConfirmed })

      // `readBackupJournal()` returns the events oldest first: the last one is the cursor for the
      // next replay, and the last event of a given backup is its current state, so a backup which
      // was written then deleted costs no read at all, and one rewritten several times costs a
      // single one
      if (events.length > 0) {
        entry.cursor = events[events.length - 1]._filename
        // the journal has now actually been observed to exist: it disappearing on a later replay is
        // anomalous rather than a repository which has simply never been written to
        entry.journalConfirmed = true
      }

      const lastEventByKey = new Map()
      for (const { event, filename, vmUuid } of events) {
        nEvents++

        if (event !== 'add' && event !== 'change' && event !== 'del') {
          warn('ignoring unsupported journal event', { event, filename })
          continue
        }

        lastEventByKey.set(normalizeFilename(filename), { event, vmUuid })
      }

      await asyncEach(lastEventByKey, async ([key, { event, vmUuid }]) => {
        if (event === 'del') {
          removeBackup(backupsByVm, vmUuid, key)
          return
        }

        let metadata
        try {
          metadata = await adapter.readVmBackupMetadata(key)
        } catch (error) {
          if (error.code === 'ENOENT') {
            // the metadata is gone while its last event says it should be there: it was deleted
            // without being journaled, e.g. by a user or a third party tool directly on the
            // repository. Reflect it now instead of waiting for the next full rebuild.
            debug('removing a backup whose metadata is missing', { event, filename: key })
            removeBackup(backupsByVm, vmUuid, key)
            return
          }
          throw error
        }

        const backups = (backupsByVm[vmUuid] ??= {})
        backups[key] = format(metadata, repository.id, key)
      })
    })

    debug('entry replayed', { repositoryId: repository.id, nEvents })
  }
}
