import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import { backupConfig } from '../backup.config.js'
import { FilterBuilder } from '../client/FilterBuilder.js'
import {
  assertFullOrDelta,
  findTaskByMessage,
  generateBackupJobName,
  getDefaultSchedule,
  getScheduleKey,
  getRequiredEnv,
} from '../utils/index.js'
import { assertBackupSuccess, assertSynchronizedSnapshot } from '../utils/backupUtils.js'
import { setup, teardown } from './setup.js'

const log = createLogger('qa:backup:base')

describe('Backup basic tests', () => {
  let vms
  let backupRepository
  let healthCheckSr
  let name
  let defaultSchedule
  let backupJob
  let backupJobId
  let defaultConfig
  let synchronizedConfig
  let dispatchClient
  let tracker
  let createBackupJobForTest

  before(async () => {
    ;({ dispatchClient, tracker } = await setup({ requiredVmQty: 2 }))

    // Look for test VMs with incremental naming pattern
    const vmPrefix = getRequiredEnv('VM_PREFIX')
    const filter = FilterBuilder.create().withGlob('name_label', `${vmPrefix}-QA-Test-*`)
    const qaVms = await dispatchClient.vm.list(filter)

    assert(qaVms.length > 0, `Required VM with pattern "${vmPrefix}-QA-Test-*" not found - backup tests cannot run`)

    // Use the first available QA VM for backup tests
    vms = qaVms.slice(0, 2)
    log.debug(
      'Found test VMs for backup sync tests',
      { name: vms[0].name_label, uuid: vms[0].uuid },
      { name: vms[1].name_label, uuid: vms[1].uuid }
    )

    const backupRepositoryName = getRequiredEnv('BACKUP_REPOSITORY_NAME')
    backupRepository = await dispatchClient.backupRepository.get({ name: backupRepositoryName })

    if (!backupRepository) {
      log.warn('Backup repository not found, creating it for tests', { name: backupRepositoryName })

      // Create the backup repository for testing
      try {
        const backupRepositoryId = await dispatchClient.backupRepository.create(backupRepositoryName, {
          url: getRequiredEnv('BACKUP_REPOSITORY_URL'),
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
    defaultConfig = backupConfig(name, defaultSchedule, vms, backupRepository)
    synchronizedConfig = backupConfig(name, defaultSchedule, vms, backupRepository, {
      synchronizedSnapshot: true,
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

  describe('Run synchronized backup jobs', () => {
    it('should run the backup job in full mode', async () => {
      await createBackupJobForTest(defaultConfig, 'full')
      const job = await dispatchClient.backup.details(backupJobId)
      const realScheduleKey = getScheduleKey(job)

      const result = await dispatchClient.backup.runJobAndGetLog(backupJobId, realScheduleKey)
      assertBackupSuccess(result, 'Synchronized full backup')
      assertFullOrDelta(result, backupRepository.id, { mustBeFull: true })

      assert(findTaskByMessage(result, 'snapshot VMs') === null, `No batch snapshot should have been performed`)
    })

    it('should run the backup job in full mode and synchronized', async () => {
      await createBackupJobForTest(synchronizedConfig, 'full')
      const job = await dispatchClient.backup.details(backupJobId)
      const realScheduleKey = getScheduleKey(job)

      const result = await dispatchClient.backup.runJobAndGetLog(backupJobId, realScheduleKey)
      assertBackupSuccess(result, 'Synchronized full backup')
      assertFullOrDelta(result, backupRepository.id, { mustBeFull: true })

      assertSynchronizedSnapshot(result, vms.length)
    })
  })

  after(async () => {
    await teardown(dispatchClient, tracker)
  })
})
