import { createLogger } from '@xen-orchestra/log'
import { AbstractRequest } from './abstract.js'
import { getRequiredEnv } from '../../utils/index.js'

const log = createLogger('xo:qa-test:misc')

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
   * @param {string} [options.url] - @xen-orchestra/fs-compatible URL for the repository (e.g. file:///tmp/backups, s3://bucket/path). If not provided, uses BACKUP_REPOSITORY_URL environment variable.
   * @returns {Promise<string>} Created backup repository ID
   * @throws {Error} If creation fails
   */
  async create(name, options = {}) {
    this._ensureConnected()

    const url = options.url ?? getRequiredEnv('BACKUP_REPOSITORY_URL')
    log.debug('Creating backup repository', { name, url })

    // Backup repository creation may not be available via REST API, use WebSocket directly
    try {
      const backupRepositoryResult = await this.dispatchClient.xoClient.call('remote.create', {
        name,
        url,
      })

      const backupRepositoryId = backupRepositoryResult?.id || backupRepositoryResult
      log.debug('Backup repository created successfully', { name, id: backupRepositoryId })
      return backupRepositoryId
    } catch (error) {
      log.warn('Failed to create backup repository', { name, error })
      throw error
    }
  }

  /**
   * Deletes a backup repository by ID.
   *
   * @param {string} id - Backup repository ID to delete
   * @returns {Promise<void>}
   * @throws {Error} If deletion fails
   */
  async delete(id) {
    this._ensureConnected()

    log.debug('Deleting backup repository', { id })

    try {
      await this.dispatchClient.xoClient.call('remote.delete', { id })
      log.debug('Backup repository deleted successfully', { id })
    } catch (error) {
      log.warn('Failed to delete backup repository', { id, error })
      throw error
    }
  }
}
