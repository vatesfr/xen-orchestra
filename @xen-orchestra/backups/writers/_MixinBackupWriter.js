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

    async beforeBackup() {
      const { handler } = this._adapter
      const vmBackupDir = getVmBackupDir(this._backup.vm.uuid)
      await handler.mktree(vmBackupDir)
      this._lock = await handler.lock(vmBackupDir)
    }

    async afterBackup() {
      await this._lock.dispose()

      try {
        await this._adapter.cleanVm(getVmBackupDir(this._backup.vm.uuid), { remove: true, merge: true, onLog: warn })
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          throw error
        }
      }
    }
  }
