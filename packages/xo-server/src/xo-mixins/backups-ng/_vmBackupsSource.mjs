// @ts-check

import Disposable from 'promise-toolbox/Disposable'
import { createLogger } from '@xen-orchestra/log'
import { formatJournalEvents, formatVmBackupAt } from '@xen-orchestra/backups/formatVmBackups.mjs'
import { invalidParameters } from 'xo-common/api-errors.js'

/** @typedef {import('./_vmBackupsCache.mjs').BackupsByVm} BackupsByVm */
/** @typedef {import('./_vmBackupsCache.mjs').Backups} Backups */
/** @typedef {import('./_vmBackupsCache.mjs').FormattedBackup} FormattedBackup */
/** @typedef {import('./_vmBackupsCache.mjs').JournalRead} JournalRead */
/** @typedef {import('./_vmBackupsCache.mjs').Repository} Repository */

const { warn } = createLogger('xo:xo-mixins:backups-ng:vmBackupsSource')

// `callProxyMethod()` throws the deserialized JSON-RPC error, which is a plain object and not an
// `Error`: only its code can be matched on
const METHOD_NOT_FOUND_CODE = -32601

/**
 * @param {any} error
 * @returns {boolean}
 */
const isMethodNotFound = error => error?.code === METHOD_NOT_FOUND_CODE

/**
 * What a proxy needs to reach a repository. The credentials travel in the url, protected by TLS and
 * by the authentication token of the proxy.
 *
 * @param {Repository} repository
 * @returns {{ url: string, options?: object }}
 */
const remoteOf = repository => ({ url: repository.url, options: repository.options })

/**
 * Keys backups a proxy has already formatted.
 *
 * A backup is named after its metadata by `formatVmBackupAt()`, on whichever side formatted it,
 * therefore this is the same name the journal events use.
 *
 * @param {FormattedBackup[]} backups
 * @returns {Backups}
 */
function keyBackups(backups) {
  /** @type {Backups} */
  const result = {}
  for (const backup of backups) {
    result[backup.id] = backup
  }
  return result
}

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

  // proxies already warned about, so that one which is too old to expose its journal is reported
  // once instead of on every refresh window
  //
  // it only gates the warning: the method is still called every time, so a proxy which gets
  // upgraded starts being replayed at once
  /** @type {Set<string>} */
  #proxiesWithoutJournal = new Set()

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
   * @param {Repository} repository
   * @param {string} method
   * @param {object} params
   * @returns {Promise<any>}
   */
  #callProxy(repository, method, params) {
    return this.#app.callProxyMethod(repository.proxy, method, params)
  }

  /**
   * @param {string} proxyId
   * @returns {void}
   */
  #warnProxyWithoutJournal(proxyId) {
    if (!this.#proxiesWithoutJournal.has(proxyId)) {
      this.#proxiesWithoutJournal.add(proxyId)
      warn('this proxy does not expose the journal of its repositories, they will be listed in full', { proxyId })
    }
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
    if (repository.proxy !== undefined) {
      return this.#listAllOnProxy(repository)
    }

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
    if (repository.proxy !== undefined) {
      return this.#listOneVmOnProxy(repository, vmUuid)
    }

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
    if (repository.proxy !== undefined) {
      return this.#readJournalOnProxy(repository, since)
    }

    const { events, lastJournalRead } = await this.#useAdapter(repository, adapter =>
      adapter.readBackupJournalEvents(since)
    )

    return { events: formatJournalEvents(events, repository.id), lastJournalRead }
  }

  /**
   * @param {Repository} repository
   * @returns {Promise<{ backupsByVm: BackupsByVm, lastJournalRead: number }>}
   */
  async #listAllOnProxy(repository) {
    // read first, and on its own round trip: two calls are not ordered by the proxy, so a watermark
    // asked for in parallel could be stamped after a listing which took minutes, and every event
    // which happened during it would be skipped
    const lastJournalRead = await this.#readProxyWatermark(repository)

    const backups = await this.#listVmBackupsOnProxy(repository)

    /** @type {BackupsByVm} */
    const backupsByVm = {}
    for (const [vmUuid, vmBackups] of Object.entries(backups)) {
      backupsByVm[vmUuid] = keyBackups(vmBackups)
    }

    return { backupsByVm, lastJournalRead }
  }

  /**
   * @param {Repository} repository
   * @param {string} vmUuid
   * @returns {Promise<Backups>}
   */
  async #listOneVmOnProxy(repository, vmUuid) {
    let backups
    try {
      backups = await this.#listVmBackupsOnProxy(repository, vmUuid)
    } catch (error) {
      if (!invalidParameters.is(error)) {
        throw error
      }

      // this proxy does not know how to list a single VM: list them all and pick this one
      backups = await this.#listVmBackupsOnProxy(repository)
    }

    return keyBackups(backups[vmUuid] ?? [])
  }

  /**
   * @param {Repository} repository
   * @param {string} [vmId]
   * @returns {Promise<Record<string, FormattedBackup[]>>}
   */
  async #listVmBackupsOnProxy(repository, vmId) {
    const { id } = repository
    const { [id]: backupsByVm } = await this.#callProxy(repository, 'backup.listVmBackups', {
      remotes: { [id]: remoteOf(repository) },
      vmId,
    })

    if (backupsByVm === undefined) {
      // the proxy omits the repositories it failed to list
      throw new Error(`the proxy failed to list the backup repository ${id}`)
    }

    return backupsByVm
  }

  /**
   * @param {Repository} repository
   * @param {number} since
   * @returns {Promise<JournalRead | undefined>}
   */
  async #readJournalOnProxy(repository, since) {
    try {
      return await this.#callProxy(repository, 'backup.listVmBackupsJournal', {
        remote: remoteOf(repository),
        remoteId: repository.id,
        since,
      })
    } catch (error) {
      if (!isMethodNotFound(error)) {
        throw error
      }

      this.#warnProxyWithoutJournal(repository.proxy)
      return undefined
    }
  }

  /**
   * Asks a proxy for a watermark to start reading its journal from, without reading it.
   *
   * @param {Repository} repository
   * @returns {Promise<number>}
   */
  async #readProxyWatermark(repository) {
    try {
      const { lastJournalRead } = await this.#callProxy(repository, 'backup.listVmBackupsJournal', {
        remote: remoteOf(repository),
        remoteId: repository.id,
      })
      return lastJournalRead
    } catch (error) {
      if (!isMethodNotFound(error)) {
        throw error
      }

      // this repository will never be replayed, therefore this watermark is never used: it only has
      // to be a number
      this.#warnProxyWithoutJournal(repository.proxy)
      return Date.now()
    }
  }
}
