import { createLogger } from '@xen-orchestra/log'
import { toSimplePattern, waitUntil } from '../../utils/index.js'
import { AbstractRequest } from './abstract.js'

const log = createLogger('xo:qa-test:backup')

/**
 * Converts a caller-friendly `{ [id]: anything }` map to the `{ id }` pattern expected by XO.
 *
 * @param {Object} [objectsById]
 * @returns {Object|undefined} undefined if there is no ID
 */
const toIdPattern = objectsById => {
  const ids = objectsById !== null && typeof objectsById === 'object' ? Object.keys(objectsById) : []
  return ids.length > 0 ? toSimplePattern(ids) : undefined
}

/**
 * Specialized request handler for XenOrchestra backup operations.
 *
 * Backup jobs (VM, mirror and metadata) and their schedules are created, updated, deleted
 * and run through the REST API. Backup archive operations that are not exposed by the
 * REST API yet still use the WebSocket API.
 *
 * @class BackupRequest
 * @extends AbstractRequest
 */
export class BackupRequest extends AbstractRequest {
  /**
   * REST API endpoint for backup jobs (all types: backup, mirrorBackup, metadataBackup)
   * @type {string}
   */
  endpoint = 'backup-jobs'

  // ===========================================================================
  // Backup jobs and schedules (REST API)
  // ===========================================================================

  /**
   * Creates a backup job of any type with `POST /rest/v0/backup-jobs`.
   *
   * `config.schedules` are keyed by temporary IDs, which can be used as keys in
   * `config.settings`: XO replaces them by the IDs of the created schedules.
   *
   * @param {'backup'|'mirrorBackup'|'metadataBackup'} type - Backup job type
   * @param {Object} config - Job properties, in the XO format
   * @returns {Promise<string>} The created backup job ID
   */
  async #createJob(type, config) {
    this._ensureConnected()

