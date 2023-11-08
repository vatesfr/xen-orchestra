import assert from 'node:assert'

import { formatFilenameDate } from './_filenameDate.mjs'
import { TAG_COPY_SRC, importIncrementalVm } from './_incrementalVm.mjs'
import { Task } from './Task.mjs'
import { watchStreamSize } from './_watchStreamSize.mjs'
import cloneDeep from 'lodash/cloneDeep.js'

const resolveUuid = async (xapi, cache, uuid, type) => {
  if (uuid == null) {
    return uuid
  }
  let ref = cache.get(uuid)
  if (ref === undefined) {
    ref = await xapi.call(`${type}.get_by_uuid`, uuid)
    cache.set(uuid, ref)
  }
  return ref
}
export class ImportVmBackup {
  constructor({ adapter, metadata, srUuid, xapi, settings: { newMacAddresses, mapVdisSrs = {} } = {} }) {
    this._adapter = adapter
    this._importIncrementalVmSettings = { newMacAddresses, mapVdisSrs }
    this._metadata = metadata
    this._srUuid = srUuid
    this._xapi = xapi
  }

  async #decorateIncrementalVmMetadata(exportedVm) {
    const { mapVdisSrs } = this._importIncrementalVmSettings
    const sr = this._sr
    const xapi = sr.$xapi
    const vm = cloneDeep(exportedVm)

    vm.other_config[TAG_COPY_SRC] = exportedVm.uuid

    const cache = new Map()
    const mapVdisSrRefs = {}
    for (const [vdiUuid, srUuid] of Object.entries(mapVdisSrs)) {
      mapVdisSrRefs[vdiUuid] = await resolveUuid(xapi, cache, srUuid, 'SR')
    }
    Object.values(exportedVm.vdis, vdi => {
      vdi.SR = mapVdisSrRefs[vdi.uuid] ?? sr.$ref

      // @todo : for differential restore : here we do some magic on the stream /baseVdi if we can take a fast path
    })
    return vm
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

      const ignoredVdis = new Set(
        Object.entries(this._importIncrementalVmSettings.mapVdisSrs)
          .filter(([_, srUuid]) => srUuid === null)
          .map(([vdiUuid]) => vdiUuid)
      )
      backup = await adapter.readIncrementalVmBackup(metadata, ignoredVdis)
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
          : await importIncrementalVm(
              {
                ...backup,
                vm: await this.#decorateIncrementalVmMetadata(backup.vm),
              },
              await xapi.getRecord('SR', srRef),
              {
                ...this._importIncrementalVmSettings,
                detectBase: false,
              }
            )

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
