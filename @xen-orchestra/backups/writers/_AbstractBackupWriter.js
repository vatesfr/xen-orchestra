const { createLogger } = require('@xen-orchestra/log')

const { getVmBackupDir } = require('../_getVmBackupDir')

const { debug } = createLogger('xo:backups:AbstractBackupWriter')

exports.AbstractBackupWriter = (BaseClass = Object) =>
  class AbstractBackupWriter extends BaseClass {
    constructor(props) {
      super(props)

      this._backup = props.backup
      this._remoteId = props.remoteId
      this._settings = props.settings
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
