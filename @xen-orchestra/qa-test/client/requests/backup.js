import { createLogger } from '@xen-orchestra/log'
import { waitUntil } from '../../utils/index.js'
import { AbstractRequest } from './abstract.js'

const log = createLogger('xo:qa-test:backup')

/**
 * Specialized request handler for XenOrchestra backup operations.
 *
 * Provides comprehensive backup job management with REST API for read operations
 * and WebSocket for creation/execution operations. Handles job lifecycle,
 * execution monitoring, and log retrieval.
 *
 * @class BackupRequest
 * @extends AbstractRequest
 */
export class BackupRequest extends AbstractRequest {
  /**
   * REST API endpoint for backup jobs
   * Note: This is primarily used for read operations
   * @type {string}
   */
  endpoint = 'backup-jobs'

  /**
   * Creates a new backup job in XenOrchestra.
   *
   * Backup job creation is only available via WebSocket API.
   * REST API doesn't support backup job creation operations.
   *
   * @param {Object} config - Complete backup job configuration
   * @returns {Promise<string>} The created backup job ID
   * @throws {Error} If backup job creation fails or configuration is invalid
   */
  async createBackupJob(config) {
    this._ensureConnected()

    if (!config || typeof config !== 'object') {
      throw new Error('Valid backup configuration object is required')
    }

    // backupNg.createJob simple-pattern format: { id: x } for one id, { id: { __or: [...] } } for several.
    const toSimplePattern = ids => (ids.length === 1 ? { id: ids[0] } : { id: { __or: ids } })

    const convertConfig = cfg => {
      const { vms, remotes, srs, ...rest } = cfg

      const result = { ...rest }

      const vmIds = vms && typeof vms === 'object' ? Object.keys(vms) : []
      if (vmIds.length > 0) {
        result.vms = toSimplePattern(vmIds)
      }

      const backupRepositoryIds = remotes && typeof remotes === 'object' ? Object.keys(remotes) : []
      if (backupRepositoryIds.length > 0) {
        result.remotes = toSimplePattern(backupRepositoryIds)
      }

      const srIds = srs && typeof srs === 'object' ? Object.keys(srs) : []
      if (srIds.length > 0) {
        result.srs = toSimplePattern(srIds)
      }

      return result
    }

    const xoConfig = convertConfig({ ...config, mode: config.mode || 'delta' })

    try {
      const result = await this.dispatchClient.xoClient.call('backupNg.createJob', xoConfig)
      return result
    } catch (error) {
      log.warn('Backup job creation failed', { message: error.message, code: error.code, data: error.data })
      throw error
    }
  }

  /**
   * Deletes an existing backup job.
   *
   * Backup job deletion is only available via WebSocket API.
   *
   * @param {string} jobId - ID of the backup job to delete
   * @returns {Promise<Object>} Deletion result
   * @throws {Error} If deletion fails or job ID is invalid
   */
  async deleteBackupJob(jobId) {
    this._ensureConnected()

    if (!jobId || typeof jobId !== 'string') {
      throw new Error('Valid backup job ID is required')
    }

    // Backup job deletion is only available via WebSocket API
    try {
      const result = await this.dispatchClient.xoClient.call('backupNg.deleteJob', { id: jobId })
      return result
    } catch (error) {
      // "no such job" means the caller used the wrong delete method (e.g. mirror job) — let it handle the fallback
      if (error?.data?.type !== 'job') {
        log.warn('Delete backup job failed', { error })
      }
      throw error
    }
  }

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

  // ===========================================================================
  // Mirror Backup operations (mirrorBackup.* API)
  // ===========================================================================

  /**
   * Creates a new mirror backup job in XenOrchestra.
   *
   * Mirror backup replicates backups from one remote to another.
   * Uses `mirrorBackup.createJob` WebSocket API.
   *
   * @param {Object} config - Mirror backup job configuration
   * @param {string} config.mode - 'full' or 'delta'
   * @param {string} config.sourceRemote - ID of the source remote
   * @param {Object} config.remotes - Destination remotes (e.g., { [remoteId]: {} })
   * @param {string} [config.name] - Job name
   * @param {Object} [config.schedules] - Schedule definitions
   * @param {Object} [config.settings] - Job settings
   * @param {Object} [config.filter] - VM filter (by UUID)
   * @returns {Promise<string>} The created mirror backup job ID
   */
  async createMirrorBackupJob(config) {
    this._ensureConnected()

    if (!config || typeof config !== 'object') {
      throw new Error('Valid mirror backup configuration object is required')
    }

    const { remotes, ...rest } = config

    // Convert remotes to { id: remoteId } format
    const remoteId = remotes && typeof remotes === 'object' ? Object.keys(remotes)[0] : undefined

    const xoConfig = {
      ...rest,
      mode: config.mode || 'full',
    }

    if (remoteId !== undefined) {
      xoConfig.remotes = { id: remoteId }
    }

    try {
      const result = await this.dispatchClient.xoClient.call('mirrorBackup.createJob', xoConfig)
      return result
    } catch (error) {
      log.warn('Mirror backup job creation failed', { message: error.message, code: error.code, data: error.data })
      throw error
    }
  }