    try {
      const { id } = await this.dispatchClient.restApiClient.post(`/rest/v0/${this.endpoint}`, { ...config, type })
      return id
    } catch (error) {
      log.warn('Backup job creation failed', { type, message: error.message, body: error.body })
      throw error
    }
  }

  /**
   * Creates a new VM backup job (backup or replication).
   *
   * `vms`, `remotes` and `srs` are maps keyed by IDs, converted to the `{ id }` pattern expected by XO.
   *
   * @param {Object} config - Complete backup job configuration
   * @returns {Promise<string>} The created backup job ID
   */
  async createBackupJob(config) {
    const { vms, remotes, srs, ...rest } = config ?? {}

    return this.#createJob('backup', {
      ...rest,
      mode: rest.mode || 'delta',
      vms: toIdPattern(vms),
      remotes: toIdPattern(remotes),
      srs: toIdPattern(srs),
    })
  }

  /**
   * Creates a new mirror backup job, replicating backups from one remote to others.
   *
   * @param {Object} config - Mirror backup job configuration
   * @param {string} config.mode - 'full' or 'delta'
   * @param {string} config.sourceRemote - ID of the source remote
   * @param {Object} config.remotes - Destination remotes (e.g., { [remoteId]: {} })
   * @param {string} [config.name] - Job name
   * @param {Object} [config.schedules] - Schedule definitions
   * @param {Object} [config.settings] - Job settings
   * @returns {Promise<string>} The created mirror backup job ID
   */
  async createMirrorBackupJob(config) {
    const { remotes, ...rest } = config ?? {}

    return this.#createJob('mirrorBackup', {
      ...rest,
      mode: rest.mode || 'full',
      remotes: toIdPattern(remotes),
    })
  }

  /**
   * Creates a new metadata backup job.
   *
   * Accepts a caller-friendly shape:
   *   { name, pools: { [poolId]: true }, remotes: { [remoteId]: true },
   *     schedules, settings, xoMetadata }
   *
   * @param {Object} config - Metadata backup job configuration
   * @returns {Promise<string>} The created job ID
   */
  async createMetadataBackupJob(config) {
    const { pools, remotes, ...rest } = config ?? {}

    return this.#createJob('metadataBackup', {
      ...rest,
      pools: toIdPattern(pools),
      remotes: toIdPattern(remotes),
    })
  }

  /**
   * Updates a backup job of any type with `PATCH /rest/v0/backup-jobs/:id`.
   *
   * Root properties are replaced (`settings` must be passed entirely), a `null` value removes the property.
   *
   * @param {string} jobId - ID of the backup job to update
   * @param {Object} changes - Properties to update, in the XO format
   * @returns {Promise<void>}
   */
  async updateBackupJob(jobId, changes) {
    this._ensureConnected()

    if (!jobId || typeof jobId !== 'string') {
      throw new Error('Valid backup job ID is required')
    }

    try {
      await this.dispatchClient.restApiClient.patch(`/rest/v0/${this.endpoint}/${jobId}`, changes)
    } catch (error) {
      log.warn('Backup job update failed', { jobId, message: error.message, body: error.body })
      throw error
    }
  }

  /**
   * Deletes a backup job of any type, and its schedules, with `DELETE /rest/v0/backup-jobs/:id`.
   *
   * @param {string} jobId - ID of the backup job to delete
   * @returns {Promise<void>}
   * @throws {Error} If deletion fails, `error.status` is 404 if the job does not exist
   */
  async deleteBackupJob(jobId) {
    this._ensureConnected()

    if (!jobId || typeof jobId !== 'string') {
      throw new Error('Valid backup job ID is required')
    }

    try {
      await this.dispatchClient.restApiClient.delete(`/rest/v0/${this.endpoint}/${jobId}`)
    } catch (error) {
      // a missing job is handled by the caller (e.g. cleanup of an already deleted job)
      if (error.status !== 404) {
        log.warn('Delete backup job failed', { jobId, message: error.message, body: error.body })
      }
      throw error
    }
  }

  /**
   * Lists all schedules (of backup jobs and other jobs).
   *
   * @returns {Promise<Array<Object>>}
   */
  async listSchedules() {
    this._ensureConnected()

    return this.dispatchClient.restApiClient.getObjects('/rest/v0/schedules')
  }

  /**
   * Gets a schedule by ID.
   *
   * @param {string} scheduleId
   * @returns {Promise<Object>}
   */
  async getSchedule(scheduleId) {
    this._ensureConnected()

    return this.dispatchClient.restApiClient.get(`/rest/v0/schedules/${scheduleId}`)
  }

  /**
   * Updates a schedule with `PATCH /rest/v0/schedules/:id`.
   *
   * @param {string} scheduleId
   * @param {{cron?: string, enabled?: boolean, name?: string, timezone?: string}} changes
   * @returns {Promise<void>}
   */
  async updateSchedule(scheduleId, changes) {
    this._ensureConnected()

    await this.dispatchClient.restApiClient.patch(`/rest/v0/schedules/${scheduleId}`, changes)
  }

  /**
   * Deletes a schedule with `DELETE /rest/v0/schedules/:id`, its settings are removed from its job.
   *
   * @param {string} scheduleId
   * @returns {Promise<void>}
   */
  async deleteSchedule(scheduleId) {
    this._ensureConnected()

    await this.dispatchClient.restApiClient.delete(`/rest/v0/schedules/${scheduleId}`)
  }

  /**
   * Runs a backup job of any type through one of its schedules, and waits for its log.
   *
   * The run is started with `POST /rest/v0/schedules/:id/actions/run`, which returns
   * immediately with the ID of the REST API task running the job.
   *
   * @param {string} jobId - Backup job ID, used to find the backup log
   * @param {string} scheduleId - Schedule ID to use for this execution
   * @param {Object} [options]
   * @param {number} [options.runStartTime] - Only logs started after it are considered,
   *   defaults to 5 s before now (buffer for clock differences): pass `Date.now()` when runs follow each other closely
   * @returns {Promise<Object>} Complete backup log with status and details
   * @throws {Error} If the job fails to start or times out
   */
  async runJobAndGetLog(jobId, scheduleId, { runStartTime = Date.now() - 5000 } = {}) {
    this._ensureConnected()

    log.debug('Running backup job', { jobId, scheduleId })

    const restApiClient = this.dispatchClient.restApiClient

    let taskId
    try {
      ;({ taskId } = await restApiClient.post(`/rest/v0/schedules/${scheduleId}/actions/run`))
    } catch (error) {
      log.warn('Run backup job failed', { jobId, scheduleId, message: error.message, body: error.body })
      throw error
    }

    // Wait for the backup to complete and get the log
    const result = await waitUntil(
      async () => {
        const latestLog = await this.dispatchClient.backupLog.getLatestForJob(jobId, runStartTime)

        if (latestLog !== undefined) {
          // Check if the backup is complete (case-insensitive status check)
          const status = latestLog.status?.toLowerCase()
          return status === 'success' || status === 'failure' || latestLog.end ? { backupLog: latestLog } : false
        }

        // No log yet: the job may have failed before starting (e.g. feature not authorized)
        const task = await restApiClient.get(`/rest/v0/tasks/${taskId}`)
        return task.status === 'failure' ? { failedTask: task } : false
      },
      2000, // Check every 2 seconds
      300_000, // 5 minute timeout
      { exponentialBackoff: true, backoffMultiplier: 1.2, maxInterval: 10_000 }
    )

    if (result.failedTask !== undefined) {
      const reason = result.failedTask.result?.message ?? JSON.stringify(result.failedTask.result)
      throw new Error(`Backup job ${jobId} failed to start: ${reason}`)
    }

    log.debug('Backup completed', { status: result.backupLog.status })
    return result.backupLog
  }

  // ===========================================================================
  // Backup archives
  // ===========================================================================

  /**
   * Lists VM backups for specified backup repositories.
   *
   * Retrieves all VM backups stored in the specified backup repositories.
   * Only available via WebSocket API - REST API doesn't support this operation.
   *
   * @param {Array<string>} remotes - Array of backup repository IDs
   * @returns {Promise<Object>} Nested structure of backups by remote and VM
   * @throws {Error} If listing backups fails or remotes array is invalid
   */
  async listVmBackups(remotes) {
    this._ensureConnected()

    if (!Array.isArray(remotes) || remotes.length === 0) {
      throw new Error('Valid array of remote IDs is required')
    }

    // List VM backups is only available via WebSocket API
    try {
      return await this.dispatchClient.xoClient.call('backupNg.listVmBackups', {
        remotes,
      })
    } catch (error) {
      log.warn('List VM backups failed', { error })
      throw error
    }
  }

  /**
   * Deletes VM backups by their IDs.
   *
   * Removes VM backup files from remote repositories.
   * Only available via WebSocket API - REST API doesn't support this operation.
   *
   * @param {Array<string>} ids - Array of backup IDs to delete
   * @returns {Promise<Object>} Deletion result from the WebSocket call
   * @throws {Error} If deletion fails or IDs array is invalid
   */
  async deleteVmBackups(ids) {
    this._ensureConnected()

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Valid array of backup IDs is required')
    }

    // Delete VM backups is only available via WebSocket API
    // REST API doesn't have an endpoint for backup deletion yet
    try {
      return await this.dispatchClient.xoClient.call('backupNg.deleteVmBackups', {
        ids,
      })
    } catch (error) {
      log.warn('Delete VM backups failed', { error })
      throw error
    }
  }

  /**
   * Restores a VM backup to a new VM on the given SR (backupNg.importVmBackup).
   *
   * @param {string} backupId - Backup ID as returned by `listVmBackups`
   * @param {string} srId - Target Storage Repository UUID
   * @param {Object} [settings={}]
   * @returns {Promise<string>} UUID of the restored VM
   */
  async importVmBackup(backupId, srId, settings = {}) {
    this._ensureConnected()

    try {
      return await this.dispatchClient.xoClient.call('backupNg.importVmBackup', {
        id: backupId,
        sr: srId,
        settings,
      })
    } catch (error) {
      log.warn('Import VM backup failed', { error })
      throw error
    }
  }

  /**
   * Runs a backup health check on a backup (backupNg.checkBackup).
   *
   * @param {string} backupId - Backup ID as returned by `listVmBackups`
   * @param {string} srId - Storage Repository the check restores to
   * @param {Object} [settings={}]
   * @returns {Promise<void>}
   */
  async checkBackup(backupId, srId, settings = {}) {
    this._ensureConnected()

    return this.dispatchClient.xoClient.call('backupNg.checkBackup', { id: backupId, sr: srId, settings })
  }

  /**
   * Serves one disk of a backup archive as a read-only iSCSI LUN attached to a host.
   *
   * @param {string} archiveId - `<backup repository id>/<metadata path>`, i.e. a backup id
   * @param {string} diskId - id of one of the archive's disks, as listed in `backup.disks`
   * @param {string} hostId - host the disk is attached to
   * @returns {Promise<{id: string, srUuid: string, vdiUuid: string}>} the mount, whose `id` is the
   * handle to pass to `unmountLiveDisk`
   */
  async mountLiveDisk(archiveId, diskId, hostId) {
    this._ensureConnected()

    return this.dispatchClient.restApiClient.post(
      `${this.#archiveEndpoint(archiveId)}/actions/mount_live_disk?sync=true`,
      {
        diskId,
        hostId,
      }
    )
  }

  /**
   * Detaches a disk mounted by `mountLiveDisk`, or by a restore which live mounted it.
   *
   * @param {string} archiveId - archive the mount belongs to
   * @param {string} mountId - identifier of the mount
   * @returns {Promise<void>}
   */
  async unmountLiveDisk(archiveId, mountId) {
    this._ensureConnected()

    return this.dispatchClient.restApiClient.post(
      `${this.#archiveEndpoint(archiveId)}/live_disks/${encodeURIComponent(mountId)}/actions/unmount?sync=true`
    )
  }

  // a backup archive id contains slashes, so it has to be encoded to stay a single path segment
  #archiveEndpoint(archiveId) {
    return `/rest/v0/backup-archives/${encodeURIComponent(archiveId)}`
  }

  // ===========================================================================
  // Metadata backups
  // ===========================================================================

  /**
   * Lists metadata backups for the given backup repositories.
   *
   * @param {string[]} remoteIds - Array of backup repository IDs
   * @returns {Promise<{xo: Object, pool: Object}>} Nested metadata backup structure
   */
  async listMetadataBackups(remoteIds) {
    this._ensureConnected()

    if (!Array.isArray(remoteIds) || remoteIds.length === 0) {
      throw new Error('Valid array of remote IDs is required')
    }

    try {
      return await this.dispatchClient.xoClient.call('metadataBackup.list', { remotes: remoteIds })
    } catch (error) {
      log.warn('List metadata backups failed', { error })
      throw error
    }
  }
}
