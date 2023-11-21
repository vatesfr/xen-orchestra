import assert from 'node:assert'

import { formatFilenameDate } from './_filenameDate.mjs'
import { importIncrementalVm } from './_incrementalVm.mjs'
import { Task } from './Task.mjs'
import { watchStreamSize } from './_watchStreamSize.mjs'

async function resolveUuid(xapi, cache, uuid, type) {
  if (uuid == null) {
    return uuid
  }
  const ref = cache.get(uuid)
  if (ref === undefined) {
    cache.set(uuid, xapi.call(`${type}.get_by_uuid`, uuid))
  }
  return cache.get(uuid)
}
export class ImportVmBackup {
  constructor({ adapter, metadata, srUuid, xapi, settings: { newMacAddresses, mapVdisSrs = {} } = {} }) {
    this._adapter = adapter
    this._importIncrementalVmSettings = { newMacAddresses, mapVdisSrs }
    this._metadata = metadata
    this._srUuid = srUuid
    this._xapi = xapi
  }

  async #decorateIncrementalVmMetadata(backup) {
    const { mapVdisSrs } = this._importIncrementalVmSettings
    const xapi = this._xapi

    const cache = new Map()
    const mapVdisSrRefs = {}
    for (const [vdiUuid, srUuid] of Object.entries(mapVdisSrs)) {
      mapVdisSrRefs[vdiUuid] = await resolveUuid(xapi, cache, srUuid, 'SR')
    }
    const sr = await resolveUuid(xapi, cache, this._srUuid, 'SR')
    Object.values(backup.vdis).forEach(vdi => {
      vdi.SR = mapVdisSrRefs[vdi.uuid] ?? sr.$ref
    })
    return backup
  }

  async run() {
    const adapter = this._adapter
    const metadata = this._metadata
    const isFull = metadata.mode === 'full'

    const sizeContainer = { size: 0 }
    const { mapVdisSrs, newMacAddresses } = this._importIncrementalVmSettings
    let backup
    if (isFull) {
      backup = await adapter.readFullVmBackup(metadata)
      watchStreamSize(backup, sizeContainer)
    } else {
      assert.strictEqual(metadata.mode, 'delta')

      const ignoredVdis = new Set(
        Object.entries(mapVdisSrs)
          .filter(([_, srUuid]) => srUuid === null)
          .map(([vdiUuid]) => vdiUuid)
      )
      backup = await this.#decorateIncrementalVmMetadata(await adapter.readIncrementalVmBackup(metadata, ignoredVdis))
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
              newMacAddresses,
            })

        await Promise.all([
          xapi.call('VM.add_tags', vmRef, 'restored from backup'),
          xapi.call(
            'VM.set_name_label',
            vmRef,
            `${metadata.vm.name_label} (${formatFilenameDate(metadata.timestamp)})`
          ),
          xapi.call(
            'VM.set_name_description',
            vmRef,
            `Restored on ${formatFilenameDate(+new Date())} from ${adapter._handler._remote.name} -
             ${metadata.vm.name_description}
            `
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
