import { AbstractRequest } from './abstract.js'

/**
 * Specialized request handler for XenOrchestra backup repository operations.
 *
 * Handles backup repositories with REST API for read operations
 * and WebSocket for creation operations.
 *
 * @class BackupRepositoryRequest
 * @extends AbstractRequest
 */
export class BackupRepositoryRequest extends AbstractRequest {
  /**
   * REST API endpoint for backup repositories (remotes)
   * @type {string}
   */
  endpoint = 'backup-repositories'

  /**
   * Creates a new backup repository.
   *
   * Backup repository creation may not be available via REST API, use WebSocket directly.
   *
   * @param {string} name - Name for the backup repository
   * @param {Object} options - Creation options
   * @param {string} [options.path] - File path for the backup repository. If not provided, uses BACKUP_PATH environment variable or defaults to /var/lib/xo/backups
   * @returns {Promise<string>} Created backup repository ID
   * @throws {Error} If creation fails
   */
  async create(name, options = {}) {
    this._ensureConnected()

    const path = options.path || process.env.BACKUP_PATH || '/var/lib/xo/backups'
    console.log(`📁 Creating backup repository: ${name} at ${path}`)

    // Backup repository creation may not be available via REST API, use WebSocket directly
    try {
      const backupRepositoryResult = await this.dispatchClient.xoClient.call('remote.create', {
        name,
        url: `file://${path}`,
      })

      const backupRepositoryId = backupRepositoryResult?.id || backupRepositoryResult
      console.log(`✅ Backup repository created successfully via WebSocket: ${name} (ID: ${backupRepositoryId})`)
      return backupRepositoryId
    } catch (error) {
      console.error(`❌ Failed to create backup repository ${name}: ${error.message}`)
      throw error
    }
  }
}
