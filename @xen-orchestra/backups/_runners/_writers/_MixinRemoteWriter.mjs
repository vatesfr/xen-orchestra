import { createLogger } from '@xen-orchestra/log'
import { join } from 'node:path'
import assert from 'node:assert'

import { formatFilenameDate } from '../../_filenameDate.mjs'
import { getVmBackupDir } from '../../_getVmBackupDir.mjs'
import { HealthCheckVmBackup } from '../../HealthCheckVmBackup.mjs'
import { ImportVmBackup } from '../../ImportVmBackup.mjs'
import { Task } from '../../Task.mjs'
import * as MergeWorker from '../../merge-worker/index.mjs'
import ms from 'ms'

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

    async _cleanVm(options) {
      try {
        return await Task.run({ name: 'clean-vm' }, () => {
          return this._adapter.cleanVm(this._vmBackupDir, {
            ...options,
            fixMetadata: true,
            logInfo: info,
            logWarn: (message, data) => {
              warn(message, data)
              Task.warning(message, data)
            },
            lock: false,
            mergeBlockConcurrency: this._config.mergeBlockConcurrency,
            removeTmp: true,
          })
        })
      } catch (error) {
        warn(error)
        return {}
      }
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
      const synchronousMerge = this._settings.mergeBackupSynchronouslyTpl === 'compactMjml'
      const willMergeInWorker = !synchronousMerge && !disableMergeWorker && typeof handler.getRealPath === 'function'
      const { merge } = await this._cleanVm({ remove: true, merge: !willMergeInWorker })
      await this.#lock.dispose()

      if (merge && willMergeInWorker) {
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
          name: 'health check',
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
              additionnalVmTag: 'xo:no-bak=Health Check',
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
            await xapi.VM_destroy(restoredVm.$ref)
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
