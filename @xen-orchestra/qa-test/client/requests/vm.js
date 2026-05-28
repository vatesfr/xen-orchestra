import { createLogger } from '@xen-orchestra/log'
import fs from 'node:fs/promises'
import { FilterBuilder } from '../FilterBuilder.js'
import { AbstractRequest } from './abstract.js'
import { assertNonEmptyString, waitUntil } from '../../utils/index.js'

const log = createLogger('xo:qa-test:vm')

/**
 * Specialized request handler for XenOrchestra virtual machine operations.
 *
 * Provides comprehensive VM lifecycle management with REST-first approach.
 * Handles VM listing, details retrieval, template operations, cloning, deletion,
 * and export/import operations (XVA format) with optimized performance.
 *
 * @class VMRequest
 * @extends AbstractRequest
 */
export class VMRequest extends AbstractRequest {
  /**
   * REST API endpoint for VMs
   * @type {string}
   */
  endpoint = 'vms'

  /**
   * Retrieves VM template by name.
   *
   * Searches for VM templates with the specified name using REST API.
   * Throws error if REST API fails.
   *
   * @param {string} templateName - Name of the VM template to find
   * @returns {Promise<Object|undefined>} VM template object or undefined if not found
   * @throws {Error} If template name is invalid or REST API fails
   */
  async getVmTemplate(templateName) {
    if (!templateName || typeof templateName !== 'string') {
      throw new Error('Valid template name is required')
    }

    this._ensureConnected()

    const filterBuilder = FilterBuilder.create().withProperty('name_label', templateName)

    const templates = await this.dispatchClient.restApiClient.getObjects('/rest/v0/vm-templates', filterBuilder)

    if (templates && templates.length > 0) {
      log.debug('Retrieved VM template via REST API')
      return templates[0]
    }

    return undefined
  }

  /**
   * Clones a virtual machine.
   * @param {string} vmUuid - UUID of the VM to clone
   * @param {string} vmName - Name for the cloned VM
   * @param {Object} [options={}] - Clone options
   * @param {boolean} [options.fastClone=true] - Use fast clone (CoW)
   * @param {string} [options.description] - Description for the cloned VM
   * @returns {Promise<string>} UUID of the cloned VM
   * @throws {Error} If VM UUID or name is invalid, or clone operation fails
   */
  async clone(vmUuid, vmName, options = {}) {
    if (!vmUuid || typeof vmUuid !== 'string') {
      throw new Error('Valid VM UUID is required')
    }
    if (!vmName || typeof vmName !== 'string') {
      throw new Error('Valid VM name is required')
    }

    this._ensureConnected()

    const { fastClone = true, description } = options

    try {
      const clonedVmId = await this.dispatchClient.xoClient.call('vm.clone', {
        id: vmUuid,
        name: vmName,
        full_copy: !fastClone,
      })

      // Set description if provided (non-blocking operation)
      if (description) {
        try {
          await this.dispatchClient.xoClient.call('vm.set', {
            id: clonedVmId,
            name_description: description,
          })
        } catch (error) {
          log.warn('Failed to set VM description', { vmId: clonedVmId, error })
        }
      }

      log.debug('VM cloned successfully', { name: vmName, id: clonedVmId })
      return clonedVmId
    } catch (error) {
      log.warn('Failed to clone VM', { uuid: vmUuid, error })
      throw new Error(`Failed to clone VM ${vmUuid}: ${error.message}`)
    }
  }

