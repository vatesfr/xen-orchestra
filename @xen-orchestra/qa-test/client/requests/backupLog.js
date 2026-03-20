import { AbstractRequest } from './abstract.js'

/**
 * Specialized request handler for XenOrchestra backup log operations.
 *
 * Handles backup logs with REST API for read operations.
 * Implements: this.dispatchClient.backupLog.get("*", {jobId: backupJobId, start:>${timestamp}})
 *
 * @class BackupLogRequest
 * @extends AbstractRequest
 */
export class BackupLogRequest extends AbstractRequest {
  /**
   * REST API endpoint for backup logs
   * @type {string}
   */
  endpoint = 'backup-logs'

  /**
   * Get backup logs with  filtering syntax.
   *
   * Implements API: get("*", {jobId: backupJobId, start:>${timestamp}})
   *
   * @param {string} selector - Selection pattern ("*" for all)
   * @param {Object} filter - Filter criteria
   * @param {string} [filter.jobId] - Filter by backup job ID
   * @param {string} [filter.start] - Start time filter with comparison (e.g., ">1234567890")
   * @param {string} [filter.status] - Filter by status
   * @returns {Promise<Array>} Array of backup logs
   */
  async get(selector, filter = {}) {
    this._ensureConnected()

    // Handle selector = "*" (all logs)
    if (selector === '*') {
      return this._getFilteredLogs(filter)
    }

    // Handle specific ID selector
    const log = await this._tryRestGet({ id: selector })
    return log ? [log] : []
  }

  /**
   * Get the latest log for a specific job after a timestamp.
   *
   * @param {string} jobId - Backup job ID
   * @param {Date|string|number} [afterTimestamp] - Get logs after this timestamp
   * @returns {Promise<Object|undefined>} Most recent backup log or undefined
   */
  async getLatestForJob(jobId, afterTimestamp = null) {
    if (!jobId) {
      throw new Error('Job ID is required')
    }

    const filter = { jobId }

    if (afterTimestamp) {
      filter.start = `>${new Date(afterTimestamp).getTime()}`
    }

    const logs = await this.get('*', filter)

    // Sort by start time (most recent first) and return the latest
    const sorted = logs.sort((a, b) => {
      const aTime = new Date(a.start || 0).getTime()
      const bTime = new Date(b.start || 0).getTime()
      return bTime - aTime
    })

    return sorted.length > 0 ? sorted[0] : undefined
  }

  /**
   * Internal method to get filtered logs using REST API.
   *
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Array>} Array of backup logs
   * @throws {Error} If REST API fails
   * @private
   */
  async _getFilteredLogs(filter) {
    // Use REST API with FilterBuilder
    const objects = await this.dispatchClient.restApiClient.getObjects(`/rest/v0/${this.endpoint}`, { filter })

    console.log(`✅ Retrieved ${objects.length} backup logs via REST API`)
    return objects
  }
}
