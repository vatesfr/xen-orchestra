import { createLogger } from '@xen-orchestra/log'
import { join } from 'node:path'
import { Task } from '@vates/task'
import assert from 'node:assert'

import { formatFilenameDate } from '../../_filenameDate.mjs'
import { getVmBackupDir } from '../../_getVmBackupDir.mjs'
import { HealthCheckVmBackup } from '../../HealthCheckVmBackup.mjs'
import { ImportVmBackup } from '../../ImportVmBackup.mjs'
import * as MergeWorker from '../../merge-worker/index.mjs'
import ms from 'ms'
import { getEntryStatus } from '../../_getOldEntries.mjs'

const { info, warn } = createLogger('xo:backups:MixinBackupWriter')

export const MixinRemoteWriter = (BaseClass = Object) =>
  class MixinRemoteWriter extends BaseClass {
    #lock

    constructor({ remoteId, adapter, ...rest }) {
      super(rest)

      this._adapter = adapter
      this._remoteId = remoteId

      this._vmBackupDir = getVmBackupDir(rest.vmUuid)
    }

    // `cleanup`: the clean-vm is a cleanup subtask, it also runs after the backup has been aborted (level 1).
    //
    // The signal given to the clean is the one of the skip of the cleanup (level 2): it stops the clean and its merges
    // between two operations, the merge keeps its state and the next clean resumes it. The abort of the backup alone
    // does not stop a running merge. Before the transfer (`cleanup` is false), a merge not started yet when the backup
    // is aborted does not start: its subtask fails right away, and the clean after the transfer runs it instead.
    async _cleanVm({ cleanup = false, ...options }) {
      try {
        return await Task.run({ properties: { name: 'clean-vm' }, cleanup }, () => {
          return this._adapter.cleanVm(this._vmBackupDir, {
            ...options,
            signal: Task.cleanupSignal,
            logInfo: info,
            logWarn: (message, data) => {
              warn(message, data)
              Task.warning(message, data)
            },
            lock: false,
            mergeBlockConcurrency: this._config.mergeBlockConcurrency,
          })
        })
      } catch (error) {
        warn(error)
        return {}
      }
    }

    async getLongTermRetentionTags(currentEntry) {
      const settings = this._settings
      const scheduleId = this._schedule.id
      const vmUuid = this._vmUuid
      const adapter = this._adapter

      const entries = await adapter.listVmBackups(vmUuid, _ => _.scheduleId === scheduleId)
      entries.push(currentEntry)
      const buckets = getEntryStatus(entries, currentEntry, settings.longTermRetention, settings.timezone)

      return buckets.map(({ duration, dateBucket }) => `${duration}=${dateBucket}`)
    }

    async beforeBackup() {
      const { handler } = this._adapter
      const vmBackupDir = this._vmBackupDir
      await handler.mktree(vmBackupDir)
      this.#lock = await handler.lock(vmBackupDir)
    }

    async afterBackup() {
      const { disableMergeWorker } = this._config
      // merge worker only compatible with local remotes
      const { handler } = this._adapter
      const synchronousMerge = this._settings.mergeBackupsSynchronously
      const willMergeInWorker = !synchronousMerge && !disableMergeWorker && typeof handler.getRealPath === 'function'
      let merge
      try {
        // part of the cleanup: it also runs after an abort, merge included, until the cleanup is skipped (level 2
        // abort): the lock is released in all cases and no merge is queued, the next run cleans the leftovers
        ;({ merge } = await this._cleanVm({ cleanup: true, remove: true, merge: !willMergeInWorker }))
      } finally {
        await this.#lock.dispose()
      }

      // the clean may have completed after the skip of the cleanup, once past its last stop point
      if (merge && willMergeInWorker && Task.cleanupSignal?.aborted !== true) {
        const taskFile =
          join(MergeWorker.CLEAN_VM_QUEUE, formatFilenameDate(new Date())) +
          '-' +
          // add a random suffix to avoid collision in case multiple tasks are created at the same second
          Math.random().toString(36).slice(2)

        await handler.outputFile(taskFile, this._vmUuid)
        const remotePath = handler.getRealPath()
        await MergeWorker.run(remotePath)
      }
    }

    healthCheck() {
      const sr = this._healthCheckSr
      assert.notStrictEqual(sr, undefined, 'SR should be defined before making a health check')
      if (this._metadataFileName === undefined) {
        // this can happen when making a mirror backup with nothing to transfer
        Task.info('no health check, since no backup have been transferred')
        return
      }
      return Task.run(
        {
          properties: { name: 'health check' },
        },
        async () => {
          const xapi = sr.$xapi
          const srUuid = sr.uuid
          const adapter = this._adapter
          const metadata = await adapter.readVmBackupMetadata(this._metadataFileName)
          const { id: restoredId } = await new ImportVmBackup({
            adapter,
            metadata,
            srUuid,
            xapi,
            settings: {
              additionalVmTag: 'xo:no-bak=Health Check',
              vmNamePrefix: '[Health Check] ',
            },
          }).run()
          let restoredVm
          try {
            restoredVm = xapi.getObject(restoredId)
          } catch (err) {
            restoredVm = await xapi.waitObject(restoredId)
          }
          try {
            const timeout = ms(this._settings.healthCheckTimeout)
            await new HealthCheckVmBackup({
              restoredVm,
              timeout,
              xapi,
            }).run()
          } finally {
            await xapi.VM_destroy(restoredVm.$ref, { bypassBlockedOperation: true })
          }
        }
      )
    }

    async _isAlreadyTransferred(timestamp) {
      const vmUuid = this._vmUuid
      const adapter = this._adapter
      const backupDir = getVmBackupDir(vmUuid)
      try {
        const actualMetadata = JSON.parse(
          await adapter._handler.readFile(`${backupDir}/${formatFilenameDate(timestamp)}.json`)
        )
        return actualMetadata
      } catch (error) {}
    }
  }
