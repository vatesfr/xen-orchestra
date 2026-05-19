import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import { backupConfig } from '../backup.config.js'
import {
  assertFullOrDelta,
  findTaskByMessage,
  generateBackupJobName,
  getBackupTransferredBytes,
  getDefaultSchedule,
  getScheduleKey,
  getRequiredEnv,
} from '../utils/index.js'
import { assertBackupSuccess, assertRepositoryEmpty, clearRepositoryCacheFiles } from '../utils/backupUtils.js'
import { setup, teardown } from './setup.js'

const log = createLogger('qa:mirror')

/** Source backup repository — where initial backups are stored */
const SOURCE_REPOSITORY_NAME = getRequiredEnv('BACKUP_REPOSITORY_NAME')
const SOURCE_REPOSITORY_PATH = getRequiredEnv('BACKUP_REPOSITORY_PATH')

/** Destination backup repository — mirror target */
const MIRROR_DESTINATION_REPOSITORY_NAME = getRequiredEnv('MIRROR_DESTINATION_REPOSITORY_NAME')
const MIRROR_DESTINATION_REPOSITORY_PATH = getRequiredEnv('MIRROR_DESTINATION_REPOSITORY_PATH')

describe('Mirror Backup - Full Remote', () => {
  /** @type {import('../client/dispatchClient.js').DispatchClient} */
  let dispatchClient
  /** @type {import('../utils/resourceTracker.js').ResourceTracker} */
  let tracker
  /** @type {{uuid: string, name_label: string, power_state: string}} */
  let vm
  /** @type {{id: string, name: string}} */
  let sourceRepository
  /** @type {{id: string, name: string}} */
  let destRepository
  /** Set to true only after assertRepositoryEmpty passes — guards after() from purging data it did not create */
  let reposVerifiedEmpty = false

  /**
   * Counts backups for a specific VM on a given repository.
   * @param {string} repoId - Repository ID
   * @param {string} vmUuid - VM UUID to count backups for
   * @returns {Promise<number>} Number of backups
   */
  const countVmBackups = async (repoId, vmUuid) => {
    const backups = await dispatchClient.backup.listVmBackups([repoId])
    const repoBackups = backups[repoId] ?? backups[Object.keys(backups)[0]] ?? {}
    const vmBackups = repoBackups[vmUuid] ?? []
    return vmBackups.length
  }

  /**
   * Purges all VM backup data from one or more repositories, then clears the
   * on-disk cache files so that stale entries cannot affect subsequent runs.
   *
   * The API-level deletion is best-effort: if individual backups are already
   * missing on disk (e.g. a previous run left an incomplete state) the error is
   * logged but cleanup continues. Cache files are wiped unconditionally so that
   * the next `listVmBackups` / mirror-backup call rebuilds from actual files.
   *
   * @param  {...{id: string, name: string}} repos - Repositories to purge
   */
  const purgeBackupData = async (...repos) => {
    const repoPaths = {
      [sourceRepository?.id]: SOURCE_REPOSITORY_PATH,
      [destRepository?.id]: MIRROR_DESTINATION_REPOSITORY_PATH,
    }

    for (const repo of repos) {
      if (!repo) {
        continue
      }
      try {
        const backups = await dispatchClient.backup.listVmBackups([repo.id])
        const ids = []
        for (const vmBackups of Object.values(backups)) {
          for (const backupList of Object.values(vmBackups)) {
            for (const backup of backupList) {
              ids.push(backup.id)
            }
          }
        }
        if (ids.length > 0) {
          log.debug('Purging backups from repository', { count: ids.length, repo: repo.name })
          await dispatchClient.backup.deleteVmBackups(ids)
        }
      } catch (error) {
        log.warn('Backup purge failed', { repo: repo.name, error })
      }

      const repoPath = repoPaths[repo.id]
      if (repoPath) {
        await clearRepositoryCacheFiles(repoPath, vm?.uuid)
      }
    }
  }

  /**
   * Creates a backup job, runs it, and returns the result.
   * Tracks the job and schedule for cleanup.
   */
  const runFullBackup = async () => {
    const name = generateBackupJobName()
    const schedule = getDefaultSchedule()
    const cfg = backupConfig(name, schedule, vm, sourceRepository)

    const jobId = await dispatchClient.backup.createBackupJob({ ...cfg, mode: 'full' })
    const job = await dispatchClient.backup.details(jobId)
    tracker.trackResource('backupJob', jobId, { name, mode: 'full' })

    const scheduleKey = getScheduleKey(job)
    assert.ok(scheduleKey, 'Backup schedule key is required')
    tracker.trackResource('schedule', scheduleKey, { name, backupJobId: jobId })

    const result = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
    assertBackupSuccess(result, `Full backup: ${name}`)
    return result
  }

  /**
   * Creates a mirror job, runs it, and returns the result.
   * Tracks the job and schedule for cleanup.
   * @param {Object} [settingsOverride] - Override default mirror settings
   */
  const runMirror = async (settingsOverride = {}) => {
    const name = generateBackupJobName()
    const schedule = getDefaultSchedule()
    const config = {
      name,
      mode: 'full',
      sourceRemote: sourceRepository.id,
      remotes: { [destRepository.id]: {} },
      schedules: { '': schedule },
      settings: {
        '': {
          exportRetention: 3,
          mergeBackupsSynchronously: true,
          bypassVdiChainsCheck: true,
          ...settingsOverride,
        },
      },
    }

    const jobId = await dispatchClient.backup.createMirrorBackupJob(config)
    const job = await dispatchClient.backup.details(jobId)
    tracker.trackResource('backupJob', jobId, { name, mode: 'full', type: 'mirrorBackup' })

    const scheduleKey = getScheduleKey(job)
    assert.ok(scheduleKey, 'Mirror schedule key is required')
    tracker.trackResource('schedule', scheduleKey, { name, backupJobId: jobId })

    const result = await dispatchClient.backup.runMirrorJobAndGetLog(jobId, scheduleKey)
    assertBackupSuccess(result, `Mirror backup: ${name}`)
    return result
  }

  before(async () => {
    const setupResult = await setup()
    dispatchClient = setupResult.dispatchClient
    tracker = setupResult.tracker
    vm = setupResult.vm

    assert.ok(vm, 'Setup should provide a test VM')
    log.debug('Using test VM', { name: vm.name_label, uuid: vm.uuid })

    // Get source backup repository
    sourceRepository = await dispatchClient.backupRepository.get({
      name: SOURCE_REPOSITORY_NAME,
    })

    if (!sourceRepository) {
      const id = await dispatchClient.backupRepository.create(SOURCE_REPOSITORY_NAME, {
        path: getRequiredEnv('BACKUP_REPOSITORY_PATH'),
      })
      sourceRepository = await dispatchClient.backupRepository.get({ id })
      if (!sourceRepository) {
        throw new Error(`Failed to create source backup repository`)
      }
      tracker.trackResource('backupRepository', id, { name: SOURCE_REPOSITORY_NAME })
    }
    log.debug('Source repository', { name: sourceRepository.name, id: sourceRepository.id })

    destRepository = await dispatchClient.backupRepository.get({
      name: MIRROR_DESTINATION_REPOSITORY_NAME,
    })

    if (!destRepository) {
      const id = await dispatchClient.backupRepository.create(MIRROR_DESTINATION_REPOSITORY_NAME, {
        path: MIRROR_DESTINATION_REPOSITORY_PATH,
      })
      destRepository = await dispatchClient.backupRepository.get({ id })
      if (!destRepository) {
        throw new Error(`Failed to create destination backup repository`)
      }
      tracker.trackResource('backupRepository', id, { name: MIRROR_DESTINATION_REPOSITORY_NAME })
    }
    log.debug('Destination repository', { name: destRepository.name, id: destRepository.id })

    assert.notStrictEqual(
      sourceRepository.id,
      destRepository.id,
      `Source and destination repositories must be distinct (both resolve to id "${sourceRepository.id}"). ` +
        `Check BACKUP_REPOSITORY_NAME and MIRROR_DESTINATION_REPOSITORY_NAME in .env.`
    )

    // Safety check: repositories must be empty to avoid accidental data loss
    await assertRepositoryEmpty(dispatchClient, sourceRepository)
    await assertRepositoryEmpty(dispatchClient, destRepository)
    reposVerifiedEmpty = true
  })

  after(async () => {
    if (reposVerifiedEmpty) {
      await purgeBackupData(sourceRepository, destRepository)
    }

    if (dispatchClient && tracker) {
      await teardown(dispatchClient, tracker)
    }
  })

  // =========================================================================
  // Basic Mirror Transfer
  // =========================================================================

  describe('Basic Mirror Transfer', () => {
    after(async () => {
      await purgeBackupData(sourceRepository, destRepository)
    })

    it('should mirror full backups from source to destination', async () => {
      log.debug('Step 1: Running full backup to populate source repository')
      const backupResult = await runFullBackup()
      assertFullOrDelta(backupResult, sourceRepository.id, { mustBeFull: true })

      const sourceCount = await countVmBackups(sourceRepository.id, vm.uuid)
      assert.ok(sourceCount > 0, 'Source repository should contain at least one backup')
      log.debug('Source repository backup count', { count: sourceCount })

      log.debug('Step 2: Running full mirror backup (source → destination)')
      const mirrorResult = await runMirror()

      const transferTask = findTaskByMessage(mirrorResult, 'transfer')
      assert.ok(transferTask, 'Mirror backup should include a transfer task')
      assert.strictEqual(transferTask.status, 'success', 'Transfer task should succeed')

      const transferredBytes = getBackupTransferredBytes(mirrorResult)
      log.debug('Mirror transferred', { bytes: transferredBytes })

      const destCount = await countVmBackups(destRepository.id, vm.uuid)
      assert.ok(destCount > 0, 'Destination repository should contain backups after mirror')
      log.debug('Destination backup count after mirror', { count: destCount })
    })

    it('should only transfer new backups on second mirror run', async () => {
      const destCountBefore = await countVmBackups(destRepository.id, vm.uuid)
      log.debug('Destination backup count before second mirror', { count: destCountBefore })

      log.debug('Step 1: Running another full backup to add data on source')
      await runFullBackup()

      log.debug('Step 2: Running second mirror backup')
      await runMirror()

      const destCountAfter = await countVmBackups(destRepository.id, vm.uuid)
      log.debug('Destination backup count after second mirror', { count: destCountAfter })

      assert.ok(
        destCountAfter > destCountBefore,
        `Destination should have more backups after second mirror (before: ${destCountBefore}, after: ${destCountAfter})`
      )
    })
  })

  // =========================================================================
  // Retention — source retention > destination retention
  // =========================================================================

  describe('Retention: source > destination', () => {
    after(async () => {
      await purgeBackupData(sourceRepository, destRepository)
    })

    it('should cap destination backups to destination exportRetention', async () => {
      const SOURCE_RETENTION = 4
      const DEST_RETENTION = 2

      // Populate source with SOURCE_RETENTION full backups
      log.debug('Creating full backups on source', { count: SOURCE_RETENTION })
      for (let i = 0; i < SOURCE_RETENTION; i++) {
        log.debug('Running backup', { run: i + 1, of: SOURCE_RETENTION })
        await runFullBackup()
      }

      const sourceCount = await countVmBackups(sourceRepository.id, vm.uuid)
      log.debug('Source backup count', { count: sourceCount })
      assert.ok(sourceCount >= SOURCE_RETENTION, `Source should have at least ${SOURCE_RETENTION} backups`)

      log.debug('Running mirror with destination exportRetention', { exportRetention: DEST_RETENTION })
      await runMirror({ exportRetention: DEST_RETENTION })

      const destCount = await countVmBackups(destRepository.id, vm.uuid)
      log.debug('Destination backup count', { count: destCount, expectedMax: DEST_RETENTION })

      assert.ok(
        destCount <= DEST_RETENTION,
        `Destination should have at most ${DEST_RETENTION} backups (got ${destCount}) ` +
          `— source has more backups but destination retention should cap it`
      )
      assert.ok(destCount > 0, 'Destination should have at least 1 backup')
    })
  })

  // =========================================================================
  // Retention — destination retention > source retention
  // =========================================================================

  describe('Retention: destination > source', () => {
    after(async () => {
      await purgeBackupData(sourceRepository, destRepository)
    })

    it('should accumulate backups on destination up to its retention', async () => {
      const SOURCE_RETENTION = 2
      const DEST_RETENTION = 4

      // Create SOURCE_RETENTION backups, mirror, repeat — destination should accumulate

      // Round 1: populate source + mirror
      log.debug('Round 1: creating backups on source', { count: SOURCE_RETENTION })
      for (let i = 0; i < SOURCE_RETENTION; i++) {
        await runFullBackup()
      }

      log.debug('Round 1: mirroring', { exportRetention: DEST_RETENTION })
      await runMirror({ exportRetention: DEST_RETENTION })

      const destCountRound1 = await countVmBackups(destRepository.id, vm.uuid)
      log.debug('Destination backup count after round 1', { count: destCountRound1 })
      assert.ok(destCountRound1 > 0, 'Destination should have backups after first mirror')

      log.debug('Round 2: creating more backups on source', { count: SOURCE_RETENTION })
      for (let i = 0; i < SOURCE_RETENTION; i++) {
        await runFullBackup()
      }

      log.debug('Round 2: mirroring again')
      await runMirror({ exportRetention: DEST_RETENTION })

      const destCountRound2 = await countVmBackups(destRepository.id, vm.uuid)
      log.debug('Destination backup count after round 2', { count: destCountRound2 })

      const sourceCount = await countVmBackups(sourceRepository.id, vm.uuid)
      log.debug('Source current backup count', { count: sourceCount })

      assert.ok(
        destCountRound2 > destCountRound1,
        `Destination should accumulate backups across mirror runs ` +
          `(round 1: ${destCountRound1}, round 2: ${destCountRound2})`
      )

      assert.ok(
        destCountRound2 <= DEST_RETENTION,
        `Destination should not exceed its retention of ${DEST_RETENTION} (got ${destCountRound2})`
      )
    })
  })
})
