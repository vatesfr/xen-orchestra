const { createLogger } = require('@xen-orchestra/log')

const { getVmBackupDir } = require('../_getVmBackupDir')

const { debug } = createLogger('xo:backups:AbstractBackupWriter')

exports.AbstractBackupWriter = (BaseClass = Object) =>
  class AbstractBackupWriter extends BaseClass {
    constructor({ remoteId, ...rest }) {
      super(rest)

      this._remoteId = remoteId
    }

    async beforeBackup() {
      const backup = this._backup
      const adapter = backup.remoteAdapters[this._remoteId]
      try {
        await adapter.cleanVm(getVmBackupDir(backup.vm.uuid), { remove: true, merge: true, onLog: debug })
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          throw error
        }
      }
    }
  }
