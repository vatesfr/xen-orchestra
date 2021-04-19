const { createLogger } = require('@xen-orchestra/log')

const { getVmBackupDir } = require('../_getVmBackupDir')

const { debug } = createLogger('xo:backups:AbstractBackupWriter')

exports.AbstractBackupWriter = (BaseClass = Object) =>
  class AbstractBackupWriter extends BaseClass {
    constructor(props) {
      super(props)

      this._adapter = props.adapter
    }

    async beforeBackup(vmUuid) {
      try {
        await this._adapter.cleanVm(getVmBackupDir(vmUuid), { remove: true, merge: true, onLog: debug })
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          throw error
        }
      }
    }
  }
