import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'

import { backupConfig } from '../backup.config.js'
import { FilterBuilder } from '../client/FilterBuilder.js'
import {
  assertFullOrDelta,
  assertHealthCheckSuccess,
  assertIncrementalBackupEfficiency,
  extractHealthCheckData,
  generateBackupJobName,
  getBackupTransferredBytes,
  getDefaultSchedule,
  getScheduleKey,
} from '../utils/index.js'
import { assertBackupSuccess } from '../utils/backupUtils.js'
import { setup, teardown } from './setup.js'

describe('NBD Incremental Backup Tests', () => {
  let vm
  let backupRepository
  let healthCheckSr
  let backupJob
  let backupJobId
  let dispatchClient
  let tracker
  let createBackupJobForTest

  before(async () => {
    ;({ dispatchClient, tracker } = await setup())

    // Look for test VMs with incremental naming pattern
    const vmPrefix = process.env.VM_PREFIX || 'TST'
    const filter = FilterBuilder.create().withGlob('name_label', `${vmPrefix}-QA-Test-*`)
    const qaVms = await dispatchClient.vm.list(filter)

    assert(qaVms.length > 0, `Required VM with pattern "${vmPrefix}-QA-Test-*" not found - NBD backup tests cannot run`)

    // Use the first available QA VM for backup tests
    vm = qaVms[0]
    console.log(`✅ Found test VM for NBD backup tests: ${vm.name_label} (${vm.uuid})`)

    backupRepository = await dispatchClient.backupRepository.get({
      name: process.env.BACKUP_REPOSITORY_NAME || 'Test backup QA',
    })

    if (!backupRepository) {
      console.warn(
        `⚠️ Backup repository "${process.env.BACKUP_REPOSITORY_NAME || 'Test backup QA'}" not found, creating it for tests...`
      )

      // Create the backup repository for testing
      try {
        const backupRepositoryId = await dispatchClient.backupRepository.create(
          process.env.BACKUP_REPOSITORY_NAME || 'Test backup QA',
          {
            path: process.env.BACKUP_REPOSITORY_PATH || '/tmp/xo-test-backups',
          }
        )

        // Fetch the canonical repository object from the API
        // eslint-disable-next-line require-atomic-updates -- sequential code in before() hook, no race condition
        backupRepository = await dispatchClient.backupRepository.get({ id: backupRepositoryId })

        if (!backupRepository) {
          throw new Error(`Failed to retrieve created backup repository ${backupRepositoryId}`)
        }

        // Track the newly created repository for cleanup
        tracker.trackResource('backupRepository', backupRepositoryId, {
          name: process.env.BACKUP_REPOSITORY_NAME || 'Test backup QA',
        })
      } catch (error) {
        console.error('❌ Failed to create test backup repository:', error.message)
        assert.fail(
          `Backup repository "${process.env.BACKUP_REPOSITORY_NAME || 'Test backup QA'}" is required for NBD backup tests - could not create it: ${error.message}`
        )
      }
    }

    // Get SR for health checks by ID
    const srId = process.env.SR_ID
    if (!srId) {
      throw new Error('SR_ID environment variable is required for NBD backup tests with health checks')
    }

    console.log(`🔍 Getting SR for health checks by ID: ${srId}`)
    healthCheckSr = await dispatchClient.sr.details(srId)

    if (!healthCheckSr) {
      throw new Error(`SR with ID "${srId}" not found - cannot run NBD backup tests with health checks`)
    }

    console.log(`✅ Found SR for health checks: ${healthCheckSr.name_label}`)

    // Helper functions for NBD tests
    createBackupJobForTest = async (config, mode) => {
      config.mode = mode
      backupJobId = await dispatchClient.backup.createBackupJob(config)
      backupJob = await dispatchClient.backup.details(backupJobId)
      assert(backupJob.mode === mode)

      // Track the backup job and its schedule for cleanup
      tracker.trackResource('backupJob', backupJobId, { name: config.name, mode })

      // Track the schedule (schedules are in the settings object)
      const scheduleKey = getScheduleKey(backupJob)
      if (scheduleKey) {
        tracker.trackResource('schedule', scheduleKey, { name: config.name, backupJobId })
      }
    }
  })

  describe('Incremental Backup Sequence with NBD', () => {
    it('should perform full then incremental backups with NBD', async () => {
      const name = generateBackupJobName()
      const schedule = getDefaultSchedule()
      const config = backupConfig(name, schedule, vm, backupRepository, {
        healthCheckSr: healthCheckSr.uuid,
        preferNbd: true,
        nbdConcurrency: 1,
      })

      await createBackupJobForTest(config, 'delta')
      const job = await dispatchClient.backup.details(backupJobId)
      const realScheduleKey = getScheduleKey(job)
      assert(realScheduleKey, 'Schedule key is required but was undefined')

      const backupLogs = []

      // Run three backups: full, delta, delta
      for (let index = 0; index < 3; index++) {
        console.log(`\n🚀 Running backup ${index + 1}/3 (${index === 0 ? 'FULL' : 'DELTA'})...`)
        const result = await dispatchClient.backup.runJobAndGetLog(backupJobId, realScheduleKey)

        assertBackupSuccess(result, `Backup ${index + 1}`)
        assertFullOrDelta(result, backupRepository.id, { mustBeFull: index === 0 })

        backupLogs.push(result)

        // Log transfer information
        const transferredBytes = getBackupTransferredBytes(result)
        const transferredMB = transferredBytes === null ? 'N/A' : (transferredBytes / 1024 / 1024).toFixed(2)

        console.log(`✅ Backup ${index + 1} completed:`)
        console.log(`   - Type: ${index === 0 ? 'FULL' : 'DELTA'}`)
        console.log(`   - Transferred: ${transferredMB} MB`)

        // Validate health check
        const healthCheckData = extractHealthCheckData(result)
        if (healthCheckData.exists) {
          assertHealthCheckSuccess(result)
          console.log(`   - Health check: ${healthCheckData.status}`)
        }
      }

      // Validate incremental backup efficiency
      console.log('\n📊 Validating incremental backup efficiency...')
      assertIncrementalBackupEfficiency(backupLogs[1], backupLogs[0])
      assertIncrementalBackupEfficiency(backupLogs[2], backupLogs[0])
      console.log('✅ Incremental backups are efficient (delta < full)')
    })
  })

  describe('NBD Concurrency Configuration', () => {
    it('should work with different NBD concurrency settings', async () => {
      const concurrencySettings = [1, 4]

      for (const nbdConcurrency of concurrencySettings) {
        console.log(`\n🔧 Testing NBD with concurrency=${nbdConcurrency}...`)

        const name = generateBackupJobName()
        const schedule = getDefaultSchedule()
        const config = backupConfig(name, schedule, vm, backupRepository, {
          healthCheckSr: healthCheckSr.uuid,
          preferNbd: true,
          nbdConcurrency,
        })

        await createBackupJobForTest(config, 'delta')
        const job = await dispatchClient.backup.details(backupJobId)
        const realScheduleKey = getScheduleKey(job)

        const result = await dispatchClient.backup.runJobAndGetLog(backupJobId, realScheduleKey)
        assertBackupSuccess(result, `Backup with nbdConcurrency=${nbdConcurrency}`)

        const transferredBytes = getBackupTransferredBytes(result)
        const transferredMB = transferredBytes === null ? 'N/A' : (transferredBytes / 1024 / 1024).toFixed(2)
        console.log(`✅ NBD backup with concurrency=${nbdConcurrency} completed: ${transferredMB} MB`)
      }
    })
  })

  describe('Health Check Integration with NBD', () => {
    it('should perform health checks successfully with NBD-enabled backups', async () => {
      const name = generateBackupJobName()
      const schedule = getDefaultSchedule()
      const config = backupConfig(name, schedule, vm, backupRepository, {
        healthCheckSr: healthCheckSr.uuid,
        preferNbd: true,
        nbdConcurrency: 2,
      })

      await createBackupJobForTest(config, 'delta')
      const job = await dispatchClient.backup.details(backupJobId)
      const realScheduleKey = getScheduleKey(job)

      console.log('\n🏥 Testing NBD compatibility with health checks...')
      console.log('   Configuration:')
      console.log('   - NBD enabled (preferNbd=true)')
      console.log('   - Health check SR configured')
      console.log('   - NBD concurrency: 2')

      // Run first backup (full) with health check
      console.log('\n🚀 Running full backup with health check...')
      const fullBackup = await dispatchClient.backup.runJobAndGetLog(backupJobId, realScheduleKey)

      assertBackupSuccess(fullBackup, 'Full backup with health check')
      assertFullOrDelta(fullBackup, backupRepository.id, { mustBeFull: true })

      // Validate health check on full backup
      const fullHealthCheck = extractHealthCheckData(fullBackup)
      assert(fullHealthCheck.exists, 'Health check should be present for full backup')
      assertHealthCheckSuccess(fullBackup)

      const fullBytes = getBackupTransferredBytes(fullBackup)
      const fullMB = fullBytes === null ? 'N/A' : (fullBytes / 1024 / 1024).toFixed(2)

      // Run second backup (delta) with health check
      console.log('\n🚀 Running delta backup with health check...')
      const deltaBackup = await dispatchClient.backup.runJobAndGetLog(backupJobId, realScheduleKey)

      assertBackupSuccess(deltaBackup, 'Delta backup with health check')
      assertFullOrDelta(deltaBackup, backupRepository.id, { mustBeFull: false })

      // Validate health check on delta backup
      const deltaHealthCheck = extractHealthCheckData(deltaBackup)
      assert(deltaHealthCheck.exists, 'Health check should be present for delta backup')
      assertHealthCheckSuccess(deltaBackup)

      const deltaBytes = getBackupTransferredBytes(deltaBackup)
      const deltaMB = deltaBytes === null ? 'N/A' : (deltaBytes / 1024 / 1024).toFixed(2)

      // Summary
      console.log('\n✅ NBD + Health Check Integration Test Complete:')
      console.log('   Full backup:')
      console.log(`     - Size: ${fullMB} MB`)
      console.log(`     - Health check: ${fullHealthCheck.status} (${fullHealthCheck.duration}ms)`)
      console.log('   Delta backup:')
      console.log(`     - Size: ${deltaMB} MB`)
      console.log(`     - Health check: ${deltaHealthCheck.status} (${deltaHealthCheck.duration}ms)`)
      console.log('   ✓ NBD and health checks are fully compatible')
    })
  })

  after(async () => {
    await teardown(dispatchClient, tracker)
  })
})
