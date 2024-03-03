import assert from 'node:assert'

import { formatFilenameDate } from './_filenameDate.mjs'
import { importIncrementalVm } from './_incrementalVm.mjs'
import { Task } from './Task.mjs'
import { watchStreamSize } from './_watchStreamSize.mjs'
import { VhdNegative, VhdSynthetic } from 'vhd-lib'
import { decorateClass } from '@vates/decorate-with'
import { createLogger } from '@xen-orchestra/log'
import { dirname, join } from 'node:path'
import pickBy from 'lodash/pickBy.js'
import { defer } from 'golike-defer'

const { debug, info, warn } = createLogger('xo:backups:importVmBackup')
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
  constructor({
    adapter,
    metadata,
    srUuid,
    xapi,
    settings: { additionnalVmTag, newMacAddresses, mapVdisSrs = {}, useDifferentialRestore = false } = {},
  }) {
    this._adapter = adapter
    this._importIncrementalVmSettings = { additionnalVmTag, newMacAddresses, mapVdisSrs, useDifferentialRestore }
    this._metadata = metadata
    this._srUuid = srUuid
    this._xapi = xapi
  }

  async #getPathOfVdiSnapshot(snapshotUuid) {
    const metadata = this._metadata
    if (this._pathToVdis === undefined) {
      const backups = await this._adapter.listVmBackups(
        this._metadata.vm.uuid,
        ({ mode, timestamp }) => mode === 'delta' && timestamp >= metadata.timestamp
      )
      const map = new Map()
      for (const backup of backups) {
        for (const [vdiRef, vdi] of Object.entries(backup.vdis)) {
          map.set(vdi.uuid, backup.vhds[vdiRef])
        }
      }
      this._pathToVdis = map
    }
    return this._pathToVdis.get(snapshotUuid)
  }

  async _reuseNearestSnapshot($defer, ignoredVdis) {
    const metadata = this._metadata
    const { mapVdisSrs } = this._importIncrementalVmSettings
    const { vbds, vhds, vifs, vm, vmSnapshot } = metadata
    const streams = {}
    const metdataDir = dirname(metadata._filename)
    const vdis = ignoredVdis === undefined ? metadata.vdis : pickBy(metadata.vdis, vdi => !ignoredVdis.has(vdi.uuid))

    for (const [vdiRef, vdi] of Object.entries(vdis)) {
      const vhdPath = join(metdataDir, vhds[vdiRef])

      let xapiDisk
      try {
        xapiDisk = await this._xapi.getRecordByUuid('VDI', vdi.$snapshot_of$uuid)
      } catch (err) {
        // if this disk is not present anymore, fall back to default restore
        warn(err)
      }

      let snapshotCandidate, backupCandidate
      if (xapiDisk !== undefined) {
        debug('found disks, wlll search its snapshots', { snapshots: xapiDisk.snapshots })
        for (const snapshotRef of xapiDisk.snapshots) {
          const snapshot = await this._xapi.getRecord('VDI', snapshotRef)
          debug('handling snapshot', { snapshot })

          // take only the first snapshot
          if (snapshotCandidate && snapshotCandidate.snapshot_time < snapshot.snapshot_time) {
            debug('already got a better candidate')
            continue
          }

          // have a corresponding backup more recent than metadata ?
          const pathToSnapshotData = await this.#getPathOfVdiSnapshot(snapshot.uuid)
          if (pathToSnapshotData === undefined) {
            debug('no backup linked to this snaphot')
            continue
          }
          if (snapshot.$SR.uuid !== (mapVdisSrs[vdi.$snapshot_of$uuid] ?? this._srUuid)) {
            debug('not restored on the same SR', { snapshotSr: snapshot.$SR.uuid, mapVdisSrs, srUuid: this._srUuid })
            continue
          }

          debug('got a candidate', pathToSnapshotData)

          snapshotCandidate = snapshot
          backupCandidate = pathToSnapshotData
        }
      }

      let stream
      const backupWithSnapshotPath = join(metdataDir, backupCandidate ?? '')
      if (vhdPath === backupWithSnapshotPath) {
        // all the data are already on the host
        debug('direct reuse of a snapshot')
        stream = null
        vdis[vdiRef].baseVdi = snapshotCandidate
        // go next disk , we won't use this stream
        continue
      }

      let disposableDescendants

      const disposableSynthetic = await VhdSynthetic.fromVhdChain(this._adapter._handler, vhdPath)

      // this will also clean if another disk of this VM backup fails
      // if user really only need to restore non failing disks he can retry with ignoredVdis
      let disposed = false
      const disposeOnce = async () => {
        if (!disposed) {
          disposed = true
          try {
            await disposableDescendants?.dispose()
            await disposableSynthetic?.dispose()
          } catch (error) {
            warn('openVhd: failed to dispose VHDs', { error })
          }
        }
      }
      $defer.onFailure(() => disposeOnce())

      const parentVhd = disposableSynthetic.value
      await parentVhd.readBlockAllocationTable()
      debug('got vhd synthetic of parents', parentVhd.length)

      if (snapshotCandidate !== undefined) {
        try {
          debug('will try to use differential restore', {
            backupWithSnapshotPath,
            vhdPath,
            vdiRef,
          })

          disposableDescendants = await VhdSynthetic.fromVhdChain(this._adapter._handler, backupWithSnapshotPath, {
            until: vhdPath,
          })
          const descendantsVhd = disposableDescendants.value
          await descendantsVhd.readBlockAllocationTable()
          debug('got vhd synthetic of descendants')
          const negativeVhd = new VhdNegative(parentVhd, descendantsVhd)
          debug('got vhd negative')

          // update the stream with the negative vhd stream
          stream = await negativeVhd.stream()
          vdis[vdiRef].baseVdi = snapshotCandidate
        } catch (error) {
          // can be a broken VHD chain, a vhd chain with a key backup, ....
          // not an irrecuperable error, don't dispose parentVhd, and fallback to full restore
          warn(`can't use differential restore`, { error })
          disposableDescendants?.dispose()
        }
      }
      // didn't make a negative stream : fallback to classic stream
      if (stream === undefined) {
        debug('use legacy restore')
        stream = await parentVhd.stream()
      }

      stream.on('end', disposeOnce)
      stream.on('close', disposeOnce)
      stream.on('error', disposeOnce)
      info('everything is ready, will transfer', stream.length)
      streams[`${vdiRef}.vhd`] = stream
    }
    return {
      streams,
      vbds,
      vdis,
      version: '1.0.0',
      vifs,
      vm: { ...vm, suspend_VDI: vmSnapshot.suspend_VDI },
    }
  }

  async #decorateIncrementalVmMetadata() {
    const { additionnalVmTag, mapVdisSrs, useDifferentialRestore } = this._importIncrementalVmSettings

    const ignoredVdis = new Set(
      Object.entries(mapVdisSrs)
        .filter(([_, srUuid]) => srUuid === null)
        .map(([vdiUuid]) => vdiUuid)
    )
    let backup
    if (useDifferentialRestore) {
      backup = await this._reuseNearestSnapshot(ignoredVdis)
    } else {
      backup = await this._adapter.readIncrementalVmBackup(this._metadata, ignoredVdis)
    }
    const xapi = this._xapi

    const cache = new Map()
    const mapVdisSrRefs = {}
    if (additionnalVmTag !== undefined) {
      backup.vm.tags.push(additionnalVmTag)
    }
    for (const [vdiUuid, srUuid] of Object.entries(mapVdisSrs)) {
      mapVdisSrRefs[vdiUuid] = await resolveUuid(xapi, cache, srUuid, 'SR')
    }
    const srRef = await resolveUuid(xapi, cache, this._srUuid, 'SR')
    Object.values(backup.vdis).forEach(vdi => {
      vdi.SR = mapVdisSrRefs[vdi.uuid] ?? srRef
    })
    return backup
  }

  async run() {
    const adapter = this._adapter
    const metadata = this._metadata
    const isFull = metadata.mode === 'full'

    const sizeContainer = { size: 0 }
    const { newMacAddresses } = this._importIncrementalVmSettings
    let backup
    if (isFull) {
      backup = await adapter.readFullVmBackup(metadata)
      watchStreamSize(backup, sizeContainer)
    } else {
      assert.strictEqual(metadata.mode, 'delta')

      backup = await this.#decorateIncrementalVmMetadata()
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

decorateClass(ImportVmBackup, { _reuseNearestSnapshot: defer })
