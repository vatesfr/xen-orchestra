import assert from 'node:assert'

import { formatFilenameDate } from './_filenameDate.mjs'
import { importIncrementalVm } from './_incrementalVm.mjs'
import { watchStreamSize } from './_watchStreamSize.mjs'
import { decorateClass } from '@vates/decorate-with'
import { Task } from '@vates/task'
import { createLogger } from '@xen-orchestra/log'
import { dirname, join } from 'node:path'
import pickBy from 'lodash/pickBy.js'
import { defer } from 'golike-defer'
import { NegativeDisk } from '@xen-orchestra/disk-transform'
import { normalizeVdiRestoreTargets } from './_vdiRestoreTargets.mjs'
import { openDiskChain } from '@xen-orchestra/backup-archive/disks'
import { resetVmOtherConfig } from './_otherConfig.mjs'

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
  // ids of the live mounts created by this restore, so a failure can release them
  #liveMountIds = []

  /**
   * @param {object} params
   * @param {object} params.adapter - remote adapter of the backup repository
   * @param {object} params.metadata - metadata of the backup to restore
   * @param {string} params.srUuid - SR the disks are restored to, unless a per disk target says otherwise
   * @param {object} params.xapi - XAPI connection of the pool owning `srUuid`
   * @param {object} [params.liveMount] - how to serve a disk from the backup repository instead of
   * copying it, injected by the caller since a live mount outlives the restore and cannot be run
   * from this package
   * @param {({ diskPath, hostId }) => Promise<{ id: string, vdiUuid: string }>} params.liveMount.mountDisk
   * @param {(id: string) => Promise<void>} params.liveMount.unmountDisk
   * @param {object} [params.settings]
   */
  constructor({
    adapter,
    liveMount,
    metadata,
    srUuid,
    xapi,
    settings: { additionalVmTag, newMacAddresses, mapVdisSrs = {}, useDifferentialRestore = false } = {},
  }) {
    this._adapter = adapter
    this._importIncrementalVmSettings = { additionalVmTag, newMacAddresses, useDifferentialRestore }
    this._liveMount = liveMount
    this._metadata = metadata
    this._srUuid = srUuid
    this._vdiRestoreTargets = normalizeVdiRestoreTargets(mapVdisSrs, { useDifferentialRestore })
    this._xapi = xapi
  }

  /** SR a disk must be restored to, the restore's default one unless its target names another */
  #getTargetSrUuid(vdiUuid) {
    const target = this._vdiRestoreTargets.get(vdiUuid)
    return (target.type === 'restore' ? target.sr : undefined) ?? this._srUuid
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

  async _reuseNearestSnapshot($defer, excludedVdiUuids) {
    const metadata = this._metadata
    const { vbds, vhds, vifs, vm, vmSnapshot, vtpms } = metadata
    const disks = {}
    const metadataDir = dirname(metadata._filename)
    const vdis =
      excludedVdiUuids === undefined ? metadata.vdis : pickBy(metadata.vdis, vdi => !excludedVdiUuids.has(vdi.uuid))

    for (const [vdiRef, vdi] of Object.entries(vdis)) {
      const vhdPath = join(metadataDir, vhds[vdiRef])

      let xapiDisk
      try {
        xapiDisk = await this._xapi.getRecordByUuid('VDI', vdi.$snapshot_of$uuid)
      } catch (err) {
        // if this disk is not present anymore, fall back to default restore
        warn(err)
      }

      let snapshotCandidate, backupCandidate
      if (xapiDisk !== undefined) {
        debug('found disks, will search its snapshots', { snapshots: xapiDisk.snapshots })
        for (const snapshotRef of xapiDisk.snapshots) {
          const snapshot = await this._xapi.getRecord('VDI', snapshotRef)

          debug('handling snapshot', { snapshot })
          if (snapshot.type === 'cbt_metadata') {
            // disk without data can't be used as a base
            debug('cbt metadata snapshot, skip')
            continue
          }
          // take only the first snapshot
          if (snapshotCandidate && snapshotCandidate.snapshot_time < snapshot.snapshot_time) {
            debug('already got a better candidate')
            continue
          }

          // have a corresponding backup more recent than metadata ?
          const pathToSnapshotData = await this.#getPathOfVdiSnapshot(snapshot.uuid)
          if (pathToSnapshotData === undefined) {
            debug('no backup linked to this snapshot')
            continue
          }
          // reusing a snapshot means cloning it, and a clone lands on the SR of its source: a
          // snapshot which is not on the SR this disk is restored to is not a usable base
          const targetSrUuid = this.#getTargetSrUuid(vdi.uuid)
          if (snapshot.$SR.uuid !== targetSrUuid) {
            debug('not restored on the same SR', { snapshotSr: snapshot.$SR.uuid, targetSrUuid })
            continue
          }

          debug('got a candidate', pathToSnapshotData)

          snapshotCandidate = snapshot
          backupCandidate = pathToSnapshotData
        }
      }

      let disk
      const backupWithSnapshotPath = join(metadataDir, backupCandidate ?? '')
      if (vhdPath === backupWithSnapshotPath) {
        // all the data are already on the host
        debug('direct reuse of a snapshot')
        disk = null
        vdis[vdiRef].baseVdi = snapshotCandidate
        // go next disk , we won't use this stream
        continue
      }

      const parent = await openDiskChain({
        handler: this._adapter._handler,
        path: vhdPath,
      })

      // this will also clean if another disk of this VM backup fails
      // if user really only need to restore non failing disks he can retry with ignoredVdis
      let disposed = false
      const disposeOnce = async () => {
        if (!disposed) {
          disposed = true
          try {
            await parent?.close()
          } catch (error) {
            warn('openVhd: failed to dispose VHDs', { error })
          }
        }
      }
      $defer.onFailure(() => disposeOnce())

      debug('got vhd synthetic of parents', parent)

      if (snapshotCandidate !== undefined) {
        let descendant, negativeDisk
        try {
          debug('will try to use differential restore', {
            backupWithSnapshotPath,
            vhdPath,
            vdiRef,
          })

          descendant = await openDiskChain({
            handler: this._adapter._handler,
            path: backupWithSnapshotPath,
            until: vhdPath,
          })

          debug('got vhd synthetic of descendants')
          negativeDisk = new NegativeDisk(parent, descendant)
          debug('got vhd negative')

          // update the stream with the negative vhd stream
          disk = negativeDisk
          vdis[vdiRef].baseVdi = snapshotCandidate
        } catch (error) {
          // can be a broken VHD chain, a vhd chain with a key backup, ....
          // not an irrecuperable error, don't dispose parentVhd, and fall back to full restore
          warn(`can't use differential restore`, { error })
          descendant?.close()
          negativeDisk?.close()
        }
      }
      // didn't make a negative stream : fall back to classic stream
      if (disk === undefined) {
        debug('use legacy restore')
        disk = parent
      }
      info('everything is ready, will transfer', disk)
      disks[vdiRef] = disk
    }
    return {
      disks,
      vbds,
      vdis,
      version: '1.0.0',
      vifs,
      vm: { ...vm, suspend_VDI: vmSnapshot.suspend_VDI },
      vtpms,
    }
  }

  async _decorateIncrementalVmMetadata() {
    const { additionalVmTag, useDifferentialRestore } = this._importIncrementalVmSettings
    const targets = this._vdiRestoreTargets

    // a live mounted disk stays on the backup repository and is served from there, so it is left
    // out of the disks to read, exactly like an ignored one, then added back below
    const liveMountedVdiUuids = targets.getLiveMountedVdiUuids()
    const excludedVdiUuids = new Set([...targets.getIgnoredVdiUuids(), ...liveMountedVdiUuids])

    let backup
    if (useDifferentialRestore) {
      backup = await this._reuseNearestSnapshot(excludedVdiUuids)
    } else {
      backup = await this._adapter.readIncrementalVmBackup(this._metadata, excludedVdiUuids)
    }
    const xapi = this._xapi

    const cache = new Map()
    if (additionalVmTag !== undefined) {
      backup.vm.tags.push(additionalVmTag)
    }
    for (const vdi of Object.values(backup.vdis)) {
      vdi.SR = await resolveUuid(xapi, cache, this.#getTargetSrUuid(vdi.uuid), 'SR')
    }

    // after the SR resolution: a live mounted VDI already exists, it is not created on any SR
    await this.#addLiveMountedVdis(backup)

    return backup
  }

  /**
   * Mount every disk whose target asks for it and add it to the backup to import, as an existing
   * VDI to attach instead of a disk to transfer.
   */
  async #addLiveMountedVdis(backup) {
    const vdiUuids = this._vdiRestoreTargets.getLiveMountedVdiUuids()
    if (vdiUuids.size === 0) {
      return
    }

    const liveMount = this._liveMount
    if (liveMount === undefined) {
      throw new Error('live mounting a disk during a restore is not supported here')
    }

    const xapi = this._xapi
    const metadata = this._metadata
    const metadataDir = dirname(metadata._filename)
    // validates that they all use the same host, since each mount is attached to a single one
    const hostId = this._vdiRestoreTargets.getLiveMountHost()

    for (const [vdiRef, vdi] of Object.entries(metadata.vdis)) {
      if (!vdiUuids.has(vdi.uuid)) {
        continue
      }

      const diskPath = join(metadataDir, metadata.vhds[vdiRef])
      const mount = await liveMount.mountDisk({ diskPath, hostId })
      this.#liveMountIds.push(mount.id)
      info('disk live mounted', { diskPath, hostId, mountId: mount.id, vdiUuid: vdi.uuid })

      const record = { ...vdi, liveMountedVdiRef: await xapi.call('VDI.get_by_uuid', mount.vdiUuid) }
      // it is attached as is: there is nothing to clone it from, nothing to transfer into it, and
      // no SR to create it on — `SR` still holds the ref it had on the backed up pool
      delete record.baseVdi
      delete record.SR
      backup.vdis[vdiRef] = record
    }
  }

  /**
   * Point the restored VM at the host serving its live mounted disks.
   *
   * Their SR is plugged on that host only, so the VM can run nowhere else.
   */
  async #setLiveMountAffinity(vmRef) {
    if (this.#liveMountIds.length === 0) {
      return
    }
    const xapi = this._xapi
    const hostId = this._vdiRestoreTargets.getLiveMountHost()
    await xapi.call('VM.set_affinity', vmRef, await xapi.call('host.get_by_uuid', hostId))
  }

  /**
   * Release the live mounts created by this restore.
   *
   * Best effort: this runs while a restore is already failing, and a mount left behind must not
   * hide the error which caused it.
   */
  async #releaseLiveMounts() {
    for (const id of this.#liveMountIds.splice(0)) {
      try {
        await this._liveMount.unmountDisk(id)
      } catch (error) {
        warn('failed to unmount a live mounted disk', { error, mountId: id })
      }
    }
  }

  async run($defer) {
    const adapter = this._adapter
    const metadata = this._metadata
    const isFull = metadata.mode === 'full'

    const sizeContainer = { size: 0 }
    const { newMacAddresses } = this._importIncrementalVmSettings
    let backup
    if (isFull) {
      if (this._vdiRestoreTargets.getLiveMountedVdiUuids().size > 0) {
        // a full backup is a single XVA stream: there is no per disk handling at all
        throw new Error('live mounting a disk is only supported when restoring an incremental backup')
      }
      backup = await adapter.readFullVmBackup(metadata)
      watchStreamSize(backup, sizeContainer)
    } else {
      assert.strictEqual(metadata.mode, 'delta')

      // the mounts are created here, before the import, and outlive this restore: only a failure
      // releases them, a successful one hands their ids back to the caller
      $defer.onFailure(() => this.#releaseLiveMounts())
      backup = await this._decorateIncrementalVmMetadata()
    }

    return Task.run(
      {
        properties: { name: 'transfer' },
      },
      async () => {
        const xapi = this._xapi
        const srRef = await xapi.call('SR.get_by_uuid', this._srUuid)

        const vmRef = isFull
          ? await xapi.VM_import(backup, srRef)
          : await importIncrementalVm(backup, await xapi.getRecord('SR', srRef), {
              newMacAddresses,
            })
        let size = 0
        if (isFull) {
          size = sizeContainer.size
        } else {
          for (const disk of Object.values(backup.disks)) {
            size += disk.getNbGeneratedBlock() * disk.getBlockSize()
          }
        }
        const remoteName = adapter._handler._remote.name
        let desc = `Restored on ${formatFilenameDate(+new Date())}`
        if (remoteName !== undefined) {
          desc += ` from ${remoteName}`
        }
        if (metadata.vm.name_description) {
          desc += ` - ${metadata.vm.name_description}`
        }
        await Promise.all([
          xapi.call('VM.add_tags', vmRef, 'restored from backup'),
          xapi.call(
            'VM.set_name_label',
            vmRef,
            `${metadata.vm.name_label} (${formatFilenameDate(metadata.timestamp)})`
          ),
          xapi.call('VM.set_name_description', vmRef, desc),
          resetVmOtherConfig(xapi, vmRef),
          this.#setLiveMountAffinity(vmRef),
        ])

        return {
          size,
          id: await xapi.getField('VM', vmRef, 'uuid'),
          liveMountIds: [...this.#liveMountIds],
        }
      }
    )
  }
}

decorateClass(ImportVmBackup, { _reuseNearestSnapshot: defer, run: defer })
