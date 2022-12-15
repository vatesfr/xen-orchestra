'use strict'

const { createLogger } = require('@xen-orchestra/log')
const { join } = require('path')

const assert = require('assert')
const { formatFilenameDate } = require('../_filenameDate.js')
const { getVmBackupDir } = require('../_getVmBackupDir.js')
const { HealthCheckVmBackup } = require('../HealthCheckVmBackup.js')
const { ImportVmBackup } = require('../ImportVmBackup.js')
const { Task } = require('../Task.js')
const MergeWorker = require('../merge-worker/index.js')

const { info, warn } = createLogger('xo:backups:MixinBackupWriter')

exports.MixinBackupWriter = (BaseClass = Object) =>
  class MixinBackupWriter extends BaseClass {
    #lock

    constructor({ remoteId, ...rest }) {
      super(rest)

      this._adapter = rest.backup.remoteAdapters[remoteId]
      this._remoteId = remoteId

      this._vmBackupDir = getVmBackupDir(this._backup.vm.uuid)
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
            mergeBlockConcurrency: this._backup.config.mergeBlockConcurrency,
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
      const { disableMergeWorker } = this._backup.config
      // merge worker only compatible with local remotes
      const { handler } = this._adapter
      const willMergeInWorker = !disableMergeWorker && typeof handler._getRealPath === 'function'

      const { merge } = await this._cleanVm({ remove: true, merge: !willMergeInWorker })
      await this.#lock.dispose()

      if (merge && willMergeInWorker) {
        const taskFile =
          join(MergeWorker.CLEAN_VM_QUEUE, formatFilenameDate(new Date())) +
          '-' +
          // add a random suffix to avoid collision in case multiple tasks are created at the same second
          Math.random().toString(36).slice(2)

        await handler.outputFile(taskFile, this._backup.vm.uuid)
        const remotePath = handler._getRealPath()
        await MergeWorker.run(remotePath)
      }
    }

    healthCheck(sr) {
      assert.notStrictEqual(
        this._metadataFileName,
        undefined,
        'Metadata file name should be defined before making a healthcheck'
      )
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
          }).run()
          const restoredVm = xapi.getObject(restoredId)
          try {
            await new HealthCheckVmBackup({
              restoredVm,
              xapi,
            }).run()
          } finally {
            await xapi.VM_destroy(restoredVm.$ref)
          }
        }
      )
    }
  }
