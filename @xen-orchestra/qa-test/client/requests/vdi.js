import fs from 'node:fs/promises'
import { AbstractRequest } from './abstract.js'
import { assertNonEmptyString } from '../../utils/index.js'

/**
 * Specialized request handler for XenOrchestra VDI (Virtual Disk Image) operations.
 *
 * Provides VDI export/import operations with REST API streaming for efficient
 * handling of large disk files. Supports VHD format export and NBD protocol options.
 *
 * @class VDIRequest
 * @extends AbstractRequest
 */
export class VDIRequest extends AbstractRequest {
  /**
   * REST API endpoint for VDIs
   * @type {string}
   */
  endpoint = 'vdis'

  /**
   * Exports a VDI as VHD file using REST API streaming.
   *
   * Downloads the VDI content in VHD format and saves to the specified path.
   * Uses streaming to handle large files without memory overflow.
   *
   * @param {string} vdiUuid - UUID of the VDI to export
   * @param {string} outputPath - Absolute path for the output VHD file
   * @param {Object} [options={}] - Export options
   * @param {boolean} [options.preferNbd=false] - Use NBD protocol for transfer
   * @param {number} [options.nbdConcurrency] - Number of concurrent NBD connections
   * @param {number} [options.timeout=600000] - Request timeout in milliseconds (default 10 min)
   * @returns {Promise<{path: string, size: number, duration: number}>} Export result
   * @throws {Error} If VDI UUID is invalid, export fails, or file write fails
   */
  async exportAsVhd(vdiUuid, outputPath, options = {}) {
    assertNonEmptyString(vdiUuid, 'Valid VDI UUID is required', 'INVALID_VDI_UUID')
    assertNonEmptyString(outputPath, 'Valid output path is required', 'INVALID_OUTPUT_PATH')

    const { preferNbd = false, nbdConcurrency, timeout = 600_000 } = options

    // Build query parameters for NBD options
    const queryParams = new URLSearchParams()
    if (preferNbd) {
      queryParams.set('preferNbd', 'true')
    }
    if (nbdConcurrency !== undefined) {
      queryParams.set('nbdConcurrency', String(nbdConcurrency))
    }

    return this._exportResource({
      resourceUuid: vdiUuid,
      outputPath,
      resourceType: 'VDI',
      format: 'VHD',
      baseEndpoint: '/rest/v0/vdis',
      extension: '.vhd',
      queryParams: queryParams.toString() ? queryParams : undefined,
      timeout,
    })
  }

  /**
   * Imports a VHD file to create a new VDI on a Storage Repository.
   *
   * Uploads VHD content via REST API to create a new VDI on the specified SR.
   * Uses streaming for efficient memory usage with large files.
   *
   * @param {string} filePath - Path to the VHD file to import
   * @param {string} srUuid - UUID of the target Storage Repository
   * @param {Object} [options={}] - Import options
   * @param {string} [options.name] - Name for the new VDI (defaults to filename)
   * @param {number} [options.timeout=600000] - Request timeout in milliseconds (default 10 min)
   * @returns {Promise<string>} UUID of the created VDI
   * @throws {Error} If file path is invalid, SR UUID is invalid, or import fails
   */
  async importVhd(filePath, srUuid, options = {}) {
    const { timeout = 600_000 } = options
    const endpoint = `/rest/v0/srs/${srUuid}/vdis`

    return this._importFile({
      filePath,
      targetUuid: srUuid,
      format: 'VHD',
      targetType: 'SR',
      resultType: 'VDI',
      uploadHandler: async stats => {
        // FileHandle automatically closed via Symbol.asyncDispose when scope exits
        await using fileHandle = await fs.open(filePath, 'r')
        const fileStream = fileHandle.createReadStream()

        const response = await fetch(`${this.dispatchClient.restApiClient.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            ...this.dispatchClient.restApiClient.headers,
            'Content-Type': 'application/octet-stream',
            'Content-Length': String(stats.size),
          },
          body: fileStream,
          signal: AbortSignal.timeout(timeout),
          duplex: 'half',
        })

        if (!response.ok) {
          const errorText = await response.text()
          const error = new Error(`VHD import failed: HTTP ${response.status} - ${response.statusText}`)
          error.code = 'IMPORT_HTTP_ERROR'
          error.cause = new Error(errorText)
          throw error
        }

        const result = await response.json()
        return result.id || result
      },
    })
  }

  /**
   * Gets all VDIs attached to a specific VM.
   *
   * Uses REST API endpoint GET /rest/v0/vms/:id/vdis to retrieve VDIs.
   *
   * @param {string} vmUuid - UUID of the VM
   * @returns {Promise<Array<{uuid: string, name_label: string, virtual_size: number, physical_utilisation: number}>>} Array of VDI objects
   * @throws {Error} If VM UUID is invalid or request fails
   */
  async getVdisForVm(vmUuid) {
    this._ensureConnected()
    assertNonEmptyString(vmUuid, 'Valid VM UUID is required', 'INVALID_VM_UUID')

    try {
      // Use REST API endpoint to get VDIs for VM
      // REST API uses: size (virtual), usage (physical)
      const vdis = await this.dispatchClient.restApiClient.get(
        `/rest/v0/vms/${vmUuid}/vdis?fields=uuid,name_label,size,usage,$SR,VDI_type`
      )

      if (!vdis || vdis.length === 0) {
        console.log(`No VDIs found for VM ${vmUuid}`)
        return []
      }

      // Filter out CD/ISO VDIs (keep user type) and map to expected format
      const diskVdis = vdis
        .filter(vdi => vdi.VDI_type === 'user')
        .map(vdi => ({
          uuid: vdi.uuid,
          name_label: vdi.name_label,
          virtual_size: vdi.size,
          physical_utilisation: vdi.usage || 0,
          SR: vdi.$SR,
        }))

      console.log(`Found ${diskVdis.length} VDI(s) for VM ${vmUuid}`)
      return diskVdis
    } catch (error) {
      if (error.code) {
        throw error
      }

      throw this._createError(`Failed to get VDIs for VM ${vmUuid}: ${error.message}`, 'GET_VDIS_FAILED', error)
    }
  }
}
