import { AbstractRequest } from './abstract.js'

import { FilterBuilder } from '../FilterBuilder.js'

/**
 * Specialized request handler for XenOrchestra Storage Repository (SR) operations.
 *
 * Handles SR resources with REST API for read operations. Storage Repositories
 * are needed for health check configuration where backups are restored to verify integrity.
 *
 * @class SRRequest
 * @extends AbstractRequest
 */
export class SRRequest extends AbstractRequest {
  /**
   * REST API endpoint for storage repositories
   * @type {string}
   */
  endpoint = 'srs'

  /**
   * Get Storage Repository (SR) for health check operations.
   *
   * This method looks for and validates a storage repository with specific type:
   * - Finds SR with type 'linstor'
   * - Verifies minimum available space if specified
   * - Throws error if SR not found or insufficient space
   *
   * @param {Object} [options={}] - Filter options
   * @param {number} [options.minSize] - Minimum free space in bytes
   * @param {string} [options.hostId] - Filter by host ID (currently unused)
   * @returns {Promise<Object>} SR object matching criteria
   * @throws {Error} If SR not found or has insufficient space
   */
  async getStorageRepositoryForHealthCheck(options = {}) {
    this._ensureConnected()

    // Use REST API filtering for efficient server-side filtering
    const filterBuilder = FilterBuilder.create().withProperty('SR_type', 'linstor')

    const storageRepository = await this.get(filterBuilder)

    if (!storageRepository) {
      throw new Error('Storage Repository not found - health checks require Storage Repository')
    }

    // Verify Storage Repository has enough space
    const totalSize = storageRepository.size || 0
    const usedSpace = storageRepository.physical_usage || 0
    const freeSpace = totalSize - usedSpace

    if (options.minSize && freeSpace < options.minSize) {
      const freeSpaceGB = (freeSpace / 1024 ** 3).toFixed(2)
      const minSizeGB = (options.minSize / 1024 ** 3).toFixed(2)
      throw new Error(`Storage Repository has insufficient space: ${freeSpaceGB} GB free, ${minSizeGB} GB required`)
    }

    const freeSpaceGB = (freeSpace / 1024 ** 3).toFixed(2)
    console.log(
      `✅ Found Storage Repository for health checks: ${storageRepository.name_label} (${freeSpaceGB} GB free)`
    )
    return storageRepository
  }
}
