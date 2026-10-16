import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'
import { getHandler, getSyncedHandler } from '@xen-orchestra/fs'

import { backupConfig } from '../backup.config.js'
import {
  assertFullOrDelta,
  assertHealthCheckExists,
  assertHealthCheckSuccess,
  generateBackupJobName,
  getDefaultSchedule,
  getRequiredEnv,
  getScheduleKey,
} from '../utils/index.js'
import { assertBackupSuccess, assertRepositoryEmpty, resolveOrCreateBackupRepository } from '../utils/backupUtils.js'
import { setup, teardown } from './setup.js'

const log = createLogger('qa:backup:hbd')

// optional: the whole suite is skipped when no hbd repository is configured
const HBD_REPOSITORY_NAME = process.env.HBD_BACKUP_REPOSITORY_NAME
const HBD_REPOSITORY_URL = process.env.HBD_BACKUP_REPOSITORY_URL
const skip =
  HBD_REPOSITORY_NAME && HBD_REPOSITORY_URL
    ? false
    : 'HBD_BACKUP_REPOSITORY_NAME and HBD_BACKUP_REPOSITORY_URL are not set'

const RETENTION = 2

/**
 * Every file below `dir`, relative to the remote root
 * @param {import('@xen-orchestra/fs').RemoteHandlerAbstract} handler
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function listFiles(handler, dir) {
  const found = []
  for (const entry of await handler.list(dir, { prependDir: true, ignoreMissing: true })) {
    try {
      found.push(...(await listFiles(handler, entry)))
    } catch (error) {
      if (error.code !== 'ENOTDIR') {
        throw error
      }
      found.push(entry)
    }
  }
  return found
}

describe('Backup on a hbd (deduplicated) repository', { skip }, () => {
  /** @type {import('../client/dispatchClient.js').DispatchClient} */
  let dispatchClient
  /** @type {import('../utils/resourceTracker.js').ResourceTracker} */
  let tracker
  let vm
  /** the regular (VHD) repository from the .env, used as mirror source */
  let vhdRepository
  let hbdRepository
  let healthCheckSrId
  /** Set to true only after assertRepositoryEmpty passes: guards after() from purging data it did not create */
  let reposVerifiedEmpty = false

  const countVmBackups = async repositoryId => {
    const backups = await dispatchClient.backup.listVmBackups([repositoryId])
    return backups[repositoryId]?.[vm.uuid]?.length ?? 0
  }

  const listVmBackups = async repositoryId => {
    const backups = await dispatchClient.backup.listVmBackups([repositoryId])
    return [...(backups[repositoryId]?.[vm.uuid] ?? [])].sort((a, b) => a.timestamp - b.timestamp)
  }

  const purgeBackupData = async (...repositories) => {
    for (const repository of repositories) {
      if (repository === undefined) {
        continue
      }
      try {
        const ids = (await listVmBackups(repository.id)).map(backup => backup.id)
        if (ids.length > 0) {
          await dispatchClient.backup.deleteVmBackups(ids)
        }
      } catch (error) {
        log.warn('Backup purge failed', { repository: repository.name, error })
      }
    }
  }

  /** Creates a backup job (tracked for cleanup), returns a function running it once */
  const createBackupJob = async (repository, mode, options = {}) => {
    const name = generateBackupJobName()
    const config = backupConfig(name, getDefaultSchedule(), vm, repository, options)
    config.mode = mode
    config.settings[''].exportRetention = RETENTION

    const jobId = await dispatchClient.backup.createBackupJob(config)
    tracker.trackResource('backupJob', jobId, { name, mode })
    const scheduleKey = getScheduleKey(await dispatchClient.backup.details(jobId))
    assert.ok(scheduleKey, 'Backup schedule key is required')
    tracker.trackResource('schedule', scheduleKey, { name, backupJobId: jobId })

    return async context => {
      const result = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
      assertBackupSuccess(result, context)
      return result
    }
  }

  /** Creates a mirror job (tracked for cleanup), returns a function running it once */
  const createMirrorJob = async (source, destination, mode) => {
    const name = generateBackupJobName()
    const jobId = await dispatchClient.backup.createMirrorBackupJob({
      name,
      mode,
      sourceRemote: source.id,
      remotes: { [destination.id]: {} },
      schedules: { '': getDefaultSchedule() },
      settings: { '': { exportRetention: RETENTION, mergeBackupsSynchronously: true, bypassVdiChainsCheck: true } },
    })
    tracker.trackResource('backupJob', jobId, { name, mode, type: 'mirrorBackup' })
    const scheduleKey = getScheduleKey(await dispatchClient.backup.details(jobId))
    assert.ok(scheduleKey, 'Mirror schedule key is required')
    tracker.trackResource('schedule', scheduleKey, { name, backupJobId: jobId })

    return async context => {
      const result = await dispatchClient.backup.runMirrorJobAndGetLog(jobId, scheduleKey)
      assertBackupSuccess(result, context)
      return result
    }
  }

  /**
   * Disk files of the VM on the hbd repository, only when it is reachable from here (file://)
   * @returns {Promise<string[] | undefined>}
   */
  const listHbdDiskFiles = async () => {
    if (!HBD_REPOSITORY_URL.startsWith('file://')) {
      return undefined
    }
    const { value: handler, dispose } = await getSyncedHandler({ url: HBD_REPOSITORY_URL })
    try {
      return (await listFiles(handler, `xo-vm-backups/${vm.uuid}/vdis`)).filter(
        path => path.endsWith('.hbd') || path.endsWith('.vhd')
      )
    } finally {
      await dispose()
    }
  }

  before(async () => {
    let vms
    ;({ dispatchClient, tracker, vms, backupRepository: vhdRepository } = await setup())
    vm = vms[0]
    assert.ok(vm, 'Setup should provide a test VM')

    // fail fast on a URL that would silently write VHDs
    assert.strictEqual(
      getHandler({ url: HBD_REPOSITORY_URL }).getConfig('diskFormat'),
      'hbd',
      `HBD_BACKUP_REPOSITORY_URL must set diskFormat="hbd" (got ${HBD_REPOSITORY_URL})`
    )

    hbdRepository = await resolveOrCreateBackupRepository(dispatchClient, tracker, {
      name: HBD_REPOSITORY_NAME,
      url: HBD_REPOSITORY_URL,
    })
    assert.notStrictEqual(hbdRepository.id, vhdRepository.id, 'the hbd and VHD repositories must be distinct')

    healthCheckSrId = (await dispatchClient.sr.details(getRequiredEnv('SR_ID'))).uuid

    await assertRepositoryEmpty(dispatchClient, vhdRepository)
    await assertRepositoryEmpty(dispatchClient, hbdRepository)
    reposVerifiedEmpty = true
  })

  after(async () => {
    if (reposVerifiedEmpty) {
      await purgeBackupData(vhdRepository, hbdRepository)
    }
    if (dispatchClient && tracker) {
      await teardown(dispatchClient, tracker)
    }
  })

  describe('Incremental backup', () => {
    it('chains deltas on .hbd disks and merges them past retention, with health checks', async () => {
      const runBackup = await createBackupJob(hbdRepository, 'delta', { healthCheckSr: healthCheckSrId })

      // run 1: full, run 2: delta, runs 3 and 4: delta + merge of the oldest backup
      const RUNS = RETENTION + 2
      for (let index = 0; index < RUNS; index++) {
        const result = await runBackup(`hbd delta backup ${index + 1}/${RUNS}`)
        // a full after the first run means the writer did not find its .hbd parent
        assertFullOrDelta(result, hbdRepository.id, { mustBeFull: index === 0 })
        // the health check restores the backup on a VM and boots it
        assertHealthCheckExists(result)
        assertHealthCheckSuccess(result)
      }

      const backups = await listVmBackups(hbdRepository.id)
      assert.strictEqual(backups.length, RETENTION, `retention ${RETENTION} keeps ${RETENTION} backups`)

      const diskFiles = await listHbdDiskFiles()
      if (diskFiles !== undefined) {
        log.debug('Disk files on the hbd repository', { diskFiles })
        assert.ok(diskFiles.length > 0, 'the backups have disk files')
        assert.deepStrictEqual(
          diskFiles.filter(path => !path.endsWith('.hbd')),
          [],
          'every disk is written as .hbd'
        )
        // merged chains: one disk per kept backup and per VDI, nothing left by the merges
        assert.strictEqual(diskFiles.length % RETENTION, 0, `disk files: ${diskFiles.join(', ')}`)
      }
    })

    it('restores the latest delta as a new VM', async () => {
      const backups = await listVmBackups(hbdRepository.id)
      assert.ok(backups.length > 0, 'requires the backups of the previous test')
      const latest = backups[backups.length - 1]
      assert.strictEqual(latest.mode, 'delta')

      const restoredVmUuid = await dispatchClient.backup.importVmBackup(latest.id, healthCheckSrId)
      assert.ok(restoredVmUuid, 'the restore returns the new VM')
      tracker.trackResource('vm', restoredVmUuid, { name: 'restored from hbd' })

      const restoredVm = await dispatchClient.vm.details(restoredVmUuid)
      assert.ok(restoredVm, 'the restored VM exists')
      assert.strictEqual(
        (await dispatchClient.vdi.getVdisForVm(restoredVmUuid)).length,
        (await dispatchClient.vdi.getVdisForVm(vm.uuid)).length,
        'the restored VM has as many disks as the source'
      )
    })

    // file restore mounts the disks with VHD-only tools (@vates/fuse-vhd, vhdimount)
    it.todo('restores files from a hbd backup')
  })

  describe('Mirror', () => {
    before(async () => {
      await purgeBackupData(vhdRepository, hbdRepository)
    })

    it('mirrors incremental backups from a VHD repository into the hbd one', async () => {
      const runBackup = await createBackupJob(vhdRepository, 'delta')
      const runMirror = await createMirrorJob(vhdRepository, hbdRepository, 'delta')

      await runBackup('VHD delta backup 1/2')
      await runMirror('mirror VHD -> hbd 1/2')
      assert.ok((await countVmBackups(hbdRepository.id)) > 0, 'the hbd repository holds the mirrored backup')

      // the second one is chained on the .hbd mirrored by the first one
      await runBackup('VHD delta backup 2/2')
      await runMirror('mirror VHD -> hbd 2/2')

      const diskFiles = await listHbdDiskFiles()
      if (diskFiles !== undefined) {
        assert.deepStrictEqual(
          diskFiles.filter(path => !path.endsWith('.hbd')),
          [],
          'the mirror writes .hbd disks, whatever the source format'
        )
      }
    })
  })
})
