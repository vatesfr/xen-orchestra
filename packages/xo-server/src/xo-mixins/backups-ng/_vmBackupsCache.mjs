import { compareTimestamp } from '@xen-orchestra/backups/RemoteAdapter.mjs'
import { createLogger } from '@xen-orchestra/log'
import { formatVmBackup } from '@xen-orchestra/backups/formatVmBackups.mjs'
import { resolve } from 'node:path'

const { debug, warn } = createLogger('xo:xo-mixins:backups-ng:vmBackupsCache')

// Journal entries are stamped with the clock of the process which wrote them, which is not
// necessarily this one: read a bit before the watermark of the previous read.
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
const normalizeFilename = filename => resolve('/', filename)

// `formatVmBackup` expects the metadata as `RemoteAdapter#listVmBackups` returns it, i.e. with the
// `id` which the on-repository cache injects
const format = (metadata, backupRepositoryId, filename) =>
  formatVmBackup({ ...metadata, _filename: filename, backupRepositoryId, id: filename })

const isSameRepository = (entry, repository) => entry.url === repository.url && entry.options === repository.options

/**
 * Turns the backups of a repository into the shape expected by the API:
 * `{ [vmUuid]: <backups sorted by timestamp> }`, restricted to `vmId` when it is given.
 *
 * `backupsByVm` maps each VM to its backups, either as an array (as a proxy returns them) or keyed by
 * metadata filename (as `VmBackupsCache` stores them).
 */
export function serveVmBackups(backupsByVm, remoteId, vmId) {
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
 * Entries are rebuilt from scratch when they cross a UTC day, which bounds the drift accumulated
 * from the events which could not be journaled, or which are not journaled at all (e.g. the
 * `immutable-backups` daemon lifting the immutability of a backup), and when the remote is
 * re-pointed or reconfigured, which the entry detects by itself from the `url` and the `options` it
 * was built from.
 */
export class VmBackupsCache {
  // repository id → { backupsByVm, lastJournalRead, options, stale, url }
  #entries = new Map()

  #minRefreshDelay

  // repository id → promise of the ongoing build or replay, to coalesce concurrent listings
  #pending = new Map()

  #useAdapter

  /**
   * @param {(repository: object, fn: (adapter: object) => Promise<any>) => Promise<any>} useAdapter
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

      return entry.backupsByVm
    } catch (error) {
      // the repository is probably unreachable: don't keep serving a listing which cannot be
      // refreshed anymore
      this.delete(id)
      throw error
    }
  }

  async #build(repository) {
    const { id } = repository

    // the watermark is taken before the listing, so that the events which happen during the listing
    // are replayed on the next read
    const entry = {
      backupsByVm: undefined,
      lastJournalRead: Date.now(),
      options: repository.options,
      stale: false,
      url: repository.url,
    }

    // registered before the listing: if the entry is deleted while it is being built, it is not
    // resurrected, only this call sees the result
    this.#entries.set(id, entry)

    const backupsByVm = await this.#useAdapter(repository, async adapter => {
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
  }

  async #replay(repository, entry) {
    const { backupsByVm } = entry

    const since = entry.lastJournalRead - CLOCK_SKEW_TOLERANCE

    // both are reset before the journal read, so that a mutation which happens during the replay is
    // not missed by the next one
    entry.lastJournalRead = Date.now()
    entry.stale = false

    let nEvents = 0
    await this.#useAdapter(repository, async adapter => {
      const events = await adapter.readBackupJournal(since)
      for (const { event, filename, vmUuid } of events) {
        nEvents++
        const key = normalizeFilename(filename)

        if (event === 'add' || event === 'change') {
          let metadata
          try {
            metadata = await adapter.readVmBackupMetadata(key)
          } catch (error) {
            if (error.code === 'ENOENT') {
              // the backup has already been deleted, its `del` event is either in this batch or will
              // be in a next one
              debug('ignoring event on a missing backup', { event, filename })
              continue
            }
            throw error
          }
          ;(backupsByVm[vmUuid] ??= {})[key] = format(metadata, repository.id, key)
        } else if (event === 'del') {
          const backups = backupsByVm[vmUuid]
          if (backups !== undefined) {
            delete backups[key]
            if (Object.keys(backups).length === 0) {
              // `RemoteAdapter#listAllVmBackups` skips the VMs without backups
              delete backupsByVm[vmUuid]
            }
          }
        } else {
          warn('ignoring unsupported journal event', { event, filename })
        }
      }
    })

    debug('entry replayed', { repositoryId: repository.id, nEvents })
  }
}
