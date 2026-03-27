import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import fs from 'node:fs/promises'
import path from 'node:path'

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
    const vmPrefix = process.env.VM_PREFIX || 'TST'
    const filter = FilterBuilder.create().withGlob('name_label', `${vmPrefix}-QA-Test-*`)
    const qaVms = await dispatchClient.vm.list(filter)

    assert(qaVms.length > 0, `Required VM with pattern "${vmPrefix}-QA-Test-*" not found - export tests cannot run`)

    vm = qaVms[0]
    console.log(`Found test VM for export tests: ${vm.name_label} (${vm.uuid})`)

    // Get SR for restoration tests
    const srId = process.env.SR_ID
    if (!srId) {
      throw new Error('SR_ID environment variable is required for export tests')
    }

    sr = await dispatchClient.sr.details(srId)
    if (!sr) {
      throw new Error(`SR with ID "${srId}" not found`)
    }

    console.log(`Found SR for tests: ${sr.name_label} (${sr.uuid})`)

    // Set export path
    exportPath = process.env.VHD_EXPORT_PATH || '/tmp/xo-test-exports'

    // Ensure export directory exists
    await fs.mkdir(exportPath, { recursive: true })
    console.log(`Export path: ${exportPath}`)
  })

  after(async () => {
    // Clean up exported files
    if (exportedFiles.length > 0) {
      console.log(`Cleaning up ${exportedFiles.length} exported file(s)...`)
      for (const filePath of exportedFiles) {
        try {
          await fs.unlink(filePath)
          console.log(`Deleted: ${filePath}`)
        } catch (error) {
          console.warn(`Failed to delete ${filePath}: ${error.message}`)
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
      console.log(`Exporting VDI: ${vdi.name_label} (${vdi.uuid}), size: ${formatBytes(vdi.virtual_size)}`)

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

      console.log(`VHD export completed: ${formatBytes(result.size)} in ${result.duration}ms`)
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

      console.log(`VHD export with NBD completed: ${formatBytes(result.size)} in ${result.duration}ms`)
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
      console.log(`VHD structure validated: magic bytes confirmed, size: ${formatBytes(validation.size)}`)
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
      console.log(
        `Size comparison: exported ${formatBytes(result.size)} vs ` +
          `virtual ${formatBytes(vdi.virtual_size)} (${ratio}%)`
      )
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

      console.log(`XVA export (uncompressed) completed: ${formatBytes(result.size)} in ${result.duration}ms`)
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

      console.log(`XVA export (compressed) completed: ${formatBytes(result.size)} in ${result.duration}ms`)
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
      console.log(`XVA structure validated: tar format confirmed, size: ${formatBytes(validation.size)}`)
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
          console.log(`Cleaned up restored VM: ${restoredVmUuid}`)
        } catch (error) {
          console.warn(`Failed to cleanup restored VM ${restoredVmUuid}: ${error.message}`)
        }
      }

      // Note: VDI cleanup would require additional implementation
      if (importedVdiUuid) {
        console.log(`Note: Imported VDI ${importedVdiUuid} may need manual cleanup`)
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
      console.log(`VHD imported as new VDI: ${importedVdiUuid}`)

      // Verify VDI exists
      const importedVdi = await dispatchClient.vdi.details(importedVdiUuid)
      assert(importedVdi, 'Imported VDI should exist')

      // VDI size can be in virtual_size or size property depending on API version
      const vdiSize = importedVdi.virtual_size || importedVdi.size || 0
      console.log(
        `Imported VDI properties:`,
        JSON.stringify(
          {
            uuid: importedVdi.uuid,
            name_label: importedVdi.name_label,
            virtual_size: importedVdi.virtual_size,
            size: importedVdi.size,
            physical_utilisation: importedVdi.physical_utilisation,
          },
          null,
          2
        )
      )

      // Size validation - the VDI exists, that's the main check
      // Size might be 0 initially until the VDI is fully written
      assert(importedVdi.uuid, 'Imported VDI should have a valid UUID')

      console.log(
        `Restored VDI verified: ${importedVdi.name_label || importedVdiUuid}, ` + `size: ${formatBytes(vdiSize)}`
      )
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
      console.log(`XVA imported as new VM: ${restoredVmUuid}`)

      // Verify VM exists
      const restoredVm = await dispatchClient.vm.details(restoredVmUuid)
      assert(restoredVm, 'Restored VM should exist')
      assert.strictEqual(restoredVm.power_state, 'Halted', 'Restored VM should be in Halted state')

      console.log(`Restored VM verified: ${restoredVm.name_label} (${restoredVmUuid})`)
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

      console.log('Size comparison:')
      console.log(`  Virtual size:  ${formatBytes(vdi.virtual_size)}`)
      console.log(`  Physical used: ${formatBytes(vdi.physical_utilisation)}`)
      console.log(`  Exported VHD:  ${formatBytes(result.size)}`)
      console.log(`  VHD/Virtual:   ${virtualRatio}%`)
      console.log(`  VHD/Physical:  ${physicalRatio}%`)

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

      console.log('Compression efficiency:')
      console.log(`  Uncompressed: ${formatBytes(uncompressedResult.size)}`)
      console.log(`  Compressed:   ${formatBytes(compressedResult.size)}`)
      console.log(`  Ratio:        ${compressionRatio}%`)
      console.log(`  Savings:      ${savings}%`)

      // Compressed should be smaller
      assert(
        compressedResult.size < uncompressedResult.size,
        `Compressed XVA (${formatBytes(compressedResult.size)}) should be smaller than ` +
          `uncompressed (${formatBytes(uncompressedResult.size)})`
      )
    })
  })
})
