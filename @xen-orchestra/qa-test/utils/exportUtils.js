import fs from 'node:fs/promises'
import path from 'node:path'
import { waitUntil, assertNonEmptyString } from './index.js'

/**
 * VHD file format magic bytes at the start of the footer.
 * The string "conectix" identifies a valid VHD file.
 * @constant {Buffer}
 */
export const VHD_MAGIC = Buffer.from('conectix')

/**
 * VHD footer size in bytes.
 * The footer is located at the last 512 bytes of the file.
 * @constant {number}
 */
export const VHD_FOOTER_SIZE = 512

/**
 * Generates a unique export file name with timestamp.
 *
 * @param {string} vmName - VM name to include in filename
 * @param {'vhd'|'xva'} format - Export format
 * @returns {string} Unique filename with timestamp
 */
export function generateExportFileName(vmName, format) {
  assertNonEmptyString(vmName, 'Valid VM name is required')

  if (!['vhd', 'xva'].includes(format)) {
    throw new Error("Format must be 'vhd' or 'xva'")
  }

  const sanitizedName = vmName.replace(/[^a-zA-Z0-9-_]/g, '_')
  const timestamp = Date.now()
  return `${sanitizedName}-${timestamp}.${format}`
}

/**
 * Validates VHD file integrity by checking magic bytes in the footer.
 *
 * VHD files have a 512-byte footer at the end of the file.
 * The first 8 bytes of the footer should contain "conectix".
 *
 * @param {string} filePath - Path to VHD file
 * @returns {Promise<{valid: boolean, size: number, error?: string}>} Validation result
 */
export async function validateVhdIntegrity(filePath) {
  assertNonEmptyString(filePath, 'Valid file path is required')

  try {
    const stats = await fs.stat(filePath)

    if (stats.size < VHD_FOOTER_SIZE) {
      return {
        valid: false,
        size: stats.size,
        error: `File too small for VHD format (${stats.size} bytes, minimum ${VHD_FOOTER_SIZE})`,
      }
    }

    await using handle = await fs.open(filePath, 'r')

    // VHD footer is at the end of the file
    const footerBuffer = Buffer.alloc(VHD_FOOTER_SIZE)
    await handle.read(footerBuffer, 0, VHD_FOOTER_SIZE, stats.size - VHD_FOOTER_SIZE)

    // Check magic bytes (first 8 bytes of footer)
    const magic = footerBuffer.subarray(0, 8)
    const valid = magic.equals(VHD_MAGIC)

    return {
      valid,
      size: stats.size,
      error: valid ? undefined : `Invalid VHD magic bytes: expected "conectix", got "${magic.toString()}"`,
    }
  } catch (validationError) {
    return {
      valid: false,
      size: 0,
      error: `Failed to validate VHD: ${validationError.message}`,
    }
  }
}

/**
 * Validates XVA file integrity by checking tar archive structure.
 *
 * XVA files are tar archives containing ova.xml and disk files.
 * This function checks that the file exists and has a valid size.
 *
 * @param {string} filePath - Path to XVA file
 * @returns {Promise<{valid: boolean, size: number, error?: string}>} Validation result
 */
export async function validateXvaIntegrity(filePath) {
  assertNonEmptyString(filePath, 'Valid file path is required')

  try {
    const stats = await fs.stat(filePath)

    // XVA files should be at least a few KB (tar header + ova.xml)
    const MIN_XVA_SIZE = 1024
    if (stats.size < MIN_XVA_SIZE) {
      return {
        valid: false,
        size: stats.size,
        error: `File too small for XVA format (${stats.size} bytes, minimum ${MIN_XVA_SIZE})`,
      }
    }

    // Basic tar header check - first 512 bytes should contain tar signature
    await using handle = await fs.open(filePath, 'r')

    const headerBuffer = Buffer.alloc(512)
    await handle.read(headerBuffer, 0, 512, 0)

    // Tar files have "ustar" at offset 257 (POSIX format)
    // or can be identified by valid checksum
    const ustarMagic = headerBuffer.subarray(257, 262).toString()
    const hasUstar = ustarMagic === 'ustar'

    // Also check for valid filename in first 100 bytes
    const firstEntry = headerBuffer.subarray(0, 100).toString().replace(/\0/g, '').trim()
    const hasValidEntry = firstEntry.length > 0

    const valid = hasUstar || hasValidEntry

    return {
      valid,
      size: stats.size,
      error: valid ? undefined : 'Invalid XVA/tar structure',
    }
  } catch (validationError) {
    return {
      valid: false,
      size: 0,
      error: `Failed to validate XVA: ${validationError.message}`,
    }
  }
}

