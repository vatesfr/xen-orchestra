import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import { backupConfig } from '../backup.config.js'
import { generateBackupJobName, getDefaultSchedule, getScheduleKey } from '../utils/index.js'
import { assertBackupSuccess } from '../utils/backupUtils.js'
import { setup, teardown } from './setup.js'

const log = createLogger('qa:backup:file-restore')

// Magic bytes used to validate archive format integrity
const TGZ_MAGIC = [0x1f, 0x8b]
const ZIP_MAGIC = [0x50, 0x4b]

describe('Incremental backup file restore', () => {
  let dispatchClient
  let tracker
  let vm
  let backupRepository

  // The second (delta) backup to run file restore on
  let incrementalBackup

  before(async () => {
    ;({ dispatchClient, tracker, vm, backupRepository } = await setup())

    const name = generateBackupJobName()
    const schedule = getDefaultSchedule()
    const config = backupConfig(name, schedule, vm, backupRepository)
    config.mode = 'delta'

    const backupJobId = await dispatchClient.backup.createBackupJob(config)
    const backupJob = await dispatchClient.backup.details(backupJobId)

    tracker.trackResource('backupJob', backupJobId, { name, mode: 'delta' })
    const scheduleKey = getScheduleKey(backupJob)
    if (scheduleKey) {
      tracker.trackResource('schedule', scheduleKey, { name, backupJobId })
    }

    assert(scheduleKey, 'Schedule key is required for file restore tests')

    // First run → full backup (base), second run → delta (incremental)
    for (let i = 0; i < 2; i++) {
      const result = await dispatchClient.backup.runJobAndGetLog(backupJobId, scheduleKey)
      assertBackupSuccess(result, `Backup run ${i + 1}/2`)
      log.debug(`Completed backup run ${i + 1}/2`, { status: result.status })
    }

    // Pick the most recent delta backup for file restore testing
    const backupsByRemoteAndVm = await dispatchClient.xoClient.call('backupNg.listVmBackups', {
      remotes: [backupRepository.id],
    })

    const vmBackups = backupsByRemoteAndVm[backupRepository.id]?.[vm.uuid]
    assert(Array.isArray(vmBackups) && vmBackups.length >= 2, 'Expected at least 2 backups after two runs')

    const sorted = [...vmBackups].sort((a, b) => a.timestamp - b.timestamp)
    incrementalBackup = sorted[sorted.length - 1]

    assert.strictEqual(incrementalBackup.mode, 'delta', 'Latest backup should be a delta (incremental) backup')
    assert(incrementalBackup.disks.length > 0, 'Incremental backup should contain at least one disk')

    log.debug('Selected incremental backup for file restore', {
      backupId: incrementalBackup.id,
      diskCount: incrementalBackup.disks.length,
      timestamp: new Date(incrementalBackup.timestamp).toISOString(),
    })
  })

  after(async () => {
    await teardown(dispatchClient, tracker)
  })

  it('should list partitions, list files, and restore first 2 files in tgz and zip for each disk', async () => {
    const remoteId = backupRepository.id

    for (const disk of incrementalBackup.disks) {
      log.debug('Processing disk', { diskId: disk.id, diskName: disk.name })

      const partitions = await dispatchClient.xoClient.call('backupNg.listPartitions', {
        remote: remoteId,
        disk: disk.id,
      })

      assert(Array.isArray(partitions), `listPartitions should return an array for disk ${disk.id}`)
      log.debug('Found partitions', { diskId: disk.id, count: partitions.length })

      // When listPartitions returns empty, treat the disk as a single raw (unpartitioned) volume.
      // The API accepts partition: undefined for this case.
      const partitionTargets = partitions.length > 0 ? partitions : [{ id: undefined }]

      for (const partition of partitionTargets) {
        const partitionId = partition.id
        log.debug('Processing partition', { diskId: disk.id, partitionId })

        let fileEntries
        try {
          fileEntries = await dispatchClient.xoClient.call('backupNg.listFiles', {
            remote: remoteId,
            disk: disk.id,
            ...(partitionId !== undefined && { partition: partitionId }),
            path: '/',
          })
        } catch (error) {
          // Some partitions (swap, EFI system) cannot be mounted — skip gracefully
          log.warn('Could not list files for partition, skipping', {
            diskId: disk.id,
            partitionId,
            error: error.message,
          })
          continue
        }

        assert(
          fileEntries !== null && typeof fileEntries === 'object',
          `listFiles should return an object for disk ${disk.id} partition ${partitionId}`
        )

        // Directories are suffixed with '/', files are not
        const fileNames = Object.keys(fileEntries).filter(name => !name.endsWith('/'))

        if (fileNames.length === 0) {
          log.debug('No files at partition root, skipping', { diskId: disk.id, partitionId })
          continue
        }

        // Restore at most 2 files — paths must be absolute for fetchFiles
        const paths = fileNames.slice(0, 2).map(name => `/${name}`)

        log.debug('Restoring files', { diskId: disk.id, partitionId, paths })

        for (const format of ['tgz', 'zip']) {
          await assertFetchFiles(dispatchClient, { remote: remoteId, disk: disk.id, partitionId, paths, format })
        }
      }
    }
  })
})

/**
 * Calls backupNg.fetchFiles, downloads the resulting archive, and validates
 * that the response is a non-empty, correctly-formatted archive.
 *
 * @param {import('../client/dispatchClient.js').DispatchClient} dispatchClient
 * @param {{ remote: string, disk: string, partitionId: string|undefined, paths: string[], format: 'tgz'|'zip' }} opts
 */
async function assertFetchFiles(dispatchClient, { remote, disk, partitionId, paths, format }) {
  const params = {
    remote,
    disk,
    paths,
    format,
    ...(partitionId !== undefined && { partition: partitionId }),
  }

  const result = await dispatchClient.xoClient.call('backupNg.fetchFiles', params)
  const downloadPath = result.$getFrom
  assert(
    typeof downloadPath === 'string' && downloadPath.length > 0,
    `fetchFiles (${format}) should return a non-empty $getFrom URL`
  )

  const response = await fetch(`${dispatchClient.restApiClient.baseUrl}${downloadPath}`, {
    method: 'GET',
    headers: dispatchClient.restApiClient.headers,
    signal: AbortSignal.timeout(120_000),
  })

  assert(response.ok, `Download failed for ${format}: HTTP ${response.status} ${response.statusText}`)

  const bytes = Buffer.from(await response.arrayBuffer())
  assert(bytes.length > 0, `Downloaded ${format} archive should not be empty`)

  const magic = format === 'tgz' ? TGZ_MAGIC : ZIP_MAGIC
  assert.strictEqual(bytes[0], magic[0], `${format} archive should start with correct magic byte[0]`)
  assert.strictEqual(bytes[1], magic[1], `${format} archive should start with correct magic byte[1]`)

  log.debug('File restore validated', { format, size: bytes.length, paths, partitionId })
}
