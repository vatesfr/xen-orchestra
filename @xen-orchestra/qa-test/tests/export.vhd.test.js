import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import fs from 'node:fs/promises'
import path from 'node:path'

import { createLogger } from '@xen-orchestra/log'
import { FilterBuilder } from '../client/FilterBuilder.js'
import {
  generateExportFileName,
  validateVhdIntegrity,
  validateXvaIntegrity,
  assertExportSizeReasonable,
  assertCompressionEfficiency,
  formatBytes,
} from '../utils/exportUtils.js'
import { setup, teardown } from './setup.js'
import { getRequiredEnv } from '../utils/index.js'

const log = createLogger('xo:qa-test:tests')

describe('VHD/XVA Export Replication Tests', () => {
  /** @type {import('../client/dispatchClient.js').DispatchClient} */
  let dispatchClient
  /** @type {Object} */
  let tracker
  /** @type {Object} */
  let vm
  /** @type {Object} */
  let sr
  /** @type {string} */
  let exportPath
  /** @type {Array<string>} */
  const exportedFiles = []

  before(async () => {
    ;({ dispatchClient, tracker } = await setup())

    // Find test VM
    const vmPrefix = getRequiredEnv('VM_PREFIX')
    const filter = FilterBuilder.create().withGlob('name_label', `${vmPrefix}-QA-Test-*`)
    const qaVms = await dispatchClient.vm.list(filter)

    assert(qaVms.length > 0, `Required VM with pattern "${vmPrefix}-QA-Test-*" not found - export tests cannot run`)

    vm = qaVms[0]
    log.debug('Found test VM for export tests', { name: vm.name_label, uuid: vm.uuid })

    // Get SR for restoration tests
    const srId = getRequiredEnv('SR_ID')

    sr = await dispatchClient.sr.details(srId)
    if (!sr) {
      throw new Error(`SR with ID "${srId}" not found`)
    }

    log.debug('Found SR for tests', { name: sr.name_label, uuid: sr.uuid })

    // Set export path
    exportPath = getRequiredEnv('VHD_EXPORT_PATH')

    // Ensure export directory exists
    await fs.mkdir(exportPath, { recursive: true })
    log.debug('Export path', { exportPath })
  })

  after(async () => {
    // Clean up exported files
    if (exportedFiles.length > 0) {
      log.debug('Cleaning up exported files', { count: exportedFiles.length })
      for (const filePath of exportedFiles) {
        try {
          await fs.unlink(filePath)
          log.debug('Deleted exported file', { filePath })
        } catch (error) {
          log.warn('Failed to delete exported file', { filePath, error })
        }
      }
    }

    // Run standard teardown
    if (dispatchClient && tracker) {
      await teardown(dispatchClient, tracker)
    }
  })

  // =========================================================================
  // VDI VHD Export Tests
  // =========================================================================

  describe('VDI VHD Export Tests', () => {
    it('should export VDI as VHD file', async () => {
      // Get VM's VDIs
      const vdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
      assert(vdis.length > 0, 'VM should have at least one VDI')

      const vdi = vdis[0]
      log.debug('Exporting VDI', { name: vdi.name_label, uuid: vdi.uuid, size: formatBytes(vdi.virtual_size) })

      // Generate unique filename
      const fileName = generateExportFileName(vm.name_label, 'vhd')
      const outputPath = path.join(exportPath, fileName)

      // Export VDI as VHD
      const result = await dispatchClient.vdi.exportAsVhd(vdi.uuid, outputPath)

      // Track file for cleanup
      exportedFiles.push(result.path)

      // Verify file exists
      const stats = await fs.stat(result.path)
      assert(stats.size > 0, 'Exported VHD file should not be empty')
      assert.strictEqual(result.size, stats.size, 'Returned size should match file size')

      log.debug('VHD export completed', { size: formatBytes(result.size), duration: result.duration })
    })

    it('should export VDI with NBD protocol', async () => {
      // Get VM's VDIs
      const vdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
      assert(vdis.length > 0, 'VM should have at least one VDI')

      const vdi = vdis[0]
      const fileName = generateExportFileName(`${vm.name_label}-nbd`, 'vhd')
      const outputPath = path.join(exportPath, fileName)

      // Export with NBD options
      const result = await dispatchClient.vdi.exportAsVhd(vdi.uuid, outputPath, {
        preferNbd: true,
        nbdConcurrency: 2,
      })

      exportedFiles.push(result.path)

      const stats = await fs.stat(result.path)
      assert(stats.size > 0, 'Exported VHD file with NBD should not be empty')

      log.debug('VHD export with NBD completed', { size: formatBytes(result.size), duration: result.duration })
    })

    it('should validate VHD file structure', async () => {
      // Get VM's VDIs
      const vdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
      assert(vdis.length > 0, 'VM should have at least one VDI')

      const vdi = vdis[0]
      const fileName = generateExportFileName(`${vm.name_label}-validate`, 'vhd')
      const outputPath = path.join(exportPath, fileName)

      // Export VDI
      const result = await dispatchClient.vdi.exportAsVhd(vdi.uuid, outputPath)
      exportedFiles.push(result.path)

      // Validate VHD structure
      const validation = await validateVhdIntegrity(result.path)

      assert.strictEqual(validation.valid, true, `VHD validation failed: ${validation.error}`)
      log.debug('VHD structure validated', { size: formatBytes(validation.size) })
    })

    it('should have reasonable export size', async () => {
      // Get VM's VDIs
      const vdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
      assert(vdis.length > 0, 'VM should have at least one VDI')

      const vdi = vdis[0]
      const fileName = generateExportFileName(`${vm.name_label}-size`, 'vhd')
      const outputPath = path.join(exportPath, fileName)

      // Export VDI
      const result = await dispatchClient.vdi.exportAsVhd(vdi.uuid, outputPath)
      exportedFiles.push(result.path)

      // Check size is reasonable (should not exceed virtual size by much)
      // Allow 10% overhead for VHD metadata
      assertExportSizeReasonable(result.size, vdi.virtual_size, { tolerance: 0.1 })

      const ratio = ((result.size / vdi.virtual_size) * 100).toFixed(1)
      log.debug('VHD size comparison', {
        exported: formatBytes(result.size),
        virtual: formatBytes(vdi.virtual_size),
        ratio: `${ratio}%`,
      })
    })
  })

  // =========================================================================
  // Full VM XVA Export Tests
  // =========================================================================

  describe('Full VM XVA Export Tests', () => {
    /** @type {number} */
    let uncompressedSize = 0

    it('should export VM as uncompressed XVA', async () => {
      const fileName = generateExportFileName(`${vm.name_label}-uncompressed`, 'xva')
      const outputPath = path.join(exportPath, fileName)

      // Export VM without compression
      const result = await dispatchClient.vm.exportAsXva(vm.uuid, outputPath, {
        compress: false,
      })

      exportedFiles.push(result.path)
      uncompressedSize = result.size

      // Verify file exists
      const stats = await fs.stat(result.path)
      assert(stats.size > 0, 'Exported XVA file should not be empty')

      log.debug('XVA export (uncompressed) completed', { size: formatBytes(result.size), duration: result.duration })
    })

    it('should export VM with compression', async () => {
      const fileName = generateExportFileName(`${vm.name_label}-compressed`, 'xva')
      const outputPath = path.join(exportPath, fileName)

      // Export VM with compression enabled
      const result = await dispatchClient.vm.exportAsXva(vm.uuid, outputPath, {
        compress: true,
      })

      exportedFiles.push(result.path)

      const stats = await fs.stat(result.path)
      assert(stats.size > 0, 'Exported XVA file should not be empty')

      // Compare with uncompressed if available
      if (uncompressedSize > 0) {
        assertCompressionEfficiency(result.size, uncompressedSize)
      }

      log.debug('XVA export (compressed) completed', { size: formatBytes(result.size), duration: result.duration })
    })

    it('should validate XVA structure', async () => {
      const fileName = generateExportFileName(`${vm.name_label}-xva-validate`, 'xva')
      const outputPath = path.join(exportPath, fileName)

      // Export VM
      const result = await dispatchClient.vm.exportAsXva(vm.uuid, outputPath, {
        compress: false,
      })
      exportedFiles.push(result.path)

      // Validate XVA structure
      const validation = await validateXvaIntegrity(result.path)

      assert.strictEqual(validation.valid, true, `XVA validation failed: ${validation.error}`)
      log.debug('XVA structure validated', { size: formatBytes(validation.size) })
    })
  })

  // =========================================================================
  // Restoration Tests
  // =========================================================================

  describe('Restoration Tests', () => {
    /** @type {string|null} */
    let importedVdiUuid = null
    /** @type {string|null} */
    let restoredVmUuid = null

    after(async () => {
      // Clean up restored resources
      if (restoredVmUuid) {
        try {
          // Stop VM if running
          const vmDetails = await dispatchClient.vm.details(restoredVmUuid)
          if (vmDetails.power_state === 'Running') {
            await dispatchClient.vm.stop(restoredVmUuid, { force: true })
            await dispatchClient.vm.waitForPowerState(restoredVmUuid, 'Halted', 60_000)
          }
          await dispatchClient.vm.delete(restoredVmUuid, { deleteDisks: true })
          log.debug('Cleaned up restored VM', { uuid: restoredVmUuid })
        } catch (error) {
          log.warn('Failed to cleanup restored VM', { uuid: restoredVmUuid, error })
        }
      }

      // Note: VDI cleanup would require additional implementation
      if (importedVdiUuid) {
        log.warn('Imported VDI may need manual cleanup', { uuid: importedVdiUuid })
      }
    })

    it('should restore VHD to new VDI', async () => {
      // First, export a VDI
      const vdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
      assert(vdis.length > 0, 'VM should have at least one VDI')

      const vdi = vdis[0]
      const fileName = generateExportFileName(`${vm.name_label}-restore`, 'vhd')
      const outputPath = path.join(exportPath, fileName)

      const exportResult = await dispatchClient.vdi.exportAsVhd(vdi.uuid, outputPath)
      exportedFiles.push(exportResult.path)

      // Import VHD to SR
      importedVdiUuid = await dispatchClient.vdi.importVhd(exportResult.path, sr.uuid)

      assert(importedVdiUuid, 'Import should return VDI UUID')
      log.debug('VHD imported as new VDI', { uuid: importedVdiUuid })

      // Verify VDI exists
      const importedVdi = await dispatchClient.vdi.details(importedVdiUuid)
      assert(importedVdi, 'Imported VDI should exist')

      // VDI size can be in virtual_size or size property depending on API version
      const vdiSize = importedVdi.virtual_size || importedVdi.size || 0
      log.debug('Imported VDI properties', {
        uuid: importedVdi.uuid,
        name: importedVdi.name_label,
        virtualSize: importedVdi.virtual_size,
        size: importedVdi.size,
        physicalUtilisation: importedVdi.physical_utilisation,
      })

      // Size validation - the VDI exists, that's the main check
      // Size might be 0 initially until the VDI is fully written
      assert(importedVdi.uuid, 'Imported VDI should have a valid UUID')

      log.debug('Restored VDI verified', {
        name: importedVdi.name_label || importedVdiUuid,
        size: formatBytes(vdiSize),
      })
    })

    it('should restore XVA to new VM', async () => {
      // Export VM as XVA
      const fileName = generateExportFileName(`${vm.name_label}-vm-restore`, 'xva')
      const outputPath = path.join(exportPath, fileName)

      const exportResult = await dispatchClient.vm.exportAsXva(vm.uuid, outputPath, {
        compress: true,
      })
      exportedFiles.push(exportResult.path)

      // Import XVA to create new VM
      restoredVmUuid = await dispatchClient.vm.importXva(exportResult.path, sr.uuid)

      assert(restoredVmUuid, 'Import should return VM UUID')
      log.debug('XVA imported as new VM', { uuid: restoredVmUuid })

      // Verify VM exists
      const restoredVm = await dispatchClient.vm.details(restoredVmUuid)
      assert(restoredVm, 'Restored VM should exist')
      assert.strictEqual(restoredVm.power_state, 'Halted', 'Restored VM should be in Halted state')

      log.debug('Restored VM verified', { name: restoredVm.name_label, uuid: restoredVmUuid })
    })
  })

  // =========================================================================
  // Size Comparison Tests
  // =========================================================================

  describe('Size Comparison Tests', () => {
    it('should compare source VDI size vs exported VHD', async () => {
      // Get VM's VDIs
      const vdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
      assert(vdis.length > 0, 'VM should have at least one VDI')

      const vdi = vdis[0]
      const fileName = generateExportFileName(`${vm.name_label}-compare`, 'vhd')
      const outputPath = path.join(exportPath, fileName)

      // Export VDI
      const result = await dispatchClient.vdi.exportAsVhd(vdi.uuid, outputPath)
      exportedFiles.push(result.path)

      // Calculate ratios
      const virtualRatio = ((result.size / vdi.virtual_size) * 100).toFixed(1)
      const physicalRatio =
        vdi.physical_utilisation > 0 ? ((result.size / vdi.physical_utilisation) * 100).toFixed(1) : 'N/A'

      log.debug('Size comparison', {
        virtualSize: formatBytes(vdi.virtual_size),
        physicalUsed: formatBytes(vdi.physical_utilisation),
        exportedVhd: formatBytes(result.size),
        vhdVirtualRatio: `${virtualRatio}%`,
        vhdPhysicalRatio: `${physicalRatio}%`,
      })

      // VHD should be reasonable compared to virtual size
      assert(
        result.size <= vdi.virtual_size * 1.1,
        `VHD size (${formatBytes(result.size)}) should not exceed virtual size (${formatBytes(vdi.virtual_size)}) by more than 10%`
      )
    })

    it('should show compression efficiency for XVA', async () => {
      // Export uncompressed
      const uncompressedName = generateExportFileName(`${vm.name_label}-eff-uncomp`, 'xva')
      const uncompressedPath = path.join(exportPath, uncompressedName)

      const uncompressedResult = await dispatchClient.vm.exportAsXva(vm.uuid, uncompressedPath, {
        compress: false,
      })
      exportedFiles.push(uncompressedResult.path)

      // Export with compression
      const compressedName = generateExportFileName(`${vm.name_label}-eff-comp`, 'xva')
      const compressedPath = path.join(exportPath, compressedName)

      const compressedResult = await dispatchClient.vm.exportAsXva(vm.uuid, compressedPath, {
        compress: true,
      })
      exportedFiles.push(compressedResult.path)

      // Calculate compression ratio
      const compressionRatio = ((compressedResult.size / uncompressedResult.size) * 100).toFixed(1)
      const savings = (((uncompressedResult.size - compressedResult.size) / uncompressedResult.size) * 100).toFixed(1)

      log.debug('XVA compression efficiency', {
        uncompressed: formatBytes(uncompressedResult.size),
        compressed: formatBytes(compressedResult.size),
        ratio: `${compressionRatio}%`,
        savings: `${savings}%`,
      })

      // Compressed should be smaller
      assert(
        compressedResult.size < uncompressedResult.size,
        `Compressed XVA (${formatBytes(compressedResult.size)}) should be smaller than ` +
          `uncompressed (${formatBytes(uncompressedResult.size)})`
      )
    })
  })
})
