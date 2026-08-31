import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import { backupConfig } from '../backup.config.js'
import { FilterBuilder } from '../client/FilterBuilder.js'
import {
  assertFullOrDelta,
  assertFullOrDeltaForSr,
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

  // Replica VMs created on the destination SR by the CR test; the resource
  // tracker only tracks the job, so they must be deleted explicitly.
  const replicatedVmUuids = []

  before(async () => {
    ;({ dispatchClient, tracker } = await setup({ requiredVmQty: 2 }))

    // Look for test VMs with incremental naming pattern
    const vmPrefix = getRequiredEnv('VM_PREFIX')
    const filter = FilterBuilder.create().withGlob('name_label', `${vmPrefix}-QA-Test-*`)
    const qaVms = await dispatchClient.vm.list(filter)

    assert(
      qaVms.length >= 2,
      `at least 2 VM with pattern "${vmPrefix}-QA-Test-*" are required - backup tests cannot run`
    )

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

    it('should run a synchronized delta backup and reuse the batch snapshots as the delta base on the second run', async () => {
      await createBackupJobForTest(synchronizedConfig, 'delta')
      const job = await dispatchClient.backup.details(backupJobId)
      const realScheduleKey = getScheduleKey(job)

      // Does 2 backups, first one is full synchronized, second one is a delta.y
      for (let index = 0; index < 2; index++) {
        const result = await dispatchClient.backup.runJobAndGetLog(backupJobId, realScheduleKey)
        assertBackupSuccess(result, index === 0 ? 'Synchronized full backup' : 'Synchronized delta backup')
        assertFullOrDelta(result, backupRepository.id, { mustBeFull: index === 0 })
        assertSynchronizedSnapshot(result, vms.length)
      }
    })

    it('should replicate a synchronized delta backup and reuse the batch snapshots on the second run', async () => {
      // reuse the same SR the suite already requires; same-SR replication is fine
      const targetSrId = getRequiredEnv('SR_ID')

      const crConfig = {
        name: generateBackupJobName(),
        mode: 'delta',
        schedules: { '': getDefaultSchedule() },
        settings: {
          '': {
            timezone: 'Europe/Paris',
            copyRetention: 3,
            preferNbd: true,
            bypassVdiChainsCheck: true,
            synchronizedSnapshot: true,
          },
        },
        vms: Object.fromEntries(vms.map(vm => [vm.uuid, vm])),
        srs: { [targetSrId]: true },
      }

      backupJobId = await dispatchClient.backup.createBackupJob(crConfig)
      const job = await dispatchClient.backup.details(backupJobId)
      assert(job.mode === 'delta')
      tracker.trackResource('backupJob', backupJobId, { name: crConfig.name, mode: 'delta' })
      const realScheduleKey = getScheduleKey(job)
      if (realScheduleKey) {
        tracker.trackResource('schedule', realScheduleKey, { name: crConfig.name, backupJobId })
      }

      const vmUuidsBefore = new Set((await dispatchClient.vm.list()).map(vm => vm.uuid))

      // First run is a full replication (creates the replicas); the second must
      // come back as an incremental, which is only possible if the batch
      // snapshots survived the pre-transfer retention pass as the delta base.
      for (let index = 0; index < 2; index++) {
        const result = await dispatchClient.backup.runJobAndGetLog(backupJobId, realScheduleKey)
        assertBackupSuccess(result, index === 0 ? 'Synchronized full replication' : 'Synchronized delta replication')
        assertFullOrDeltaForSr(result, targetSrId, { mustBeFull: index === 0 })
        assertSynchronizedSnapshot(result, vms.length)
      }

      const replicas = (await dispatchClient.vm.list()).filter(vm => !vmUuidsBefore.has(vm.uuid)).map(vm => vm.uuid)
      replicatedVmUuids.push(...replicas)
      assert.strictEqual(replicas.length, vms.length, 'one replica should be created per source VM')
    })
  })

  const cleanupVms = async vmUuids => {
    for (const vmUuid of vmUuids) {
      try {
        const vmDetails = await dispatchClient.vm.details(vmUuid)
        if (vmDetails?.power_state === 'Running') {
          await dispatchClient.vm.stop(vmUuid, { force: true })
          await dispatchClient.vm.waitForPowerState(vmUuid, 'Halted', 60_000)
        }
        await dispatchClient.vm.delete(vmUuid, { deleteDisks: true })
        log.debug('Cleaned up replica VM', { uuid: vmUuid })
      } catch (error) {
        log.warn('Failed to clean up replica VM', { uuid: vmUuid, error })
      }
    }
  }

  after(async () => {
    await cleanupVms(replicatedVmUuids)
    await teardown(dispatchClient, tracker)
  })
})
