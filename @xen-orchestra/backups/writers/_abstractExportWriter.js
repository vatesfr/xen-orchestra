const { asyncMap } = require('@xen-orchestra/async-map')
const { createLogger } = require('@xen-orchestra/log')

const { BACKUP_DIR } = require('../_getVmBackupDir')

const { debug } = createLogger('xo:backups:abstractExportWriter')

exports.abstractExportWriter = {
  async cleanCorruptedBackups() {
    const adapter = this._adapter
    await asyncMap(await adapter.handler.list(BACKUP_DIR, { prependDir: true }), vmDir =>
      adapter.cleanVm(vmDir, { remove: true, merge: true, onLog: debug })
    )
  },
}
