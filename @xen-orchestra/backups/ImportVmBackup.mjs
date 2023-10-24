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
  
  
  async #isOnTheSameSr(vm, mapVdisSrs) {
    const xapi = this._xapi
    const vdiRefs = await xapi.VM_getDisks(vm.$ref)
    for (const vdiRef of vdiRefs) {
      const vdi = xapi.getObject(vdiRef)
      if (vdi.$SR.uuid !== mapVdisSrs[vdi.$id]) {
        return false
      }
    }
    return true
  }

  async #getIncrementalBackup(metadata, mapVdisSrs){
    const adapter = this._adapter
    const backups = await adapter.listVmBackups(metadata.vm.uuid,  _ => _.mode === 'delta' )
    // sort by date ?

    let backupWithSnapshot, snapshot
    const backupChain = []
    for(const backup of backups){
      if(backup.timestamp <= metadata.timestamp){
        // we won't use backup done before the cbackup that will be restored
        continue
      }
      backupChain.push(backup)
      if(backup.mode ==='full'){
        break
      }
      if((snapshot = getSnapshot(backup))!== undefined){ // check if this backup have a snapshot
        backupWithSnapshot = backup
        break;
      }
    }

    const ignoredVdis = new Set(
      Object.entries(mapVdisSrs)
        .filter(([_, srUuid]) => srUuid === null)
        .map(([vdiUuid]) => vdiUuid)
    )
    
    if(backupWithSnapshot !== undefined 
        && !this.#isOnTheSameSr(snapshot, mapVdisSrs) // can only use the fast path if the disk are restored in place
        && adapter.allDiskAreDifferencing(backupChain.slice(1),ignoredVdis)){ // a delta backup can contains full disk ( newly created disk , problem with storage)
      // we can use the fast path
      return adapter.createNegativeVm(backupWithSnapshot,metadata, ignoredVdis)
    }

    // fallback to the normal restore
    return adapter.readIncrementalVmBackup(metadata, ignoredVdis)

  }
  
  async run() {
    const adapter = this._adapter
    const metadata = this._metadata
    const isFull = metadata.mode === 'full'

    const sizeContainer = { size: 0 }

    let backup
    if (isFull) {
      backup = await adapter.readFullVmBackup(metadata)
      watchStreamSize(backup, sizeContainer)
    } else {
      assert.strictEqual(metadata.mode, 'delta')

      backup = await this.#getIncrementalBackup(metadata, this._importIncrementalVmSettings.mapVdisSrs)
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
          size: sizeContainer.size,
          id: await xapi.getField('VM', vmRef, 'uuid'),
        }
      }
    )
  }
}
