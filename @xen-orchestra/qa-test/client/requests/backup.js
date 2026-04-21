import { waitUntil } from '../../utils/index.js'
import { AbstractRequest } from './abstract.js'

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

    // Convert dynamic key format to XO expected format
    const convertConfig = cfg => {
      const { vms, remotes, srs, ...rest } = cfg

      // Extract first VM UUID
      const vmUuid = vms && typeof vms === 'object' ? Object.keys(vms)[0] : undefined

      const result = {
        ...rest,
        vms: {
          id: vmUuid,
        },
      }

      // Extract first Backup Repository ID (for backup to remote)
      const backupRepositoryId = remotes && typeof remotes === 'object' ? Object.keys(remotes)[0] : undefined
      if (backupRepositoryId !== undefined) {
        result.remotes = { id: backupRepositoryId }
      }

      // Extract first SR ID (for CR/DR mode — replication to SR)
      const srId = srs && typeof srs === 'object' ? Object.keys(srs)[0] : undefined
      if (srId !== undefined) {
        result.srs = { id: srId }
      }

      return result
    }

    const xoConfig = convertConfig({ ...config, mode: config.mode || 'delta' })

    try {
      const result = await this.dispatchClient.xoClient.call('backupNg.createJob', xoConfig)
      return result
    } catch (error) {
      console.error('❌ Backup job creation failed:', {
        message: error.message,
        code: error.code,
        data: error.data,
        fullError: JSON.stringify(error, null, 2),
      })
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
      console.error('❌ Delete backup job failed:', error.message)
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
      console.error('❌ List VM backups failed:', error.message)
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
      console.error('❌ Delete VM backups failed:', error.message)
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
      console.error('❌ Mirror backup job creation failed:', {
        message: error.message,
        code: error.code,
        data: error.data,
      })
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
      console.error('❌ Delete mirror backup job failed:', error.message)
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

    console.log(`🚀 Running mirror backup job ${jobId} with schedule ${scheduleId}...`)

    const runStartTime = Date.now() - 5000

    try {
      await this.dispatchClient.xoClient.call('mirrorBackup.runJob', {
        id: jobId,
        schedule: scheduleId,
      })
    } catch (wsError) {
      console.error('❌ Run mirror backup job failed:', wsError.message)
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
          console.debug('Waiting for mirror backup completion...', error.message)
          return false
        }
      },
      2000,
      300_000,
      { exponentialBackoff: true, backoffMultiplier: 1.2, maxInterval: 10_000 }
    )

    console.log(`✅ Mirror backup completed: ${backupLog.status}`)
    return backupLog
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

    console.log(`🚀 Running backup job ${jobId} with schedule ${scheduleId}...`)

    // Capture timestamp BEFORE starting the job (with small buffer for clock differences)
    const runStartTime = Date.now() - 5000 // 5 second buffer before job start

    // Backup job execution is only available via WebSocket API
    try {
      await this.dispatchClient.xoClient.call('backupNg.runJob', {
        id: jobId,
        schedule: scheduleId,
      })
    } catch (wsError) {
      console.error('❌ Run backup job failed:', wsError.message)
      throw wsError
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
          console.debug('Waiting for backup completion...', error.message)
          return false
        }
      },
      2000, // Check every 2 seconds
      300_000, // 5 minute timeout
      { exponentialBackoff: true, backoffMultiplier: 1.2, maxInterval: 10_000 }
    )

    console.log(`✅ Backup completed: ${backupLog.status}`)
    return backupLog
  }
}
