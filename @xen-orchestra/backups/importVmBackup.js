const assert = require('assert')

const { formatFilenameDate } = require('./_filenameDate')
const { importDeltaVm } = require('./_deltaVm')
const { Task } = require('./task')

exports.ImportVmBackup = class ImportVmBackup {
  constructor({ adapter, metadata, srUuid, xapi }) {
    this._adapter = adapter
    this._metadata = metadata
    this._srUuid = srUuid
    this._xapi = xapi
  }

  async run() {
    const adapter = this._adapter
    const metadata = this._metadata
    const isFull = metadata.mode === 'full'

    let backup
    if (isFull) {
      backup = await adapter.readFullVmBackup(metadata)
    } else {
      assert.strictEqual(metadata.mode, 'delta')

      backup = await adapter.readDeltaVmBackup(metadata)
    }

    return Task.run(
      {
        name: 'transfer',
      },
      async () => {
        const xapi = this._xapi
        const srRef = await xapi.call('SR.get_by_uuid', this._srUuid)

        const vmRef = isFull
          ? await xapi.VM_import(backup, srRef)
          : await importDeltaVm(backup, await xapi.getRecord('SR', srRef), {
              detectBase: false,
            })

        await Promise.all([
          xapi.call('VM.add_tags', vmRef, 'restored from backup'),
          xapi.call(
            'VM.set_name_label',
            vmRef,
            `${metadata.vm.name_label} (${formatFilenameDate(metadata.timestamp)})`
          ),
        ])

        return {
          size: metadata.size,
          id: await xapi.getField('VM', vmRef, 'uuid'),
        }
      }
    ).catch(() => {}) // errors are handled by logs
  }
}
