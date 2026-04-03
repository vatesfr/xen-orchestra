import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import fs from 'node:fs/promises'
import path from 'node:path'

import { backupConfig } from '../backup.config.js'
import {
  assertFullOrDelta,
  assertFullOrDeltaForSr,
  findTaskByMessage,
  generateBackupJobName,
  getBackupTransferredBytes,
  getDefaultSchedule,
  getScheduleKey,
} from '../utils/index.js'
import {
  generateExportFileName,
  validateVhdIntegrity,
  validateXvaIntegrity,
  formatBytes,
} from '../utils/exportUtils.js'
import { assertBackupSuccess } from '../utils/backupUtils.js'
import { setup, teardown } from './setup.js'

/** Default backup repository name used across all tests */
const BACKUP_REPOSITORY_NAME = process.env.BACKUP_REPOSITORY_NAME || 'Test backup QA'

describe('Backup + Replication Combined Tests', () => {
  /** @type {import('../client/dispatchClient.js').DispatchClient} */
  let dispatchClient
  /** @type {import('../utils/resourceTracker.js').ResourceTracker} */
  let tracker
  /** @type {{uuid: string, name_label: string, power_state: string}} */
  let vm
  /** @type {{id: string, name: string}} */
  let backupRepository
  /** @type {{uuid: string, name_label: string}} */
  let sr
  /** @type {string} */
  let exportPath
  /** @type {Array<string>} */
  const exportedFiles = []
  /** @type {Array<string>} */
  const restoredVmUuids = []

  /**
   * Purges VM backup data from the repository and local exported files
   * to free disk space between test groups.
   */
  const purgeBackupData = async () => {
    try {
      const backups = await dispatchClient.backup.listVmBackups([backupRepository.id])
      const ids = []
      for (const vmBackups of Object.values(backups)) {
        for (const backupList of Object.values(vmBackups)) {
          for (const backup of backupList) {
            ids.push(backup.id)
          }
        }
      }
      if (ids.length > 0) {
        console.log(`Purging ${ids.length} VM backup(s) from repository to free space...`)
        await dispatchClient.backup.deleteVmBackups(ids)
        console.log(`Purged ${ids.length} VM backup(s)`)
      }
    } catch (error) {
      console.warn(`Backup data purge failed: ${error.message}`)
    }

    // Clean up local exported files
    for (const filePath of exportedFiles) {
      try {
        await fs.unlink(filePath)
      } catch {
        /* already deleted */
      }
    }
    exportedFiles.length = 0
  }

  /**
   * Creates a backup job and tracks its resources for cleanup.
   * @param {Object} config - Backup configuration
   * @param {string} mode - Backup mode ('delta' or 'full')
   * @returns {Promise<{jobId: string, scheduleKey: string}>}
   */
  const createBackupJobForTest = async (config, mode) => {
    const jobId = await dispatchClient.backup.createBackupJob({ ...config, mode })
    const job = await dispatchClient.backup.details(jobId)
    assert.strictEqual(job.mode, mode, `Backup job mode should be '${mode}', got '${job.mode}'`)

    tracker.trackResource('backupJob', jobId, { name: config.name, mode })

    const scheduleKey = getScheduleKey(job)
    if (scheduleKey) {
      tracker.trackResource('schedule', scheduleKey, { name: config.name, backupJobId: jobId })
    }

    return { jobId, scheduleKey }
  }

  before(async () => {
    // Use VM directly from setup() to avoid stale references from previous runs
    const setupResult = await setup()
    dispatchClient = setupResult.dispatchClient
    tracker = setupResult.tracker
    vm = setupResult.vm

    assert.ok(vm, 'Setup should provide a test VM')
    console.log(`Using test VM from setup: ${vm.name_label} (${vm.uuid})`)

    // Get backup repository
    backupRepository = await dispatchClient.backupRepository.get({
      name: BACKUP_REPOSITORY_NAME,
    })

    if (!backupRepository) {
      console.warn(`Backup repository not found, creating it for tests...`)

      const backupRepositoryId = await dispatchClient.backupRepository.create(BACKUP_REPOSITORY_NAME, {
        path: process.env.BACKUP_REPOSITORY_PATH || '/tmp/xo-test-backups',
      })

      // eslint-disable-next-line require-atomic-updates -- sequential code in before() hook, no race condition
      backupRepository = await dispatchClient.backupRepository.get({ id: backupRepositoryId })

      if (!backupRepository) {
        throw new Error(`Failed to retrieve created backup repository ${backupRepositoryId}`)
      }

      tracker.trackResource('backupRepository', backupRepositoryId, {
        name: BACKUP_REPOSITORY_NAME,
      })
    }

    // Get SR for health checks and restorations
    const srId = process.env.SR_ID
    if (!srId) {
      throw new Error('SR_ID environment variable is required for combined tests')
    }

    sr = await dispatchClient.sr.details(srId)
    if (!sr) {
      throw new Error(`SR with ID "${srId}" not found`)
    }

    console.log(`Found SR: ${sr.name_label} (${sr.uuid})`)

    // Set export path
    exportPath = process.env.VHD_EXPORT_PATH || '/tmp/xo-test-exports'
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

    // Clean up restored VMs
    if (!dispatchClient) {
      return
    }

    for (const vmUuid of restoredVmUuids) {
      try {
        const vmDetails = await dispatchClient.vm.details(vmUuid)
        if (vmDetails.power_state === 'Running') {
          await dispatchClient.vm.stop(vmUuid, { force: true })
          await dispatchClient.vm.waitForPowerState(vmUuid, 'Halted', 60_000)
        }
        await dispatchClient.vm.delete(vmUuid, { deleteDisks: true })
        console.log(`Cleaned up restored VM: ${vmUuid}`)
      } catch (error) {
        console.warn(`Failed to cleanup restored VM ${vmUuid}: ${error.message}`)
      }
    }

    // Standard teardown
    if (dispatchClient && tracker) {
      await teardown(dispatchClient, tracker)
    }
  })

  // =========================================================================
  // Backup then Export Workflow
  // =========================================================================

  describe('Backup then Export Workflow', () => {
    after(purgeBackupData)

    it('should backup delta then export VM as XVA', async () => {
      // Step 1: Create and run backup (without health check - focus is on backup+export workflow)
      const name = generateBackupJobName()
      const schedule = getDefaultSchedule()
      const config = backupConfig(name, schedule, vm, backupRepository)

      const { jobId, scheduleKey } = await createBackupJobForTest(config, 'delta')
      assert.ok(scheduleKey, 'Schedule key is required')

      console.log(`Running delta backup before export...`)
      const backupResult = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)

      assertBackupSuccess(backupResult, 'Delta backup before XVA export')
      assertFullOrDelta(backupResult, backupRepository.id, { mustBeFull: true })
      console.log(`Backup completed successfully`)

      // Step 2: Export VM as XVA
      const fileName = generateExportFileName(`${vm.name_label}-combined-xva`, 'xva')
      const outputPath = path.join(exportPath, fileName)

      console.log(`Exporting VM as XVA after backup...`)
      const exportResult = await dispatchClient.vm.exportAsXva(vm.uuid, outputPath, {
        compress: true,
      })
      exportedFiles.push(exportResult.path)

      // Validate XVA integrity
      const validation = await validateXvaIntegrity(exportResult.path)
      assert.strictEqual(validation.valid, true, `XVA validation failed: ${validation.error}`)

      // Validate size
      const stats = await fs.stat(exportResult.path)
      assert.ok(stats.size > 0, 'Exported XVA file should not be empty')

      console.log(
        `Backup + Export XVA workflow completed: backup=${backupResult.status}, export=${formatBytes(exportResult.size)}`
      )
    })

    it('should backup delta then export VDI as VHD', async () => {
      // Step 1: Create and run backup
      const name = generateBackupJobName()
      const schedule = getDefaultSchedule()
      const config = backupConfig(name, schedule, vm, backupRepository)

      const { jobId, scheduleKey } = await createBackupJobForTest(config, 'delta')
      assert.ok(scheduleKey, 'Schedule key is required')

      console.log(`Running delta backup before VHD export...`)
      const backupResult = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)

      assertBackupSuccess(backupResult, 'Delta backup before VHD export')
      assertFullOrDelta(backupResult, backupRepository.id, { mustBeFull: true })
      console.log(`Backup completed successfully`)

      // Step 2: Export VDI as VHD
      const vdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
      assert.ok(vdis.length > 0, 'VM should have at least one VDI')

      const vdi = vdis[0]
      const fileName = generateExportFileName(`${vm.name_label}-combined-vhd`, 'vhd')
      const outputPath = path.join(exportPath, fileName)

      console.log(`Exporting VDI as VHD after backup: ${vdi.name_label} (${vdi.uuid})`)
      const exportResult = await dispatchClient.vdi.exportAsVhd(vdi.uuid, outputPath)
      exportedFiles.push(exportResult.path)

      // Validate VHD integrity
      const validation = await validateVhdIntegrity(exportResult.path)
      assert.strictEqual(validation.valid, true, `VHD validation failed: ${validation.error}`)

      console.log(
        `Backup + Export VHD workflow completed: backup=${backupResult.status}, VHD=${formatBytes(exportResult.size)}`
      )
    })
  })

  // =========================================================================
  // Backup then Restore Workflow
  // =========================================================================

  describe('Backup then Restore Workflow', () => {
    after(purgeBackupData)

    it('should backup full then restore VM from XVA export', async () => {
      // Step 1: Create and run full backup (without health check - focus is on backup+restore workflow)
      const name = generateBackupJobName()
      const schedule = getDefaultSchedule()
      const config = backupConfig(name, schedule, vm, backupRepository)

      const { jobId, scheduleKey } = await createBackupJobForTest(config, 'full')
      assert.ok(scheduleKey, 'Schedule key is required')

      console.log(`Running full backup before restoration...`)
      const backupResult = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)

      assertBackupSuccess(backupResult, 'Full backup before XVA restore')
      assertFullOrDelta(backupResult, backupRepository.id, { mustBeFull: true })
      console.log(`Full backup completed successfully`)

      // Step 2: Export VM as XVA
      const fileName = generateExportFileName(`${vm.name_label}-restore-xva`, 'xva')
      const outputPath = path.join(exportPath, fileName)

      console.log(`Exporting VM as XVA for restoration...`)
      const exportResult = await dispatchClient.vm.exportAsXva(vm.uuid, outputPath, {
        compress: true,
      })
      exportedFiles.push(exportResult.path)

      // Step 3: Import XVA to create a new VM
      console.log(`Importing XVA to restore VM...`)
      const restoredVmUuid = await dispatchClient.vm.importXva(exportResult.path, sr.uuid)

      assert.ok(restoredVmUuid, 'Import should return VM UUID')
      restoredVmUuids.push(restoredVmUuid)

      // Step 4: Validate restored VM
      const restoredVm = await dispatchClient.vm.details(restoredVmUuid)
      assert.ok(restoredVm, 'Restored VM should exist')
      assert.strictEqual(restoredVm.power_state, 'Halted', 'Restored VM should be in Halted state')

      console.log(`Backup + Restore workflow completed: ${restoredVm.name_label} (${restoredVmUuid})`)
    })

    it('should backup delta then restore VDI from VHD export', async () => {
      // Step 1: Run two delta backups — first is always full, second is the actual delta
      const name = generateBackupJobName()
      const schedule = getDefaultSchedule()
      const config = backupConfig(name, schedule, vm, backupRepository)

      const { jobId, scheduleKey } = await createBackupJobForTest(config, 'delta')
      assert.ok(scheduleKey, 'Schedule key is required')

      console.log(`Running first backup (full baseline)...`)
      const fullResult = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
      assertBackupSuccess(fullResult, 'Full baseline before delta')
      assertFullOrDelta(fullResult, backupRepository.id, { mustBeFull: true })
      console.log(`First backup completed (full)`)

      console.log(`Running second backup (delta)...`)
      const backupResult = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
      assertBackupSuccess(backupResult, 'Delta backup before VDI restore')
      assertFullOrDelta(backupResult, backupRepository.id, { mustBeFull: false })
      console.log(`Delta backup completed successfully`)

      // Step 2: Export VDI as VHD
      const vdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
      assert.ok(vdis.length > 0, 'VM should have at least one VDI')

      const vdi = vdis[0]
      const fileName = generateExportFileName(`${vm.name_label}-restore-vhd`, 'vhd')
      const outputPath = path.join(exportPath, fileName)

      console.log(`Exporting VDI as VHD: ${vdi.name_label}`)
      const exportResult = await dispatchClient.vdi.exportAsVhd(vdi.uuid, outputPath)
      exportedFiles.push(exportResult.path)

      // Step 3: Import VHD to create a new VDI
      console.log(`Importing VHD to restore VDI...`)
      const importedVdiUuid = await dispatchClient.vdi.importVhd(exportResult.path, sr.uuid)

      assert.ok(importedVdiUuid, 'Import should return VDI UUID')
      console.log(`VHD imported as new VDI: ${importedVdiUuid}`)

      // Step 4: Validate imported VDI
      const importedVdi = await dispatchClient.vdi.details(importedVdiUuid)
      assert.ok(importedVdi, 'Imported VDI should exist')
      assert.ok(importedVdi.uuid, 'Imported VDI should have a valid UUID')

      console.log(`Backup + VDI Restore workflow completed: VDI ${importedVdiUuid}`)
    })
  })

  // =========================================================================
  // Full Cycle - Backup -> Export -> Import -> Re-backup
  // =========================================================================

  describe('Full Cycle - Backup -> Export -> Import -> Re-backup', () => {
    after(purgeBackupData)

    it('should complete full backup-export-restore-backup cycle', async () => {
      // Step 1: Full backup of original VM (without health check - focus is on full cycle)
      const name1 = generateBackupJobName()
      const schedule1 = getDefaultSchedule()
      const config1 = backupConfig(name1, schedule1, vm, backupRepository)

      const { jobId: jobId1, scheduleKey: scheduleKey1 } = await createBackupJobForTest(config1, 'full')
      assert.ok(scheduleKey1, 'Schedule key is required')

      console.log(`Step 1/5: Running full backup of original VM...`)
      const backupResult1 = await dispatchClient.backup.runJobAndGetLog(jobId1, scheduleKey1)

      assertBackupSuccess(backupResult1, 'Initial full backup (cycle step 1)')
      assertFullOrDelta(backupResult1, backupRepository.id, { mustBeFull: true })
      console.log(`Step 1/5: Initial backup completed`)

      // Step 2: Export VM as XVA
      const fileName = generateExportFileName(`${vm.name_label}-cycle-xva`, 'xva')
      const outputPath = path.join(exportPath, fileName)

      console.log(`Step 2/5: Exporting VM as XVA...`)
      const exportResult = await dispatchClient.vm.exportAsXva(vm.uuid, outputPath, {
        compress: true,
      })
      exportedFiles.push(exportResult.path)

      const xvaValidation = await validateXvaIntegrity(exportResult.path)
      assert.strictEqual(xvaValidation.valid, true, `XVA validation failed: ${xvaValidation.error}`)
      console.log(`Step 2/5: XVA export completed (${formatBytes(exportResult.size)})`)

      // Step 3: Import XVA to create a restored VM
      console.log(`Step 3/5: Importing XVA to create restored VM...`)
      const restoredVmUuid = await dispatchClient.vm.importXva(exportResult.path, sr.uuid)

      assert.ok(restoredVmUuid, 'Import should return VM UUID')
      restoredVmUuids.push(restoredVmUuid)

      const restoredVm = await dispatchClient.vm.details(restoredVmUuid)
      assert.ok(restoredVm, 'Restored VM should exist')
      assert.strictEqual(restoredVm.power_state, 'Halted', 'Restored VM should be in Halted state')
      console.log(`Step 3/5: VM restored: ${restoredVm.name_label} (${restoredVmUuid})`)

      // Step 4: Create a backup job targeting the restored VM (without health check - restored VM may lack Xen Tools)
      const name2 = generateBackupJobName()
      const schedule2 = getDefaultSchedule()
      const config2 = backupConfig(name2, schedule2, restoredVm, backupRepository)

      const jobId2 = await dispatchClient.backup.createBackupJob({ ...config2, mode: 'delta' })
      const job2 = await dispatchClient.backup.details(jobId2)
      assert.strictEqual(job2.mode, 'delta', `Second backup job mode should be 'delta'`)

      tracker.trackResource('backupJob', jobId2, { name: name2, mode: 'delta' })

      const scheduleKey2 = getScheduleKey(job2)
      if (scheduleKey2) {
        tracker.trackResource('schedule', scheduleKey2, { name: name2, backupJobId: jobId2 })
      }
      assert.ok(scheduleKey2, 'Schedule key for second backup job is required')

      console.log(`Step 4/5: Created backup job for restored VM`)

      // Step 5: Run backup of the restored VM
      console.log(`Step 5/5: Running backup of restored VM...`)
      const backupResult2 = await dispatchClient.backup.runJobAndGetLog(jobId2, scheduleKey2)

      assertBackupSuccess(backupResult2, 'Re-backup of restored VM (cycle step 5)')
      console.log(`Step 5/5: Re-backup completed successfully`)

      console.log(`Full cycle completed: backup -> export -> import -> re-backup`)
    })
  })

  // =========================================================================
  // CR Mode - Delta Replication to SR (target VM reuse + snapshots)
  // =========================================================================

  describe('CR Mode - Delta Replication to SR', () => {
    it('should replicate VM to SR, reuse target VM on second run, and create snapshots', async () => {
      const targetSrUuid = sr.uuid

      // Create CR mode backup job: delta mode + srs (no remotes)
      const name = generateBackupJobName()
      const schedule = getDefaultSchedule()
      const config = {
        name,
        mode: 'delta',
        schedules: { '': schedule },
        settings: { '': { timezone: 'Europe/Paris', copyRetention: 3, mergeBackupsSynchronously: true } },
        vms: { [vm.uuid]: vm },
        srs: { [targetSrUuid]: true },
      }

      const jobId = await dispatchClient.backup.createBackupJob(config)
      const job = await dispatchClient.backup.details(jobId)
      assert.strictEqual(job.mode, 'delta', 'CR mode job should be delta')

      tracker.trackResource('backupJob', jobId, { name, mode: 'delta' })

      const scheduleKey = getScheduleKey(job)
      assert.ok(scheduleKey, 'Schedule key is required')
      tracker.trackResource('schedule', scheduleKey, { name, backupJobId: jobId })

      // Capture VM list before first replication to detect the new target VM
      const vmsBefore = await dispatchClient.vm.list()
      const vmUuidsBefore = new Set(vmsBefore.map(v => v.uuid))

      // --- First replication (full — no existing target) ---
      console.log('Running first CR replication (expected full)...')
      const result1 = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
      assertBackupSuccess(result1, 'First CR replication')
      assertFullOrDeltaForSr(result1, targetSrUuid, { mustBeFull: true })

      // Verify "target snapshot" task exists in the log
      const snapshotTask1 = findTaskByMessage(result1, 'target snapshot')
      assert.ok(snapshotTask1, 'First replication should include a "target snapshot" task')
      assert.strictEqual(snapshotTask1.status, 'success', 'Target snapshot task should succeed')

      // Find the newly created target VM
      const vmsAfterFirst = await dispatchClient.vm.list()
      const newVms = vmsAfterFirst.filter(v => !vmUuidsBefore.has(v.uuid))
      assert.strictEqual(newVms.length, 1, 'First replication should create exactly one new target VM')

      const targetVmUuid = newVms[0].uuid
      restoredVmUuids.push(targetVmUuid)
      console.log(`Target VM created: ${newVms[0].name_label} (${targetVmUuid})`)

      // Check target VM has at least one snapshot
      const targetVmAfterFirst = await dispatchClient.vm.details(targetVmUuid)
      assert.ok(targetVmAfterFirst, 'Target VM should exist')
      const snapshotsAfterFirst = targetVmAfterFirst.snapshots?.length ?? 0
      assert.ok(
        snapshotsAfterFirst >= 1,
        `Target VM should have ≥1 snapshot after first replication, got ${snapshotsAfterFirst}`
      )
      console.log(`Target VM has ${snapshotsAfterFirst} snapshot(s) after first replication`)

      // Record first transfer size for efficiency comparison
      const firstTransferSize = getBackupTransferredBytes(result1)
      console.log(`First replication transferred: ${firstTransferSize} bytes`)

      // --- Second replication (delta — should reuse target VM) ---
      console.log('Running second CR replication (expected delta)...')
      const result2 = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
      assertBackupSuccess(result2, 'Second CR replication')
      assertFullOrDeltaForSr(result2, targetSrUuid, { mustBeFull: false })

      // Verify "target snapshot" task in second run
      const snapshotTask2 = findTaskByMessage(result2, 'target snapshot')
      assert.ok(snapshotTask2, 'Second replication should include a "target snapshot" task')
      assert.strictEqual(snapshotTask2.status, 'success', 'Target snapshot task should succeed on second run')

      // Verify NO new VMs were created (target VM was reused)
      const vmsAfterSecond = await dispatchClient.vm.list()
      const newVmsAfterSecond = vmsAfterSecond.filter(v => !vmUuidsBefore.has(v.uuid))
      assert.strictEqual(
        newVmsAfterSecond.length,
        1,
        `Second replication should NOT create a new VM — expected 1 new VM total, got ${newVmsAfterSecond.length}`
      )

      // Target VM should now have more snapshots
      const targetVmAfterSecond = await dispatchClient.vm.details(targetVmUuid)
      const snapshotsAfterSecond = targetVmAfterSecond.snapshots?.length ?? 0
      assert.ok(
        snapshotsAfterSecond > snapshotsAfterFirst,
        `Target VM should have more snapshots after second replication ` +
          `(before: ${snapshotsAfterFirst}, after: ${snapshotsAfterSecond})`
      )
      console.log(`Target VM has ${snapshotsAfterSecond} snapshot(s) after second replication`)

      // Verify delta efficiency: second transfer should be ≤ first
      const secondTransferSize = getBackupTransferredBytes(result2)
      console.log(`Second replication transferred: ${secondTransferSize} bytes`)

      if (firstTransferSize !== null && secondTransferSize !== null) {
        assert.ok(
          secondTransferSize <= firstTransferSize,
          `Delta transfer (${secondTransferSize} bytes) should be ≤ full transfer (${firstTransferSize} bytes)`
        )
      }

      console.log(
        `CR mode test passed: target VM reused (${targetVmUuid}), ` +
          `snapshots ${snapshotsAfterFirst}→${snapshotsAfterSecond}, ` +
          `transfer ${firstTransferSize}→${secondTransferSize} bytes`
      )
    })
  })

  // =========================================================================
  // State Validation Between Operations
  // =========================================================================

  describe('State Validation Between Operations', () => {
    it('should maintain VM state consistency across backup and export', async () => {
      // Capture initial VM state
      const initialVm = await dispatchClient.vm.details(vm.uuid)
      const initialPowerState = initialVm.power_state
      const initialVdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
      const initialVdiCount = initialVdis.length

      console.log(`Initial state: power_state=${initialPowerState}, VDIs=${initialVdiCount}`)
      assert.ok(initialVdiCount > 0, 'VM should have at least one VDI')

      // Step 1: Run two delta backups — first is always full, second is the actual delta
      const name = generateBackupJobName()
      const schedule = getDefaultSchedule()
      const config = backupConfig(name, schedule, vm, backupRepository)

      const { jobId, scheduleKey } = await createBackupJobForTest(config, 'delta')
      assert.ok(scheduleKey, 'Schedule key is required')

      console.log(`Running first backup (full baseline)...`)
      const fullResult = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
      assertBackupSuccess(fullResult, 'Full baseline for state validation')
      assertFullOrDelta(fullResult, backupRepository.id, { mustBeFull: true })
      console.log(`First backup completed (full)`)

      console.log(`Running second backup (delta) and checking state consistency...`)
      const backupResult = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
      assertBackupSuccess(backupResult, 'Delta backup for state validation')
      assertFullOrDelta(backupResult, backupRepository.id, { mustBeFull: false })

      // Validate VM state unchanged after backup
      const afterBackupVm = await dispatchClient.vm.details(vm.uuid)
      assert.strictEqual(afterBackupVm.power_state, initialPowerState, 'Power state should be unchanged after backup')

      const afterBackupVdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
      assert.strictEqual(afterBackupVdis.length, initialVdiCount, 'VDI count should be unchanged after backup')
      console.log(
        `State after backup: power_state=${afterBackupVm.power_state}, VDIs=${afterBackupVdis.length} (unchanged)`
      )

      // Step 2: Export VM as XVA
      const fileName = generateExportFileName(`${vm.name_label}-state-check`, 'xva')
      const outputPath = path.join(exportPath, fileName)

      console.log(`Exporting VM and checking state consistency...`)
      const exportResult = await dispatchClient.vm.exportAsXva(vm.uuid, outputPath, {
        compress: false,
      })
      exportedFiles.push(exportResult.path)

      // Validate VM state unchanged after export
      const afterExportVm = await dispatchClient.vm.details(vm.uuid)
      assert.strictEqual(afterExportVm.power_state, initialPowerState, 'Power state should be unchanged after export')

      const afterExportVdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
      assert.strictEqual(afterExportVdis.length, initialVdiCount, 'VDI count should be unchanged after export')
      console.log(
        `State after export: power_state=${afterExportVm.power_state}, VDIs=${afterExportVdis.length} (unchanged)`
      )

      // Validate export integrity
      const validation = await validateXvaIntegrity(exportResult.path)
      assert.strictEqual(validation.valid, true, `XVA validation failed: ${validation.error}`)

      console.log(`State validation completed: VM state consistent across all operations`)
    })
  })
})
