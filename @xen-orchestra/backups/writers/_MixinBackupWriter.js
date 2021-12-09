const { createLogger } = require('@xen-orchestra/log')
const { join } = require('path')

const { BACKUP_DIR, getVmBackupDir } = require('../_getVmBackupDir.js')
const MergeWorker = require('../merge-worker/index.js')
const { formatFilenameDate } = require('../_filenameDate.js')

const { warn } = createLogger('xo:backups:MixinBackupWriter')

exports.MixinBackupWriter = (BaseClass = Object) =>
  class MixinBackupWriter extends BaseClass {
    #lock
    #vmBackupDir

    constructor({ remoteId, ...rest }) {
      super(rest)

      this._adapter = rest.backup.remoteAdapters[remoteId]
      this._remoteId = remoteId

      this.#vmBackupDir = getVmBackupDir(this._backup.vm.uuid)
    }

    async _cleanVm(options) {
      try {
        return await this._adapter.cleanVm(this.#vmBackupDir, {
          ...options,
          fixMetadata: true,
          onLog: warn,
          lock: false,
        })
      } catch (error) {
        warn(error)
        return {}
      }
    }

    async beforeBackup() {
      const { handler } = this._adapter
      const vmBackupDir = this.#vmBackupDir
      await handler.mktree(vmBackupDir)
      this.#lock = await handler.lock(vmBackupDir)
    }

    async afterBackup() {
      const { disableMergeWorker } = this._backup.config

      const { merge } = await this._cleanVm({ remove: true, merge: disableMergeWorker })
      await this.#lock.dispose()

      // merge worker only compatible with local remotes
      const { handler } = this._adapter
      if (merge && !disableMergeWorker && typeof handler._getRealPath === 'function') {
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
  }
