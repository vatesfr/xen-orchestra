const { createLogger } = require('@xen-orchestra/log')

const { getVmBackupDir } = require('../_getVmBackupDir.js')

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

    _cleanVm(options) {
      return this._adapter
        .cleanVm(this.#vmBackupDir, { ...options, fixMetadata: true, onLog: warn, lock: false })
        .catch(warn)
    }

    async beforeBackup() {
      const { handler } = this._adapter
      const vmBackupDir = this.#vmBackupDir
      await handler.mktree(vmBackupDir)
      this.#lock = await handler.lock(vmBackupDir)
    }

    async afterBackup() {
      await this._cleanVm({ remove: true, merge: true })
      await this.#lock.dispose()
    }
  }
