const { createLogger } = require('@xen-orchestra/log')

const { getVmBackupDir } = require('../_getVmBackupDir.js')

const { debug } = createLogger('xo:backups:MixinBackupWriter')

exports.MixinBackupWriter = (BaseClass = Object) =>
  class MixinBackupWriter extends BaseClass {
    constructor({ remoteId, ...rest }) {
      super(rest)

      this._adapter = rest.backup.remoteAdapters[remoteId]
      this._remoteId = remoteId
      this._lock = undefined
    }

    async beforeBackup() {
      const adapter = this._adapter
      const vmBackupDir = getVmBackupDir(this._backup.vm.uuid)

      try {
        await adapter.cleanVm(vmBackupDir, { remove: true, merge: true, onLog: debug })
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          throw error
        }
      }

      this._lock = await adapter.handler.lock(vmBackupDir)
    }

    async afterBackup() {
      await this._lock.dispose()
    }
  }