  /**
   * Deletes a mirror backup job.
   *
   * @param {string} jobId - ID of the mirror backup job to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteMirrorBackupJob(jobId) {
    this._ensureConnected()

    if (!jobId || typeof jobId !== 'string') {
      throw new Error('Valid mirror backup job ID is required')
    }

    try {
      const result = await this.dispatchClient.xoClient.call('mirrorBackup.deleteJob', { id: jobId })
      return result
    } catch (error) {
      if (error?.data?.type !== 'job') {
        log.warn('Delete mirror backup job failed', { error })
      }
      throw error
    }
  }

  /**
   * Executes a mirror backup job and monitors completion.
   *
   * @param {string} jobId - Mirror backup job ID to execute
   * @param {string} scheduleId - Schedule ID to use for this execution
   * @returns {Promise<Object>} Complete backup log with status and details
   */
  async runMirrorJobAndGetLog(jobId, scheduleId) {
    this._ensureConnected()

    log.debug('Running mirror backup job', { jobId, scheduleId })

    const runStartTime = Date.now() - 5000

    try {
      await this.dispatchClient.xoClient.call('mirrorBackup.runJob', {
        id: jobId,
        schedule: scheduleId,
      })
    } catch (wsError) {
      log.warn('Run mirror backup job failed', { error: wsError.message })
      throw wsError
    }

    const backupLog = await waitUntil(
      async () => {
        try {
          const latestLog = await this.dispatchClient.backupLog.getLatestForJob(jobId, runStartTime)

          if (!latestLog) {
            return false
          }

          const status = latestLog.status?.toLowerCase()
          if (status === 'success' || status === 'failure' || latestLog.end) {
            return latestLog
          }

          return false
        } catch (error) {
          log.debug('Waiting for mirror backup completion', { error })
          return false
        }
      },
      2000,
      300_000,
      { exponentialBackoff: true, backoffMultiplier: 1.2, maxInterval: 10_000 }
    )

    log.debug('Mirror backup completed', { status: backupLog.status })
    return backupLog
  }

  // ===========================================================================
  // Metadata Backup operations (metadataBackup.* API)
  // ===========================================================================

  /**
   * Creates a new metadata backup job in XenOrchestra.
   *
   * Accepts a caller-friendly shape:
   *   { name, pools: { [poolId]: true }, remotes: { [remoteId]: true },
   *     schedules, settings, xoMetadata }
   * and converts pools/remotes to the { id } pattern expected by the API.
   *
   * @param {Object} config - Metadata backup job configuration
   * @returns {Promise<string>} The created job ID
   */
  async createMetadataBackupJob(config) {
    this._ensureConnected()

    if (!config || typeof config !== 'object') {
      throw new Error('Valid metadata backup configuration object is required')
    }

    const { pools, remotes, ...rest } = config

    const poolId = pools && typeof pools === 'object' ? Object.keys(pools)[0] : undefined
    const remoteId = remotes && typeof remotes === 'object' ? Object.keys(remotes)[0] : undefined

    const xoConfig = { ...rest }
    if (poolId !== undefined) xoConfig.pools = { id: poolId }
    if (remoteId !== undefined) xoConfig.remotes = { id: remoteId }

    try {
      const result = await this.dispatchClient.xoClient.call('metadataBackup.createJob', xoConfig)
      // metadataBackup.createJob returns the full job object (unlike backupNg.createJob which returns only the ID)
      return result?.id ?? result
    } catch (error) {
      log.warn('Metadata backup job creation failed', { message: error.message, code: error.code, data: error.data })
      throw error
    }
  }

  /**
   * Gets a metadata backup job by ID.
   *
   * Uses the WebSocket API because the backup-jobs REST endpoint only covers VM backup jobs.
   *
   * @param {string} jobId - Metadata backup job ID
   * @returns {Promise<Object>} The job object
   */
  async getMetadataJob(jobId) {
    this._ensureConnected()

    if (!jobId || typeof jobId !== 'string') {
      throw new Error('Valid job ID is required')
    }

    try {
      return await this.dispatchClient.xoClient.call('metadataBackup.getJob', { id: jobId })
    } catch (error) {
      log.warn('Get metadata backup job failed', { jobId, error })
      throw error
    }
  }

