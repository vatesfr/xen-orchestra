// @ts-check

import Disposable from 'promise-toolbox/Disposable'
import { formatJournalEvents, formatVmBackupAt } from '@xen-orchestra/backups/formatVmBackups.mjs'

/** @typedef {import('./_vmBackupsCache.mjs').BackupsByVm} BackupsByVm */
/** @typedef {import('./_vmBackupsCache.mjs').Backups} Backups */
/** @typedef {import('./_vmBackupsCache.mjs').FormattedBackup} FormattedBackup */
/** @typedef {import('./_vmBackupsCache.mjs').JournalRead} JournalRead */
/** @typedef {import('./_vmBackupsCache.mjs').Repository} Repository */

/**
 * Formats the backups of a VM and keys them by the name of their metadata, as `VmBackupsCache`
 * stores them.
 *
 * The key is the name `formatVmBackupAt()` just gave the backup, therefore it is the same one a
 * journal event refers to, whatever the leading slash the repository stored.
 *
 * @param {object[]} backups metadata, as `RemoteAdapter#listVmBackups()` returns them
 * @param {string} repositoryId
 * @returns {Backups}
 */
function formatBackups(backups, repositoryId) {
  /** @type {Backups} */
  const result = {}
  for (const backup of backups) {
    const formatted = formatVmBackupAt(backup, backup._filename, repositoryId)
    result[formatted.id] = formatted
  }
  return result
}

/**
 * Reads the backups of a repository, for `VmBackupsCache`.
 *
 * The cache is only interested in *what* a repository holds; this is where *how* it is read lives,
 * which is the single thing which differs between a repository this process can reach by itself and
 * one which is attached to a proxy.
 */
export class VmBackupsSource {
  /** @type {object} */
  #app

  /**
   * @param {object} app
   */
  constructor(app) {
    this.#app = app
  }

  /**
   * @param {Repository} repository
   * @param {(adapter: any) => Promise<any>} fn
   * @returns {Promise<any>}
   */
  #useAdapter(repository, fn) {
    return Disposable.use(this.#app.getBackupsRemoteAdapter(repository), fn)
  }

  /**
   * Lists every backup of a repository.
   *
   * `lastJournalRead` is taken before the listing, so that the events which happen during it are
   * replayed on the next read instead of being skipped.
   *
   * @param {Repository} repository
   * @returns {Promise<{ backupsByVm: BackupsByVm, lastJournalRead: number }>}
   */
  async listAll(repository) {
    const lastJournalRead = Date.now()

    const backupsByVm = await this.#useAdapter(repository, async adapter => {
      /** @type {BackupsByVm} */
      const result = {}
      for (const [vmUuid, backups] of Object.entries(await adapter.listAllVmBackups())) {
        result[vmUuid] = formatBackups(backups, repository.id)
      }
      return result
    })

    return { backupsByVm, lastJournalRead }
  }

  /**
   * Lists the backups of a single VM, without paying for a listing of every VM on the repository.
   *
   * @param {Repository} repository
   * @param {string} vmUuid
   * @returns {Promise<Backups>}
   */
  async listOneVm(repository, vmUuid) {
    return this.#useAdapter(repository, async adapter =>
      formatBackups(await adapter.listVmBackups(vmUuid), repository.id)
    )
  }

  /**
   * Reads the events which happened on a repository since `since`, with the added and changed
   * backups resolved to their current value.
   *
   * @param {Repository} repository
   * @param {number} since
   * @returns {Promise<JournalRead | undefined>} `undefined` when this repository cannot be replayed
   * and must be listed again
   */
  async readJournal(repository, since) {
    const { events, lastJournalRead } = await this.#useAdapter(repository, adapter =>
      adapter.readBackupJournalEvents(since)
    )

    return { events: formatJournalEvents(events, repository.id), lastJournalRead }
  }
}
