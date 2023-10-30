import assert from 'node:assert'

import { formatFilenameDate } from './_filenameDate.mjs'
import { importIncrementalVm } from './_incrementalVm.mjs'
import { Task } from './Task.mjs'
import { watchStreamSize } from './_watchStreamSize.mjs'

export class ImportVmBackup {
  constructor({ adapter, metadata, srUuid, xapi, settings: { newMacAddresses, mapVdisSrs = {} } = {} }) {
    this._adapter = adapter
    this._importIncrementalVmSettings = { newMacAddresses, mapVdisSrs }
    this._metadata = metadata
    this._srUuid = srUuid
    this._xapi = xapi
  }

  async #detectBaseVdis(){
    const vmUuid = this._metadata.vm.uuid
    const vm = await this._xapi.getRecordByUuid('VM', vmUuid)
    const disks = vm.$getDisks()
    const snapshots = {}
    console.log({disks})
    for (const disk of Object.values(disks)){
      console.log({snapshots: disk.snapshots})
      for(const snapshotRef of disk.snapshots){
        
        const snapshot = await this._xapi.getRecordByUuid('VDI', snapshotRef)
        snapshots[snapshot.uuid] = disk.uuid
      }
    }
    console.log({snapshots})
    return snapshots
  }

  async run() {
    console.log('RUN')
    const adapter = this._adapter
    const metadata = this._metadata
    const isFull = metadata.mode === 'full'

    const sizeContainer = { size: 0 }

    let backup
    
    if (isFull) {
      backup = await adapter.readFullVmBackup(metadata)
      watchStreamSize(backup, sizeContainer)
    } else {
      console.log('restore delta')
      assert.strictEqual(metadata.mode, 'delta')
      const ignoredVdis = new Set(
        Object.entries(this._importIncrementalVmSettings.mapVdisSrs)
          .filter(([_, srUuid]) => srUuid === null)
          .map(([vdiUuid]) => vdiUuid)
      )
      //const vdiSnap = await this._xapi.getRecord('VDI-snapshot','83c96977-9bc5-483d-b816-4c96622fb5e6') 
      //console.log({vdiSnap})
      const baseVdis = this.#detectBaseVdis()
      backup = await adapter.readIncrementalVmBackup(metadata, ignoredVdis, { baseVdis })
      
      Object.values(backup.streams).forEach(stream => watchStreamSize(stream, sizeContainer))
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
          : await importIncrementalVm(backup, await xapi.getRecord('SR', srRef), {
              ...this._importIncrementalVmSettings,
              baseVdis
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
          size: sizeContainer.size,
          id: await xapi.getField('VM', vmRef, 'uuid'),
        }
      }
    )
  }
}