  /**
   * Deletes a metadata backup job.
   *
   * @param {string} jobId - Metadata backup job ID to delete
   * @returns {Promise<void>}
   */
  async deleteMetadataBackupJob(jobId) {
    this._ensureConnected()

    if (!jobId || typeof jobId !== 'string') {
      throw new Error('Valid job ID is required')
    }

    try {
      return await this.dispatchClient.xoClient.call('metadataBackup.deleteJob', { id: jobId })
    } catch (error) {
      log.warn('Delete metadata backup job failed', { jobId, error })
      throw error
    }
  }

  /**
   * Executes a metadata backup job and monitors completion.
   *
   * Same polling pattern as runJobAndGetLog, but calls metadataBackup.runJob.
   *
   * @param {string} jobId - Metadata backup job ID to execute
   * @param {string} scheduleId - Schedule ID to use for this execution
   * @returns {Promise<Object>} Complete backup log with status and details
   */
  async runMetadataJobAndGetLog(jobId, scheduleId) {
    this._ensureConnected()

    log.debug('Running metadata backup job', { jobId, scheduleId })

    const runStartTime = Date.now()

    try {
      await this.dispatchClient.xoClient.call('metadataBackup.runJob', {
        id: jobId,
        schedule: scheduleId,
      })
    } catch (wsError) {
      // The server has a known bug where a post-job cleanup error of `undefined` causes
      // serializeError() to throw, returning a -32000 WS error even though the backup
      // already completed. Continue polling for the log rather than failing immediately.
      log.debug('metadataBackup.runJob returned a WS error, polling for backup log anyway', {
        jobId,
        code: wsError.code,
        error: wsError.message,
      })
    }

    const backupLog = await waitUntil(
      async () => {
        try {
          const latestLog = await this.dispatchClient.backupLog.getLatestForJob(jobId, runStartTime)
          if (!latestLog) return false
          const status = latestLog.status?.toLowerCase()
          if (status === 'success' || status === 'failure' || latestLog.end) {
            return latestLog
          }
          return false
        } catch (error) {
          log.debug('Waiting for metadata backup completion', { error })
          return false
        }
      },
      2000,
      300_000,
      { exponentialBackoff: true, backoffMultiplier: 1.2, maxInterval: 10_000 }
    )

    log.debug('Metadata backup completed', { status: backupLog.status })
    return backupLog
  }

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

  // ===========================================================================
  // Standard Backup operations (backupNg.* API)
  // ===========================================================================

  /**
   * Executes a backup job and monitors completion.
   *
   * Starts the backup job and waits for completion with detailed logging.
   * Combines job execution and log monitoring in a single method.
   *
   * @param {string} jobId - Backup job ID to execute
   * @param {string} scheduleId - Schedule ID to use for this execution
   * @returns {Promise<Object>} Complete backup log with status and details
   * @throws {Error} If job execution fails or times out
   */
  async runJobAndGetLog(jobId, scheduleId) {
    this._ensureConnected()

    log.debug('Running backup job', { jobId, scheduleId })

    // Capture timestamp BEFORE starting the job (with small buffer for clock differences)
    const runStartTime = Date.now() - 5000 // 5 second buffer before job start

    // Backup job execution is only available via WebSocket API
    try {
      await this.dispatchClient.xoClient.call('backupNg.runJob', {
        id: jobId,
        schedule: scheduleId,
      })
    } catch (wsError) {
      if (wsError.code === -32000 && wsError.message.includes('task has not started yet')) {
        // sometimes we get a task not started error
        await new Promise(resolve => setTimeout(resolve, 10_000))
      } else {
        console.error('❌ Run backup job failed:', wsError.message)
        throw wsError
      }
    }

    // Wait for the backup to complete and get the log
    const backupLog = await waitUntil(
      async () => {
        try {
          const latestLog = await this.dispatchClient.backupLog.getLatestForJob(jobId, runStartTime)

          if (!latestLog) {
            return false // Keep waiting
          }

          // Check if the backup is complete (case-insensitive status check)
          const status = latestLog.status?.toLowerCase()
          if (status === 'success' || status === 'failure' || latestLog.end) {
            return latestLog
          }

          return false // Still running
        } catch (error) {
          log.debug('Waiting for backup completion', { error })
          return false
        }
      },
      2000, // Check every 2 seconds
      300_000, // 5 minute timeout
      { exponentialBackoff: true, backoffMultiplier: 1.2, maxInterval: 10_000 }
    )

    log.debug('Backup completed', { status: backupLog.status })
    return backupLog
  }
}