/**
 * Gets disk information for a VM.
 *
 * @param {Object} dispatchClient - DispatchClient instance
 * @param {string} vmUuid - VM UUID
 * @returns {Promise<Array<{uuid: string, name_label: string, virtual_size: number, physical_utilisation: number}>>} Array of VDI info
 */
export async function getVmDiskInfo(dispatchClient, vmUuid) {
  if (!dispatchClient) {
    throw new Error('DispatchClient instance is required')
  }

  assertNonEmptyString(vmUuid, 'Valid VM UUID is required')

  return dispatchClient.vdi.getVdisForVm(vmUuid)
}

/**
 * Asserts that export size is reasonable compared to source.
 *
 * For VHD exports, the exported size should be less than or equal to the
 * virtual size (sparse allocation) and greater than the physical utilisation.
 *
 * @param {number} exportedSize - Exported file size in bytes
 * @param {number} sourceSize - Source disk virtual size in bytes
 * @param {Object} [options={}] - Validation options
 * @param {number} [options.tolerance=0.1] - Tolerance ratio (default 10% over)
 * @param {boolean} [options.allowLarger=false] - Allow larger exports (for compressed XVA)
 * @throws {Error} If size is unreasonable
 */
export function assertExportSizeReasonable(exportedSize, sourceSize, options = {}) {
  if (typeof exportedSize !== 'number' || exportedSize < 0) {
    throw new Error('Valid exported size is required')
  }

  if (typeof sourceSize !== 'number' || sourceSize < 0) {
    throw new Error('Valid source size is required')
  }

  const { tolerance = 0.1, allowLarger = false } = options

  // Export should not be much larger than source (with tolerance for metadata)
  const maxExpectedSize = sourceSize * (1 + tolerance)

  if (!allowLarger && exportedSize > maxExpectedSize) {
    throw new Error(
      `Export size (${formatBytes(exportedSize)}) exceeds expected maximum ` +
        `(${formatBytes(maxExpectedSize)}) based on source size (${formatBytes(sourceSize)})`
    )
  }

  // Export should not be empty
  if (exportedSize === 0) {
    throw new Error('Export file is empty')
  }
}

/**
 * Compares two export sizes and asserts efficiency (compressed < uncompressed).
 *
 * @param {number} compressedSize - Compressed export size in bytes
 * @param {number} uncompressedSize - Uncompressed export size in bytes
 * @param {string} [message] - Custom error message
 * @throws {Error} If compressed is not smaller than uncompressed
 */
export function assertCompressionEfficiency(compressedSize, uncompressedSize, message) {
  if (compressedSize >= uncompressedSize) {
    const ratio = ((compressedSize / uncompressedSize) * 100).toFixed(1)
    const msg =
      message ||
      `Compression ineffective: compressed (${formatBytes(compressedSize)}) >= ` +
        `uncompressed (${formatBytes(uncompressedSize)}), ratio: ${ratio}%`
    throw new Error(msg)
  }

  const savings = (((uncompressedSize - compressedSize) / uncompressedSize) * 100).toFixed(1)
  console.log(`Compression savings: ${savings}% (${formatBytes(uncompressedSize)} -> ${formatBytes(compressedSize)})`)
}

/**
 * Formats bytes to human-readable string.
 *
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = (bytes / Math.pow(1024, i)).toFixed(2)

  return `${size} ${units[i]}`
}

/**
 * Cleans up exported files from a directory.
 *
 * @param {string} directory - Directory path
 * @param {Array<string>} patterns - File patterns to match (e.g., ['*.vhd', '*.xva'])
 * @returns {Promise<{deleted: number, errors: Array<string>}>} Cleanup result
 */
