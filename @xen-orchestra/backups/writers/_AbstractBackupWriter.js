const { createLogger } = require('@xen-orchestra/log')

const { BACKUP_DIR } = require('../_getVmBackupDir')

const { debug } = createLogger('xo:backups:AbstractBackupWriter')

exports.AbstractBackupWriter = (BaseClass = Object) =>
  class AbstractBackupWriter extends BaseClass {
    constructor(props) {
      super(props)

      this._adapter = props.adapter
    }

    async beforeBackup(vmUuid) {
      try {
        await this._adapter.cleanVm(`${BACKUP_DIR}/${vmUuid}`, { remove: true, merge: true, onLog: debug })
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          throw error
        }
      }
    }
  }
