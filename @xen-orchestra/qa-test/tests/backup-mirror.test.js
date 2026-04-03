import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'

import { backupConfig } from '../backup.config.js'
import {
  assertFullOrDelta,
  findTaskByMessage,
  generateBackupJobName,
  getBackupTransferredBytes,
  getDefaultSchedule,
  getScheduleKey,
} from '../utils/index.js'
import { assertBackupSuccess, assertRepositoryEmpty } from '../utils/backupUtils.js'
import { setup, teardown } from './setup.js'

/** Source backup repository — where initial backups are stored */
const SOURCE_REPOSITORY_NAME = process.env.BACKUP_REPOSITORY_NAME || 'Test backup QA'

/** Destination backup repository — mirror target */
const MIRROR_DESTINATION_REPOSITORY_NAME = process.env.MIRROR_DESTINATION_REPOSITORY_NAME || 'Test mirror QA'
const MIRROR_DESTINATION_REPOSITORY_PATH = process.env.MIRROR_DESTINATION_REPOSITORY_PATH

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
   * Purges all VM backup data from one or more repositories.
   * @param  {...{id: string, name: string}} repos - Repositories to purge
   */
  const purgeBackupData = async (...repos) => {
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
          console.log(`Purging ${ids.length} backup(s) from ${repo.name}...`)
          await dispatchClient.backup.deleteVmBackups(ids)
        }
      } catch (error) {
        console.warn(`Backup purge failed for ${repo.name}: ${error.message}`)
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
    console.log(`Using test VM: ${vm.name_label} (${vm.uuid})`)

    // Get source backup repository
    sourceRepository = await dispatchClient.backupRepository.get({
      name: SOURCE_REPOSITORY_NAME,
    })

    if (!sourceRepository) {
      const id = await dispatchClient.backupRepository.create(SOURCE_REPOSITORY_NAME, {
        path: process.env.BACKUP_REPOSITORY_PATH || '/tmp/xo-test-backups',
      })
      sourceRepository = await dispatchClient.backupRepository.get({ id })
      if (!sourceRepository) {
        throw new Error(`Failed to create source backup repository`)
      }
      tracker.trackResource('backupRepository', id, { name: SOURCE_REPOSITORY_NAME })
    }
    console.log(`Source repository: ${sourceRepository.name} (${sourceRepository.id})`)

    // Get or create destination backup repository
    if (!MIRROR_DESTINATION_REPOSITORY_PATH) {
      throw new Error('MIRROR_DESTINATION_REPOSITORY_PATH environment variable is required for mirror backup tests')
    }

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
    console.log(`Destination repository: ${destRepository.name} (${destRepository.id})`)

    // Safety check: repositories must be empty to avoid accidental data loss
    await assertRepositoryEmpty(dispatchClient, sourceRepository)
    await assertRepositoryEmpty(dispatchClient, destRepository)
  })

  after(async () => {
    await purgeBackupData(sourceRepository, destRepository)

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
      console.log('Step 1: Running full backup to populate source repository...')
      const backupResult = await runFullBackup()
      assertFullOrDelta(backupResult, sourceRepository.id, { mustBeFull: true })

      const sourceCount = await countVmBackups(sourceRepository.id, vm.uuid)
      assert.ok(sourceCount > 0, 'Source repository should contain at least one backup')
      console.log(`Source repository contains ${sourceCount} backup(s)`)

      console.log('Step 2: Running full mirror backup (source → destination)...')
      const mirrorResult = await runMirror()

      const transferTask = findTaskByMessage(mirrorResult, 'transfer')
      assert.ok(transferTask, 'Mirror backup should include a transfer task')
      assert.strictEqual(transferTask.status, 'success', 'Transfer task should succeed')

      const transferredBytes = getBackupTransferredBytes(mirrorResult)
      console.log(`Mirror transferred: ${transferredBytes} bytes`)

      const destCount = await countVmBackups(destRepository.id, vm.uuid)
      assert.ok(destCount > 0, 'Destination repository should contain backups after mirror')
      console.log(`Destination repository contains ${destCount} backup(s) after mirror`)
    })

    it('should only transfer new backups on second mirror run', async () => {
      const destCountBefore = await countVmBackups(destRepository.id, vm.uuid)
      console.log(`Destination has ${destCountBefore} backup(s) before second mirror`)

      console.log('Step 1: Running another full backup to add data on source...')
      await runFullBackup()

      console.log('Step 2: Running second mirror backup...')
      await runMirror()

      const destCountAfter = await countVmBackups(destRepository.id, vm.uuid)
      console.log(`Destination has ${destCountAfter} backup(s) after second mirror`)

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
      console.log(`Creating ${SOURCE_RETENTION} full backups on source (retention=${SOURCE_RETENTION})...`)
      for (let i = 0; i < SOURCE_RETENTION; i++) {
        console.log(`  Backup ${i + 1}/${SOURCE_RETENTION}...`)
        await runFullBackup()
      }

      const sourceCount = await countVmBackups(sourceRepository.id, vm.uuid)
      console.log(`Source has ${sourceCount} backup(s)`)
      assert.ok(sourceCount >= SOURCE_RETENTION, `Source should have at least ${SOURCE_RETENTION} backups`)

      // Mirror with lower retention on destination
      console.log(`Running mirror with destination exportRetention=${DEST_RETENTION}...`)
      await runMirror({ exportRetention: DEST_RETENTION })

      const destCount = await countVmBackups(destRepository.id, vm.uuid)
      console.log(`Destination has ${destCount} backup(s) (expected ≤ ${DEST_RETENTION})`)

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
      console.log(`Round 1: creating ${SOURCE_RETENTION} backups on source...`)
      for (let i = 0; i < SOURCE_RETENTION; i++) {
        await runFullBackup()
      }

      console.log(`Round 1: mirroring with destination exportRetention=${DEST_RETENTION}...`)
      await runMirror({ exportRetention: DEST_RETENTION })

      const destCountRound1 = await countVmBackups(destRepository.id, vm.uuid)
      console.log(`Destination has ${destCountRound1} backup(s) after round 1`)
      assert.ok(destCountRound1 > 0, 'Destination should have backups after first mirror')

      // Round 2: create more backups on source + mirror again
      console.log(`Round 2: creating ${SOURCE_RETENTION} more backups on source...`)
      for (let i = 0; i < SOURCE_RETENTION; i++) {
        await runFullBackup()
      }

      console.log(`Round 2: mirroring again...`)
      await runMirror({ exportRetention: DEST_RETENTION })

      const destCountRound2 = await countVmBackups(destRepository.id, vm.uuid)
      console.log(`Destination has ${destCountRound2} backup(s) after round 2`)

      // Destination should have accumulated more backups than source currently holds
      const sourceCount = await countVmBackups(sourceRepository.id, vm.uuid)
      console.log(`Source currently has ${sourceCount} backup(s)`)

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