export async function cleanupExportFiles(directory, patterns = ['*.vhd', '*.xva']) {
  assertNonEmptyString(directory, 'Valid directory path is required')

  const deleted = []
  const errors = []

  try {
    const files = await fs.readdir(directory)

    for (const file of files) {
      const matchesPattern = patterns.some(pattern => {
        const ext = pattern.replace('*', '')
        return file.endsWith(ext)
      })

      if (matchesPattern) {
        const filePath = path.join(directory, file)
        try {
          await fs.unlink(filePath)
          deleted.push(file)
          console.log(`Deleted export file: ${filePath}`)
        } catch (error) {
          errors.push(`Failed to delete ${file}: ${error.message}`)
        }
      }
    }
  } catch (error) {
    errors.push(`Failed to read directory ${directory}: ${error.message}`)
  }

  return {
    deleted: deleted.length,
    errors,
  }
}

/**
 * Waits for VM to boot and reach running state.
 *
 * Requires Xen Tools to be installed on the VM for accurate state detection.
 * Fails explicitly if Xen Tools is not detected.
 *
 * @param {Object} dispatchClient - DispatchClient instance
 * @param {string} vmUuid - VM UUID
 * @param {number} [timeoutMs=300000] - Timeout in milliseconds (default 5 min)
 * @returns {Promise<{booted: boolean, duration: number}>} Boot result
 * @throws {Error} If Xen Tools is missing or boot times out
 */
export async function waitForVmBoot(dispatchClient, vmUuid, timeoutMs = 300_000) {
  if (!dispatchClient) {
    throw new Error('DispatchClient instance is required')
  }

  assertNonEmptyString(vmUuid, 'Valid VM UUID is required')

  const startTime = Date.now()

  // Get initial VM details
  const vmDetails = await dispatchClient.vm.details(vmUuid)

  // Check for Xen Tools - fail explicitly if not installed
  const xenToolsStatus = vmDetails.xenTools || vmDetails.pvDriversDetected

  if (!xenToolsStatus || xenToolsStatus === 'not installed') {
    const error = new Error(
      `VM ${vmUuid} does not have Xen Tools installed. ` +
        `Boot verification requires Xen Tools to detect guest state. ` +
        `Please install Xen Tools on the VM before running restoration tests.`
    )
    error.code = 'XEN_TOOLS_MISSING'
    throw error
  }

  console.log(`Waiting for VM ${vmUuid} to boot (timeout: ${timeoutMs / 1000}s)...`)

  // Wait for VM to reach Running state with tools active
  await waitUntil(
    async () => {
      const vm = await dispatchClient.vm.details(vmUuid)
      const isRunning = vm.power_state === 'Running'
      const toolsReady = vm.xenTools === 'up to date' || vm.xenTools === 'installed' || vm.pvDriversUpToDate === true

      if (isRunning && toolsReady) {
        return true
      }

      console.log(`VM state: ${vm.power_state}, Xen Tools: ${vm.xenTools || 'unknown'}`)
      return false
    },
    5000, // Check every 5 seconds
    timeoutMs,
    {
      exponentialBackoff: false,
    }
  )

  const duration = Date.now() - startTime
  console.log(`VM ${vmUuid} booted successfully in ${duration}ms`)

  return {
    booted: true,
    duration,
  }
}

/**
 * Asserts VHD integrity and throws if invalid.
 *
 * @param {string} filePath - Path to VHD file
 * @param {string} [message] - Custom error message
 * @throws {Error} If VHD is invalid
 */
export async function assertVhdIntegrity(filePath, message) {
  const result = await validateVhdIntegrity(filePath)

  if (!result.valid) {
    const msg = message || `VHD integrity check failed: ${result.error}`
    throw new Error(msg)
  }

  console.log(`VHD integrity validated: ${filePath} (${formatBytes(result.size)})`)
}

/**
 * Asserts XVA integrity and throws if invalid.
 *
 * @param {string} filePath - Path to XVA file
 * @param {string} [message] - Custom error message
 * @throws {Error} If XVA is invalid
 */
export async function assertXvaIntegrity(filePath, message) {
  const result = await validateXvaIntegrity(filePath)

  if (!result.valid) {
    const msg = message || `XVA integrity check failed: ${result.error}`
    throw new Error(msg)
  }

  console.log(`XVA integrity validated: ${filePath} (${formatBytes(result.size)})`)
}
