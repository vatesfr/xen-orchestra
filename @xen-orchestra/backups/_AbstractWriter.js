const { asyncMap } = require('@xen-orchestra/async-map')
const { createLogger } = require('@xen-orchestra/log')

const { BACKUP_DIR } = require('./_getVmBackupDir')

const { debug } = createLogger('xo:backups:AbstractWriter')

exports.AbstractWriter = class AbstractWriter {
  constructor({ adapter } = {}) {
    this._adapter = adapter
  }

  async cleanCorruptedBackups() {
    const adapter = this._adapter
    if (adapter !== undefined) {
      await asyncMap(await adapter.handler.list(BACKUP_DIR, { prependDir: true }), async vmDir =>
        adapter.cleanVm(vmDir, { remove: true, merge: true, onLog: debug })
      )
    }
  }

  checkBaseVdis() {}

  cleanup() {}

  prepare() {}

  transfer() {}

  run() {}
}
