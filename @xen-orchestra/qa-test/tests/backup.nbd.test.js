import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

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
  getRequiredEnv,
} from '../utils/index.js'
import { assertBackupSuccess } from '../utils/backupUtils.js'
import { setup, teardown } from './setup.js'

const log = createLogger('qa:backup:nbd')

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
    const vmPrefix = getRequiredEnv('VM_PREFIX')
    const filter = FilterBuilder.create().withGlob('name_label', `${vmPrefix}-QA-Test-*`)
    const qaVms = await dispatchClient.vm.list(filter)

    assert(qaVms.length > 0, `Required VM with pattern "${vmPrefix}-QA-Test-*" not found - NBD backup tests cannot run`)

    // Use the first available QA VM for backup tests
    vm = qaVms[0]
    log.debug('Found test VM for NBD backup tests', { name: vm.name_label, uuid: vm.uuid })

    const backupRepositoryName = getRequiredEnv('BACKUP_REPOSITORY_NAME')
    backupRepository = await dispatchClient.backupRepository.get({ name: backupRepositoryName })

    if (!backupRepository) {
      log.warn('Backup repository not found, creating it for tests', { name: backupRepositoryName })

      // Create the backup repository for testing
      try {
        const backupRepositoryId = await dispatchClient.backupRepository.create(backupRepositoryName, {
          path: getRequiredEnv('BACKUP_REPOSITORY_PATH'),
        })

        // Fetch the canonical repository object from the API
        // eslint-disable-next-line require-atomic-updates -- sequential code in before() hook, no race condition
        backupRepository = await dispatchClient.backupRepository.get({ id: backupRepositoryId })

        if (!backupRepository) {
          throw new Error(`Failed to retrieve created backup repository ${backupRepositoryId}`)
        }

        // Track the newly created repository for cleanup
        tracker.trackResource('backupRepository', backupRepositoryId, { name: backupRepositoryName })
      } catch (error) {
        log.warn('Failed to create test backup repository', { error })
        assert.fail(
          `Backup repository "${backupRepositoryName}" is required for NBD backup tests - could not create it: ${error.message}`
        )
      }
    }

    // Get SR for health checks by ID
    const srId = getRequiredEnv('SR_ID')

    log.debug('Getting SR for health checks', { srId })
    healthCheckSr = await dispatchClient.sr.details(srId)

    if (!healthCheckSr) {
      throw new Error(`SR with ID "${srId}" not found - cannot run NBD backup tests with health checks`)
    }

    log.debug('Found SR for health checks', { name: healthCheckSr.name_label })

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
        log.debug('Running backup', { run: index + 1, of: 3, type: index === 0 ? 'FULL' : 'DELTA' })
        const result = await dispatchClient.backup.runJobAndGetLog(backupJobId, realScheduleKey)

        assertBackupSuccess(result, `Backup ${index + 1}`)
        assertFullOrDelta(result, backupRepository.id, { mustBeFull: index === 0 })

        backupLogs.push(result)

        // Log transfer information
        const transferredBytes = getBackupTransferredBytes(result)
        const transferredMB = transferredBytes === null ? 'N/A' : (transferredBytes / 1024 / 1024).toFixed(2)

        log.debug('Backup completed', { run: index + 1, type: index === 0 ? 'FULL' : 'DELTA', transferredMB })

        // Validate health check
        const healthCheckData = extractHealthCheckData(result)
        if (healthCheckData.exists) {
          assertHealthCheckSuccess(result)
          log.debug('Health check passed', { status: healthCheckData.status })
        }
      }

      assertIncrementalBackupEfficiency(backupLogs[1], backupLogs[0])
      assertIncrementalBackupEfficiency(backupLogs[2], backupLogs[0])
      log.debug('Incremental backups are efficient (delta < full)')
    })
  })

  describe('NBD Concurrency Configuration', () => {
    it('should work with different NBD concurrency settings', async () => {
      const concurrencySettings = [1, 4]

      for (const nbdConcurrency of concurrencySettings) {
        log.debug('Testing NBD concurrency', { nbdConcurrency })

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
        log.debug('NBD backup completed', { nbdConcurrency, transferredMB })
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

      log.debug('Testing NBD compatibility with health checks', { preferNbd: true, nbdConcurrency: 2 })

      // Run first backup (full) with health check
      log.debug('Running full backup with health check')
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
      log.debug('Running delta backup with health check')
      const deltaBackup = await dispatchClient.backup.runJobAndGetLog(backupJobId, realScheduleKey)

      assertBackupSuccess(deltaBackup, 'Delta backup with health check')
      assertFullOrDelta(deltaBackup, backupRepository.id, { mustBeFull: false })

      // Validate health check on delta backup
      const deltaHealthCheck = extractHealthCheckData(deltaBackup)
      assert(deltaHealthCheck.exists, 'Health check should be present for delta backup')
      assertHealthCheckSuccess(deltaBackup)

      const deltaBytes = getBackupTransferredBytes(deltaBackup)
      const deltaMB = deltaBytes === null ? 'N/A' : (deltaBytes / 1024 / 1024).toFixed(2)

      log.debug('NBD + Health Check integration complete', {
        full: { sizeMB: fullMB, healthCheck: fullHealthCheck.status, duration: fullHealthCheck.duration },
        delta: { sizeMB: deltaMB, healthCheck: deltaHealthCheck.status, duration: deltaHealthCheck.duration },
      })
    })
  })

  after(async () => {
    await teardown(dispatchClient, tracker)
  })
})
