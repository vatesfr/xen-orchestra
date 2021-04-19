const { asyncMap } = require('@xen-orchestra/async-map')
const { createLogger } = require('@xen-orchestra/log')

const { BACKUP_DIR } = require('../_getVmBackupDir')

const { debug } = createLogger('xo:backups:AbstractBackupWriter')

exports.AbstractBackupWriter = (Sub = Object) =>
  class AbstractBackupWriter extends Sup {
    constructor(props) {
      super(props)

      this._adapter = props.adapter
    }

    async cleanCorruptedBackups() {
      const adapter = this._adapter

      await asyncMap(
        await adapter.handler.list(BACKUP_DIR, { prependDir: true }).catch(error => {
          if (error?.code !== 'ENOENT') {
            throw error
          }
          return []
        }),
        vmDir => adapter.cleanVm(vmDir, { remove: true, merge: true, onLog: debug })
      )
    }
  }
