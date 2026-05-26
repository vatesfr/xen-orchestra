import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import { backupConfig } from '../backup.config.js'
import { FilterBuilder } from '../client/FilterBuilder.js'
import {
  assertFullOrDelta,
  generateBackupJobName,
  getDefaultSchedule,
  getScheduleKey,
  extractHealthCheckData,
  assertHealthCheckExists,
  assertHealthCheckSuccess,
  getRequiredEnv,
} from '../utils/index.js'
import { assertBackupSuccess } from '../utils/backupUtils.js'
import { setup, teardown } from './setup.js'

const log = createLogger('qa:backup:base')

describe('Backup basic tests', () => {
  let vm
  let backupRepository
  let healthCheckSr
  let name
  let defaultSchedule
  let backupJob
  let backupJobId
  let defaultConfig
  let dispatchClient
  let tracker
  let createBackupJobForTest

  before(async () => {
    ;({ dispatchClient, tracker } = await setup())

    // Look for test VMs with incremental naming pattern
    const vmPrefix = getRequiredEnv('VM_PREFIX')
    const filter = FilterBuilder.create().withGlob('name_label', `${vmPrefix}-QA-Test-*`)
    const qaVms = await dispatchClient.vm.list(filter)

    assert(qaVms.length > 0, `Required VM with pattern "${vmPrefix}-QA-Test-*" not found - backup tests cannot run`)

    // Use the first available QA VM for backup tests
    vm = qaVms[0]
    log.debug('Found test VM for backup tests', { name: vm.name_label, uuid: vm.uuid })

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
          `Backup repository "${backupRepositoryName}" is required for backup tests - could not create it: ${error.message}`
        )
      }
    }

    // Get SR for health checks by ID
    const srId = getRequiredEnv('SR_ID')

    log.debug('Getting SR for health checks', { srId })
    healthCheckSr = await dispatchClient.sr.details(srId)

    if (!healthCheckSr) {
      throw new Error(`SR with ID "${srId}" not found - cannot run backup tests with health checks`)
    }

    log.debug('Found SR for health checks', { name: healthCheckSr.name_label })

    name = generateBackupJobName()
    defaultSchedule = getDefaultSchedule()
    defaultConfig = backupConfig(name, defaultSchedule, vm, backupRepository, {
      healthCheckSr: healthCheckSr.uuid,
    })

    // Functions for easy tests
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
  describe('Create backup job', () => {
    it('should display a backup job', async () => {
      await createBackupJobForTest(defaultConfig, 'delta')
      assert(backupJob.name === name)
    })
  })
  describe('Run backup jobs', () => {
    it('should run the backup job in delta mode with health checks', async () => {
      await createBackupJobForTest(defaultConfig, 'delta')
      const job = await dispatchClient.backup.details(backupJobId)
      const realScheduleKey = getScheduleKey(job)
      assert(realScheduleKey, 'Schedule key is required but was undefined')

      for (let index = 0; index < 3; index++) {
        const result = await dispatchClient.backup.runJobAndGetLog(backupJobId, realScheduleKey)
        assertBackupSuccess(result, `Delta backup run ${index + 1}/3`)
        assertFullOrDelta(result, backupRepository.id, { mustBeFull: index === 0 })

        // Validate health check
        assertHealthCheckExists(result)
        assertHealthCheckSuccess(result)
        const healthCheckData = extractHealthCheckData(result)
        log.debug('Health check validated', { status: healthCheckData.status, duration: healthCheckData.duration })
      }
    })
    it('should run the backup job in full mode with health checks', async () => {
      await createBackupJobForTest(defaultConfig, 'full')
      const job = await dispatchClient.backup.details(backupJobId)
      const realScheduleKey = getScheduleKey(job)
      assert(realScheduleKey, 'Schedule key is required but was undefined')

      const result = await dispatchClient.backup.runJobAndGetLog(backupJobId, realScheduleKey)
      assertBackupSuccess(result, 'Full backup with health checks')
      assertFullOrDelta(result, backupRepository.id, { mustBeFull: true })

      // Validate health check
      assertHealthCheckExists(result)
      assertHealthCheckSuccess(result)
      const healthCheckData = extractHealthCheckData(result)
      log.debug('Health check validated', { status: healthCheckData.status, duration: healthCheckData.duration })
    })
    it('should run backup without health check when SR not configured', async () => {
      const name = generateBackupJobName()
      const schedule = getDefaultSchedule()
      const configWithoutHealthCheck = backupConfig(name, schedule, vm, backupRepository)

      await createBackupJobForTest(configWithoutHealthCheck, 'delta')
      const job = await dispatchClient.backup.details(backupJobId)
      const realScheduleKey = getScheduleKey(job)

      const result = await dispatchClient.backup.runJobAndGetLog(backupJobId, realScheduleKey)
      assert.strictEqual(result.status, 'success', 'Backup should succeed without health check')

      const healthCheckData = extractHealthCheckData(result)
      assert.strictEqual(healthCheckData.exists, false, 'Health check should not exist')
      log.debug('Backup without health check: confirmed no health check task')
    })
    it('should detect health check task with different statuses', async () => {
      // Test success status
      const mockLogSuccess = {
        tasks: [
          {
            message: 'export',
            tasks: [
              {
                message: 'health check',
                status: 'success',
                start: 1000,
                end: 2000,
              },
            ],
          },
        ],
      }

      const successData = extractHealthCheckData(mockLogSuccess)
      assert(successData.exists, 'Should find health check')
      assert.strictEqual(successData.status, 'success', 'Should detect success status')
      assert.strictEqual(successData.duration, 1000, 'Should calculate duration')

      // Test failure status
      const mockLogFailure = {
        tasks: [
          {
            message: 'export',
            tasks: [
              {
                message: 'health check',
                status: 'failure',
                start: 1000,
                end: 2000,
                error: { message: 'VM failed to start' },
              },
            ],
          },
        ],
      }

      const failureData = extractHealthCheckData(mockLogFailure)
      assert(failureData.exists, 'Should find failed health check')
      assert.strictEqual(failureData.status, 'failure', 'Should detect failure status')
      assert(failureData.error, 'Should have error details')
      assert.strictEqual(failureData.error.message, 'VM failed to start', 'Should extract error message')

      // Test that assertHealthCheckSuccess throws on failure
      try {
        assertHealthCheckSuccess(mockLogFailure)
        assert.fail('Should have thrown error for failed health check')
      } catch (error) {
        assert(error.message.includes('failure'), 'Error should mention failure status')
        assert(error.message.includes('VM failed to start'), 'Error should include failure details')
      }

      log.debug('Health check error detection validated')
    })
  })

  after(async () => {
    await teardown(dispatchClient, tracker)
  })
})
