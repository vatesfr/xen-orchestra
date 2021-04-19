const { asyncMap } = require('@xen-orchestra/async-map')
const { createLogger } = require('@xen-orchestra/log')

const { BACKUP_DIR } = require('../_getVmBackupDir')

const { debug } = createLogger('xo:backups:AbstractBackupWriter')

exports.AbstractBackupWriter = Sup =>
  class AbstractBackupWriter extends Sup {
    constructor({ adapter }) {
      super()

      this._adapter = adapter
    }

    async cleanCorruptedBackups() {
      const adapter = this._adapter

      try {
        await asyncMap(await adapter.handler.list(BACKUP_DIR, { prependDir: true }), vmDir =>
          adapter.cleanVm(vmDir, { remove: true, merge: true, onLog: debug })
        )
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          throw error
        }
      }
    }
  }