  /**
   * Starts a virtual machine.
   *
   * Always uses JSON-RPC — the REST API does not expose the `force` parameter.
   *
   * @param {string} vmUuid - UUID of the VM to start
   * @param {Object} [options={}]
   * @param {boolean} [options.force=false] - Bypass any start-operation block set on the VM
   * @returns {Promise<void>}
   * @throws {Error} If the VM UUID is invalid or the start operation fails
   */
  async start(vmUuid, options = {}) {
    if (!vmUuid || typeof vmUuid !== 'string') {
      throw new Error('Valid VM UUID is required')
    }

    this._ensureConnected()

    const { force = false } = options

    const currentVm = await this.details(vmUuid)
    if (currentVm?.power_state === 'Running') {
      log.debug('VM already running, skipping start', { uuid: vmUuid })
      return
    }

    try {
      await this.dispatchClient.xoClient.call('vm.start', { id: vmUuid, force })
      log.debug('VM started', { uuid: vmUuid })
    } catch (error) {
      throw new Error(`Failed to start VM ${vmUuid}: ${error.message}`)
    }
  }

  /**
   * Stops a virtual machine.
   *
   *
   * @param {string} vmUuid - UUID of the VM to stop
   * @param {Object} [options={}]
   * @param {boolean} [options.force=false] - Hard-stop (equivalent to power cut)
   * @returns {Promise<void>}
   * @throws {Error} If the VM UUID is invalid or the stop operation fails
   */
  async stop(vmUuid, options = {}) {
    if (!vmUuid || typeof vmUuid !== 'string') {
      throw new Error('Valid VM UUID is required')
    }

    this._ensureConnected()

    const { force = false } = options

    const currentVm = await this.details(vmUuid)
    if (currentVm?.power_state === 'Halted') {
      log.debug('VM already halted, skipping stop', { uuid: vmUuid })
      return
    }

    const action = force ? 'hard_shutdown' : 'clean_shutdown'
    try {
      await this.dispatchClient.restApiClient.post(`/rest/v0/vms/${vmUuid}/actions/${action}?sync=true`)
      log.debug('VM stopped', { uuid: vmUuid, action })
    } catch (error) {
      throw new Error(`Failed to stop VM ${vmUuid}: ${error.message}`)
    }
  }

  /**
   * Deletes a virtual machine and its associated resources.
   *
   * Permanently removes the VM and optionally its disks. This operation cannot be undone.
   *
   * @param {string} vmUuid - UUID of the VM to delete
   * @param {Object} [options={}] - Deletion options
   * @param {boolean} [options.deleteDisks=true] - Delete VM disks
   * @param {boolean} [options.force=false] - Force deletion even if VM is running
   * @param {boolean} [options.forceBlockedOperation=false] - Force deletion even if blocked
   * @returns {Promise<void>}
   * @throws {Error} If VM UUID is invalid or deletion fails
   */
  async delete(vmUuid, options = {}) {
    if (!vmUuid || typeof vmUuid !== 'string') {
      throw new Error('Valid VM UUID is required')
    }

    this._ensureConnected()

    const { deleteDisks = true, force = false, forceBlockedOperation = false } = options

    try {
      await this.dispatchClient.xoClient.call('vm.delete', {
        id: vmUuid,
        deleteDisks,
        force,
        forceBlockedOperation,
      })

      log.debug('VM deleted successfully', { uuid: vmUuid })
    } catch (error) {
      log.warn('Failed to delete VM', { uuid: vmUuid, error })
      throw new Error(`Failed to delete VM ${vmUuid}: ${error.message}`)
    }
  }

  /**
   * Exports a VM as XVA file using REST API streaming.
   *
   * Downloads the complete VM (configuration + disks) in XVA format.
   * Supports optional compression to reduce file size.
   *
   * @param {string} vmUuid - UUID of the VM to export
   * @param {string} outputPath - Absolute path for the output XVA file
   * @param {Object} [options={}] - Export options
   * @param {boolean} [options.compress=true] - Enable compression (true/false)
   * @param {number} [options.timeout=1200000] - Request timeout in milliseconds (default 20 min)
   * @returns {Promise<{path: string, size: number, duration: number, compressed: boolean}>} Export result
   * @throws {Error} If VM UUID is invalid, export fails, or file write fails
   */
  async exportAsXva(vmUuid, outputPath, options = {}) {
    assertNonEmptyString(vmUuid, 'Valid VM UUID is required', 'INVALID_VM_UUID')
    assertNonEmptyString(outputPath, 'Valid output path is required', 'INVALID_OUTPUT_PATH')

    const { compress = true, timeout = 1_200_000 } = options

    // Build query parameters for compression
    const queryParams = new URLSearchParams()
    queryParams.set('compress', String(compress))

    return this._exportResource({
      resourceUuid: vmUuid,
      outputPath,
      resourceType: 'VM',
      format: 'XVA',
      baseEndpoint: '/rest/v0/vms',
      extension: '.xva',
      queryParams,
      timeout,
      logSuffix: `compression: ${compress}`,
      extraResult: { compressed: compress },
    })
  }

