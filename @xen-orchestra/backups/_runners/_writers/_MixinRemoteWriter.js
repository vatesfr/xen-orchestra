'use strict'

const { createLogger } = require('@xen-orchestra/log')
const { join } = require('path')

const assert = require('assert')
const { formatFilenameDate } = require('../../_filenameDate.js')
const { getVmBackupDir } = require('../../_getVmBackupDir.js')
const { HealthCheckVmBackup } = require('../../HealthCheckVmBackup.js')
const { ImportVmBackup } = require('../../ImportVmBackup.js')
const { Task } = require('../../Task.js')
const MergeWorker = require('../../merge-worker/index.js')

const { info, warn } = createLogger('xo:backups:MixinBackupWriter')

exports.MixinRemoteWriter = (BaseClass = Object) =>
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
      const willMergeInWorker = !disableMergeWorker && typeof handler.getRealPath === 'function'

      const { merge } = await this._cleanVm({ remove: true, merge: !willMergeInWorker })
      await this.#lock.dispose()

      if (merge && willMergeInWorker) {
        const taskFile =
          join(MergeWorker.CLEAN_VM_QUEUE, formatFilenameDate(new Date())) +
          '-' +
          // add a random suffix to avoid collision in case multiple tasks are created at the same second
          Math.random().toString(36).slice(2)

        await handler.outputFile(taskFile, this._backup.vm.uuid)
        const remotePath = handler.getRealPath()
        await MergeWorker.run(remotePath)
      }
    }

    healthCheck() {
      const sr = this._settings.healthCheckSr
      assert.notStrictEqual(sr, undefined, 'SR should be defined before making a health check')
      assert.notStrictEqual(
        this._metadataFileName,
        undefined,
        'Metadata file name should be defined before making a health check'
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

    _isAlreadyTransferred(timestamp) {
      const vmUuid = this._vmUuid
      const adapter = this._adapter
      const backupDir = getVmBackupDir(vmUuid)
      try {
        const actualMetadata = JSON.parse(
          adapter._handler.readFile(`${backupDir}/${formatFilenameDate(timestamp)}.json`)
        )
        return actualMetadata
      } catch (error) {}
    }
  }
