import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { getVmBackupDir } from '@xen-orchestra/backups/_getVmBackupDir.mjs'

import { backupConfig } from '../backup.config.js'
import {
  findTaskByMessage,
  generateBackupJobName,
  getDefaultSchedule,
  getRequiredEnv,
  getScheduleKey,
} from '../utils/index.js'
import { assertBackupSuccess, extractBackupErrors, resolveOrCreateBackupRepository } from '../utils/backupUtils.js'
import { setup, teardown } from './setup.js'

const log = createLogger('qa:backup:lock')

// The suite locks the backup folder of a VM itself, from the machine it runs on, and checks that XO honours that
// lock: it needs a repository which this machine reaches as XO reaches it, hence S3 or Azure. A local, NFS or SMB
// repository is a directory of XO's host.
const BACKENDS = [
  { label: 'S3', envPrefix: 'S3' },
  { label: 'Azure', envPrefix: 'AZURE' },
]

const isConfigured = ({ envPrefix }) => Boolean(process.env[`${envPrefix}_BACKUP_REPOSITORY_URL`])

describe(
  'Backup VM folder lock',
  { skip: !BACKENDS.some(isConfigured) && 'neither S3_BACKUP_REPOSITORY_URL nor AZURE_BACKUP_REPOSITORY_URL is set' },
  () => {
    let dispatchClient
    let tracker
    let vm

    before(async () => {
      let vms
      ;({ dispatchClient, tracker, vms } = await setup())
      vm = vms[0]
    })

    for (const backend of BACKENDS) {
      const { label, envPrefix } = backend

      describe(label, { skip: !isConfigured(backend) && `${envPrefix}_BACKUP_REPOSITORY_URL is not set` }, () => {
        let jobId
        let scheduleId
        let handler
        let disposeHandler
        let skipReason

        before(async () => {
          const url = getRequiredEnv(`${envPrefix}_BACKUP_REPOSITORY_URL`)

          // not tracked for cleanup: the tracker holds a single repository, the one setup() may have created, and
          // the next run reuses this one
          const backupRepository = await resolveOrCreateBackupRepository(dispatchClient, undefined, {
            name: getRequiredEnv(`${envPrefix}_BACKUP_REPOSITORY_NAME`),
            url,
          })

          const config = backupConfig(generateBackupJobName(), getDefaultSchedule(), vm, backupRepository)
          jobId = await dispatchClient.backup.createBackupJob(config)
          tracker.trackResource('backupJob', jobId, { name: config.name, mode: config.mode })
          scheduleId = getScheduleKey(await dispatchClient.backup.details(jobId))
          tracker.trackResource('schedule', scheduleId, { name: config.name, backupJobId: jobId })

          const { value, dispose } = await getSyncedHandler({ url })
          handler = value
          disposeHandler = dispose

          // A second lock of the same folder must be refused. On S3, nothing is locked when the provider does not
          // honour conditional writes, or when the bucket has Object Lock: XO does not lock either, and there is
          // nothing to test.
          const dir = getVmBackupDir(vm.uuid)
          const lock = await handler.lock(dir)
          try {
            const secondLock = await handler.lock(dir)
            await secondLock.dispose()
            skipReason =
              'the repository is not locked: its S3 provider does not honour conditional writes, or its bucket has ' +
              'Object Lock (see the xo:fs:s3 warnings in the debug log)'
            log.warn('VM folder lock pre-check failed', { backend: label, skipReason })
          } catch (error) {
            if (error.code !== 'ELOCKED') {
              throw error
            }
          } finally {
            await lock.dispose()
          }
        })

        it('fails the backup of a VM whose folder is locked', async t => {
          if (skipReason !== undefined) {
            return t.skip(skipReason)
          }

          const lock = await handler.lock(getVmBackupDir(vm.uuid))
          let result
          try {
            result = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleId)
          } finally {
            await lock.dispose()
          }

          // the folder is locked before the snapshot is taken: the task of the VM fails at once
          const vmTask = findTaskByMessage(result, 'backup VM')
          assert.strictEqual(
            vmTask?.status,
            'failure',
            'the backup should fail while the folder of the VM is locked: XO did not lock it (see the xo:fs warnings in its log)'
          )
          assert.strictEqual(
            vmTask.result?.code,
            'ELOCKED',
            `the backup should fail on the lock, failed with: ${extractBackupErrors(result).join(' | ')}`
          )
        })

        it('releases the lock at the end of the backup', async t => {
          if (skipReason !== undefined) {
            return t.skip(skipReason)
          }

          const result = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleId)
          assertBackupSuccess(result, `Backup to ${label} of a VM whose folder is not locked`)

          // a lock left behind would fail the next backups of the VM until it goes stale: 3 minutes on S3, the 60
          // seconds of its lease on Azure
          const lock = await handler.lock(getVmBackupDir(vm.uuid))
          await lock.dispose()
        })

        after(async () => {
          await disposeHandler?.()
        })
      })
    }

    after(async () => {
      await teardown(dispatchClient, tracker)
    })
  }
)
