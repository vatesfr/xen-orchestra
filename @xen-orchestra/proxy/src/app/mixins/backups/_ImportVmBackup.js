import assert from 'assert'
import { formatFilenameDate } from '@xen-orchestra/backups/filenameDate'

import { importDeltaVm } from './_deltaVm'

export class ImportVmBackup {
  constructor({ adapter, backupId, srUuid, xapi }) {
    this._adapter = adapter
    this._backupId = backupId
    this._srUuid = srUuid
    this._xapi = xapi
  }

  async run() {
    const xapi = this._xapi
    const srRef = await xapi.call('SR.get_by_uuid', this._srUuid)

    const adapter = this._adapter
    const metadata = await adapter.readVmBackupMetadata(this._backupId)
    let vmRef
    if (metadata.mode === 'full') {
      vmRef = await xapi.VM_import(await adapter.readFullVmBackup(metadata), srRef)
    } else {
      assert.strictEqual(metadata.mode, 'delta')

      vmRef = await importDeltaVm(await adapter.readDeltaVmBackup(metadata), await xapi.getRecord('SR', srRef), {
        detectBase: false,
      })
    }

    await Promise.all([
      xapi.call('VM.add_tags', vmRef, 'restored from backup'),
      xapi.call('VM.set_name_label', vmRef, `${metadata.vm.name_label} (${formatFilenameDate(metadata.timestamp)})`),
    ])

    return xapi.getField('VM', vmRef, 'uuid')
  }
}
