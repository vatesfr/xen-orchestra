import '../logSetup.js'
import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import { DispatchClient } from '../client/dispatchClient.js'
import { createResourceTracker } from '../utils/resourceTracker.js'
import { delay, generateBackupJobName, getDefaultSchedule, getRequiredEnv, getScheduleKey } from '../utils/index.js'
import { assertBackupSuccess } from '../utils/backupUtils.js'

const log = createLogger('qa:backup:metadata')

/**
 * Recursively finds the first task whose data.type matches the given type.
 * Metadata backup logs contain top-level tasks typed 'pool' and 'xo'.
 *
 * @param {Array} tasks - Task array from the backup log
 * @param {'pool'|'xo'} type - Target task type
 * @returns {Object|null} Matching task or null
 */
function findMetadataTask(tasks, type) {
  if (!Array.isArray(tasks)) return null
  for (const task of tasks) {
    if (task.data?.type === type) return task
    if (task.tasks?.length > 0) {
      const found = findMetadataTask(task.tasks, type)
      if (found !== null) return found
    }
  }
  return null
}

/**
 * Asserts that a metadata task of the given type exists and succeeded.
 *
 * @param {Object} logEntry - Backup log returned by runMetadataJobAndGetLog
 * @param {'pool'|'xo'} type - Metadata task type to assert on
 */
function assertMetadataTaskSuccess(logEntry, type) {
  const task = findMetadataTask(logEntry.tasks ?? [], type)
  assert.ok(task, `Metadata backup log should contain a "${type}" task (data.type === "${type}")`)
  assert.strictEqual(
    task.status,
    'success',
    `Metadata "${type}" task should have status "success", got "${task.status}"`
  )
}

