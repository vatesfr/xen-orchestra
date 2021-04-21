const { createLogger } = require('@xen-orchestra/log')

const { getVmBackupDir } = require('../_getVmBackupDir')

const { debug } = createLogger('xo:backups:AbstractBackupWriter')

exports.AbstractBackupWriter = (BaseClass = Object) =>
  class AbstractBackupWriter extends BaseClass {
    constructor({ remoteId, ...rest }) {
      super(rest)

      this._adapter = rest.backup.remoteAdapters[remoteId]
    }

    async beforeBackup() {
      try {
        await this._adapter.cleanVm(getVmBackupDir(this._backup.vm.uuid), { remove: true, merge: true, onLog: debug })
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          throw error
        }
      }
    }
  }
