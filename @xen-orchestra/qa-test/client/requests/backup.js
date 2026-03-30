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
      const { vms, remotes, ...rest } = cfg

      // Extract first VM UUID
      const vmUuid = vms && typeof vms === 'object' ? Object.keys(vms)[0] : undefined
      // Extract first Backup Repository ID
      const backupRepositoryId = remotes && typeof remotes === 'object' ? Object.keys(remotes)[0] : undefined

      return {
        ...rest,
        vms: {
          id: vmUuid,
        },
        remotes: {
          id: backupRepositoryId,
        },
      }
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