describe('Metadata backup tests', () => {
  /** @type {DispatchClient} */
  let dispatchClient
  /** @type {ReturnType<typeof createResourceTracker>} */
  let tracker
  /** @type {{id: string, name: string}} */
  let backupRepository
  /** @type {string} */
  let poolId

  before(async () => {
    tracker = createResourceTracker()
    dispatchClient = new DispatchClient()
    await dispatchClient.initialize()

    poolId = getRequiredEnv('POOL_ID')

    const backupRepositoryName = getRequiredEnv('BACKUP_REPOSITORY_NAME')
    backupRepository = await dispatchClient.backupRepository.get({ name: backupRepositoryName })

    if (!backupRepository) {
      log.warn('Backup repository not found, creating it for tests', { name: backupRepositoryName })

      const backupRepositoryId = await dispatchClient.backupRepository.create(backupRepositoryName, {
        path: getRequiredEnv('BACKUP_REPOSITORY_PATH'),
      })

      // eslint-disable-next-line require-atomic-updates -- sequential code in before() hook, no race condition
      backupRepository = await dispatchClient.backupRepository.get({ id: backupRepositoryId })

      if (!backupRepository) {
        throw new Error(`Failed to retrieve created backup repository ${backupRepositoryId}`)
      }

      tracker.trackResource('backupRepository', backupRepositoryId, { name: backupRepositoryName })
    }

    log.debug('Setup complete', { poolId, backupRepositoryId: backupRepository.id })
  })

  after(async () => {
    try {
      await dispatchClient.close()
    } catch (error) {
      log.warn('Failed to close connection', { error })
    }
  })

  // ===========================================================================
  // Create metadata backup job
  // ===========================================================================

  describe('Create metadata backup job', () => {
    it('should create a job with pool metadata and XO config', async () => {
      const name = generateBackupJobName()
      const jobId = await dispatchClient.backup.createMetadataBackupJob({
        name,
        pools: { [poolId]: true },
        remotes: { [backupRepository.id]: true },
        schedules: { '': getDefaultSchedule() },
        settings: { '': { retentionPoolMetadata: 2, retentionXoMetadata: 2 } },
        xoMetadata: true,
      })

      assert.ok(jobId, 'createMetadataBackupJob should return a job ID')

      const job = await dispatchClient.backup.getMetadataJob(jobId)
      assert.strictEqual(job.name, name, 'Job name should match')
      assert.ok(job.pools, 'Job should have pools configured')
      assert.strictEqual(job.xoMetadata, true, 'Job should have xoMetadata enabled')

      log.debug('Metadata backup job created and verified', { jobId, name })

      // Cleanup: this test only validates creation, delete the job immediately
      await dispatchClient.backup.deleteMetadataBackupJob(jobId)
      const scheduleKey = getScheduleKey(job)
      if (scheduleKey) {
        await dispatchClient.xoClient.call('schedule.delete', { id: scheduleKey })
      }
      log.debug('Metadata backup job cleaned up', { jobId })
    })
  })

  // ===========================================================================
  // Run metadata backup job 3 times (mirrors manual QA "QA Pool" procedure)
  // ===========================================================================

  describe('Run metadata backup job 3 times', () => {
    /** @type {string} */
    let jobId
    /** @type {string} */
    let scheduleKey

    before(async () => {
      const name = generateBackupJobName()
      jobId = await dispatchClient.backup.createMetadataBackupJob({
        name,
        pools: { [poolId]: true },
        remotes: { [backupRepository.id]: true },
        schedules: { '': getDefaultSchedule() },
        settings: { '': { retentionPoolMetadata: 2, retentionXoMetadata: 2 } },
        xoMetadata: true,
      })

      const job = await dispatchClient.backup.getMetadataJob(jobId)
      scheduleKey = getScheduleKey(job)
      assert.ok(scheduleKey, 'Metadata backup job should have a schedule key after creation')

      log.debug('Created metadata backup job for run tests', { jobId, scheduleKey })
    })

    after(async () => {
      if (jobId) {
        try {
          await dispatchClient.backup.deleteMetadataBackupJob(jobId)
          log.debug('Deleted metadata backup job', { jobId })
        } catch (error) {
          log.warn('Failed to delete metadata backup job', { jobId, error })
        }
      }

      if (scheduleKey) {
        try {
          await dispatchClient.xoClient.call('schedule.delete', { id: scheduleKey })
          log.debug('Deleted schedule', { scheduleKey })
        } catch (error) {
          log.warn('Failed to delete schedule', { scheduleKey, error })
        }
      }
    })

    it('each run should succeed with pool metadata and XO config tasks', async () => {
      for (let runIndex = 1; runIndex <= 3; runIndex++) {
        // Backup dirs are named with second-precision timestamps; wait 2 s so each
        // run gets a unique directory and retention logic sees 3 distinct entries.
        if (runIndex > 1) {
          await delay(2000)
        }

        log.debug(`Running metadata backup job (${runIndex}/3)`, { jobId, scheduleKey })

        const result = await dispatchClient.backup.runMetadataJobAndGetLog(jobId, scheduleKey)

        assertBackupSuccess(result, `Metadata backup run ${runIndex}/3`)
        assertMetadataTaskSuccess(result, 'pool')
        assertMetadataTaskSuccess(result, 'xo')

        log.debug(`Run ${runIndex}/3 completed`, { status: result.status })
      }
    })

    it('should enforce retention after 3 runs (retention = 2)', async () => {
      const backupList = await dispatchClient.backup.listMetadataBackups([backupRepository.id])

      // XO config: the top-level key is the remote ID, value is array of XO config backups
      const xoBackupsForJob = (backupList.xo?.[backupRepository.id] ?? []).filter(b => b.jobId === jobId)
      assert.strictEqual(
        xoBackupsForJob.length,
        2,
        `Expected 2 XO config backups after 3 runs with retention=2, got ${xoBackupsForJob.length}`
      )

      // Pool metadata: nested by pool ID within the remote ID key
      const poolBackupsByPool = backupList.pool?.[backupRepository.id] ?? {}
      const poolBackupsForJob = Object.values(poolBackupsByPool)
        .flat()
        .filter(b => b.jobId === jobId)
      assert.strictEqual(
        poolBackupsForJob.length,
        2,
        `Expected 2 pool metadata backups after 3 runs with retention=2, got ${poolBackupsForJob.length}`
      )

      log.debug('Retention validated', {
        xoBackups: xoBackupsForJob.length,
        poolBackups: poolBackupsForJob.length,
      })
    })
  })
})
