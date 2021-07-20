const { createLogger } = require('@xen-orchestra/log')

const { getVmBackupDir } = require('../_getVmBackupDir.js')

const { warn } = createLogger('xo:backups:MixinBackupWriter')

exports.MixinBackupWriter = (BaseClass = Object) =>
  class MixinBackupWriter extends BaseClass {
    constructor({ remoteId, ...rest }) {
      super(rest)

      this._adapter = rest.backup.remoteAdapters[remoteId]
      this._remoteId = remoteId
      this._lock = undefined
    }

    _cleanVm(options) {
      return this._adapter
        .cleanVm(getVmBackupDir(this._backup.vm.uuid), { ...options, fixMetadata: true, onLog: warn, lock: false })
        .catch(warn)
    }

    async beforeBackup() {
      const { handler } = this._adapter
      const vmBackupDir = getVmBackupDir(this._backup.vm.uuid)
      await handler.mktree(vmBackupDir)
      this._lock = await handler.lock(vmBackupDir)
    }

    async afterBackup() {
      await this._cleanVm({ remove: true, merge: true })
      await this._lock.dispose()
    }
  }