  /**
   * Polls VM power state until it matches the target state or timeout is reached.
   *
   * @param {string} vmUuid - UUID of the VM to watch
   * @param {'Running'|'Halted'|'Paused'|'Suspended'} targetState - Expected power state
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   * @throws {Error} If the VM does not reach the target state within the timeout
   */
  async waitForPowerState(vmUuid, targetState, timeout) {
    assertNonEmptyString(vmUuid, 'Valid VM UUID is required', 'INVALID_VM_UUID')
    assertNonEmptyString(targetState, 'Valid target state is required', 'INVALID_TARGET_STATE')
    this._ensureConnected()

    return waitUntil(
      async () => {
        const vm = await this.details(vmUuid)
        return vm?.power_state === targetState
      },
      3_000,
      timeout
    )
  }

  /**
   * Imports an XVA file to create a new VM.
   *
   * Uses JSON-RPC two-step approach:
   * 1. Call vm.import to get upload URL ($sendTo)
   * 2. Stream XVA file to that URL
   *
   * Note: REST API POST /rest/v0/pools/:poolId/vms has a bug, using JSON-RPC instead.
   *
   * The VM will be created in Halted state and must be started separately.
   *
   * @param {string} filePath - Path to the XVA file to import
   * @param {string} srUuid - UUID of the target Storage Repository for VM disks
   * @param {Object} [options={}] - Import options
   * @param {number} [options.timeout=1200000] - Request timeout in milliseconds (default 20 min)
   * @returns {Promise<string>} UUID of the created VM
   * @throws {Error} If file path is invalid, SR UUID is invalid, or import fails
   */
  async importXva(filePath, srUuid, options = {}) {
    const { timeout = 1_200_000 } = options

    return this._importFile({
      filePath,
      targetUuid: srUuid,
      format: 'XVA',
      targetType: 'SR',
      resultType: 'VM',
      uploadHandler: async stats => {
        // Step 1: Call vm.import via JSON-RPC to get upload URL
        const importResult = await this.dispatchClient.xoClient.call('vm.import', {
          sr: srUuid,
        })

        const sendToPath = importResult.$sendTo
        if (!sendToPath) {
          throw this._createError('vm.import did not return upload URL ($sendTo)', 'MISSING_UPLOAD_URL')
        }

        // Build full URL - $sendTo returns relative path like /api/xxx
        const uploadUrl = sendToPath.startsWith('http')
          ? sendToPath
          : `${this.dispatchClient.restApiClient.baseUrl}${sendToPath}`

        log.debug('Got upload URL for XVA import')

        // Step 2: Stream XVA file to upload URL
        // FileHandle automatically closed via Symbol.asyncDispose when scope exits
        await using fileHandle = await fs.open(filePath, 'r')
        const fileStream = fileHandle.createReadStream()

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': String(stats.size),
          },
          body: fileStream,
          signal: AbortSignal.timeout(timeout),
          duplex: 'half',
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw this._createError(
            `XVA upload failed: HTTP ${response.status} - ${response.statusText}`,
            'UPLOAD_HTTP_ERROR',
            new Error(errorText)
          )
        }

        // Response is JSON-RPC format: {"id":0,"jsonrpc":"2.0","result":"vm-uuid"}
        const jsonResponse = await response.json()
        return jsonResponse.result ?? jsonResponse
      },
    })
  }
}
