import endsWith from 'lodash.endswith'
import escapeStringRegexp from 'escape-string-regexp'
import eventToPromise from 'event-to-promise'
import execa from 'execa'
import filter from 'lodash.filter'
import findIndex from 'lodash.findindex'
import sortBy from 'lodash.sortby'
import startsWith from 'lodash.startswith'
import {
  basename,
  dirname
} from 'path'

import xapiObjectToXo from '../xapi-object-to-xo'
import {
  deferrable
} from '../decorators'
import {
  forEach,
  mapToArray,
  noop,
  pSettle,
  safeDateFormat
} from '../utils'
import {
  VDI_FORMAT_VHD
} from '../xapi'

// ===================================================================

// Test if a file is a vdi backup. (full or delta)
const isVdiBackup = name => /^\d+T\d+Z_(?:full|delta)\.vhd$/.test(name)

// Test if a file is a delta vdi backup.
const isDeltaVdiBackup = name => /^\d+T\d+Z_delta\.vhd$/.test(name)

// Get the timestamp of a vdi backup. (full or delta)
const getVdiTimestamp = name => {
  const arr = /^(\d+T\d+Z)_(?:full|delta)\.vhd$/.exec(name)
  return arr[1] || undefined
}

// ===================================================================

export default class {
  constructor (xo) {
    this._xo = xo
  }

  async listRemoteBackups (remoteId) {
    const handler = await this._xo.getRemoteHandler(remoteId)

    // List backups. (Except delta backups)
    const xvaFilter = file => endsWith(file, '.xva')

    const files = await handler.list()
    const backups = filter(files, xvaFilter)

    // List delta backups.
    const deltaDirs = filter(files, file => startsWith(file, 'vm_delta_'))

    for (const deltaDir of deltaDirs) {
      const files = await handler.list(deltaDir)
      const deltaBackups = filter(files, xvaFilter)

      backups.push(...mapToArray(
        deltaBackups,
        deltaBackup => `${deltaDir}/${deltaBackup}`
      ))
    }

    return backups
  }

  // TODO: move into utils and rename! NO, until we may pass a handler instead of a remote...?
  async _openAndwaitReadableFile (handler, file, errorMessage) {
    let stream
    try {
      stream = await handler.createReadStream(file)
      await eventToPromise(stream, 'readable')
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(errorMessage)
      }
      throw error
    }

    return stream
  }

  async importVmBackup (remoteId, file, sr) {
    const handler = await this._xo.getRemoteHandler(remoteId)
    const stream = await this._openAndwaitReadableFile(
      handler,
      file,
      'VM to import not found in this remote'
    )

    const xapi = this._xo.getXapi(sr)

    await xapi.importVm(stream, { srId: sr._xapiId })
  }

  // -----------------------------------------------------------------

  @deferrable.onFailure
  async deltaCopyVm ($onFailure, srcVm, targetSr) {
    const srcXapi = this._xo.getXapi(srcVm)
    const targetXapi = this._xo.getXapi(targetSr)

    // Get Xen objects from XO objects.
    srcVm = srcXapi.getObject(srcVm._xapiId)
    targetSr = targetXapi.getObject(targetSr._xapiId)

    // 1. Find the local base for this SR (if any).
    const TAG_LAST_BASE_DELTA = `xo:base_delta:${targetSr.uuid}`
    const localBaseUuid = (id => {
      if (id != null) {
        const base = srcXapi.getObject(id, null)
        return base && base.uuid
      }
    })(srcVm.other_config[TAG_LAST_BASE_DELTA])

    // 2. Copy.
    const dstVm = await (async () => {
      const delta = await srcXapi.exportDeltaVm(srcVm.$id, localBaseUuid)
      $onFailure(async () => {
        await Promise.all(mapToArray(
          delta.streams,
          stream => stream.cancel()
        ))

        return srcXapi.deleteVm(delta.vm.$id, true)
      })

      const promise = targetXapi.importDeltaVm(
        delta,
        {
          deleteBase: true, // Remove the remote base.
          srId: targetSr.$id
        }
      )

      // Once done, (asynchronously) remove the (now obsolete) local
      // base.
      if (localBaseUuid) {
        promise.then(() => srcXapi.deleteVm(localBaseUuid, true)).catch(noop)
      }

      // (Asynchronously) Identify snapshot as future base.
      promise.then(() => {
        return srcXapi._updateObjectMapProperty(srcVm, 'other_config', {
          [TAG_LAST_BASE_DELTA]: delta.vm.uuid
        })
      }).catch(noop)

      return promise
    })()

    // 5. Return the identifier of the new XO VM object.
    return xapiObjectToXo(dstVm).id
  }

  // -----------------------------------------------------------------

  // TODO: The other backup methods must use this function !
  // Prerequisite: The backups array must be ordered. (old to new backups)
  async _removeOldBackups (backups, handler, dir, n) {
    if (n <= 0) {
      return
    }
    const getPath = (file, dir) => dir ? `${dir}/${file}` : file

    await Promise.all(
      mapToArray(backups.slice(0, n), async backup => await handler.unlink(getPath(backup, dir)))
    )
  }

  // -----------------------------------------------------------------

  async _listVdiBackups (handler, dir) {
    let files
    try {
      files = await handler.list(dir)
    } catch (error) {
      if (error.code === 'ENOENT') {
        files = []
      } else {
        throw error
      }
    }
    const backups = sortBy(filter(files, fileName => isVdiBackup(fileName)))
    let i

    // Avoid unstable state: No full vdi found to the beginning of array. (base)
    for (i = 0; i < backups.length && isDeltaVdiBackup(backups[i]); i++);
    await this._removeOldBackups(backups, handler, dir, i)

    return backups.slice(i)
  }

  async _deltaVdiBackup ({vdi, handler, dir, depth}) {
    const xapi = this._xo.getXapi(vdi)
    const backupDirectory = `vdi_${vdi.uuid}`

    vdi = xapi.getObject(vdi._xapiId)
    dir = `${dir}/${backupDirectory}`

    const backups = await this._listVdiBackups(handler, dir)

    // Make snapshot.
    const date = safeDateFormat(new Date())
    const currentSnapshot = await xapi.snapshotVdi(vdi.$id, 'XO_DELTA_BASE_VDI_SNAPSHOT')

    const bases = sortBy(
      filter(vdi.$snapshots, { name_label: 'XO_DELTA_BASE_VDI_SNAPSHOT' }),
      base => base.snapshot_time
    )

    const base = bases.pop()

    // Remove old bases if exists.
    Promise.all(mapToArray(bases, base => xapi.deleteVdi(base.$id))).catch(noop)

    // It is strange to have no base but a full backup !
    // A full is necessary if it not exists backups or
    // the base is missing.
    const isFull = (!backups.length || !base)

    // Export full or delta backup.
    const vdiFilename = `${date}_${isFull ? 'full' : 'delta'}.vhd`
    const backupFullPath = `${dir}/${vdiFilename}`

    try {
      const sourceStream = await xapi.exportVdi(currentSnapshot.$id, {
        baseId: isFull ? undefined : base.$id,
        format: VDI_FORMAT_VHD
      })

      const targetStream = await handler.createOutputStream(backupFullPath, { flags: 'wx' })

      sourceStream.on('error', error => targetStream.emit('error', error))
      await Promise.all([
        eventToPromise(sourceStream.pipe(targetStream), 'finish'),
        sourceStream.task
      ])
    } catch (error) {
      // Remove new backup. (corrupt) and delete new vdi base.
      xapi.deleteVdi(currentSnapshot.$id).catch(noop)
      await handler.unlink(backupFullPath).catch(noop)
      throw error
    }

    // Returns relative path. (subdir and vdi filename), old/new base.
    return {
      backupDirectory,
      vdiFilename,
      oldBaseId: base && base.$id, // Base can be undefined. (full backup)
      newBaseId: currentSnapshot.$id
    }
  }

  async _mergeDeltaVdiBackups ({handler, dir, depth}) {
    if (handler.type === 'smb') {
      throw new Error('VDI merging is not available through SMB')
    }
    const backups = await this._listVdiBackups(handler, dir)
    let i = backups.length - depth

    // No merge.
    if (i <= 0) {
      return
    }

    const newFull = `${getVdiTimestamp(backups[i])}_full.vhd`
    const vhdUtil = `${__dirname}/../../bin/vhd-util`

    for (; i > 0 && isDeltaVdiBackup(backups[i]); i--) {
      const backup = `${dir}/${backups[i]}`
      const parent = `${dir}/${backups[i - 1]}`

      try {
        await execa(vhdUtil, ['modify', '-n', `${handler.path}/${backup}`, '-p', `${handler.path}/${parent}`]) // FIXME not ok at least with smb remotes
        await execa(vhdUtil, ['coalesce', '-n', `${handler.path}/${backup}`]) // FIXME not ok at least with smb remotes
      } catch (e) {
        console.error('Unable to use vhd-util.', e)
        throw e
      }

      await handler.unlink(backup)
    }

    // The base was removed, it exists two full backups or more ?
    // => Remove old backups before the most recent full.
    if (i > 0) {
      for (i--; i >= 0; i--) {
        await handler.unlink(`${dir}/${backups[i]}`)
      }

      return
    }

    // Rename the first old full backup to the new full backup.
    await handler.rename(`${dir}/${backups[0]}`, `${dir}/${newFull}`)
  }

  async _importVdiBackupContent (xapi, handler, file, vdiId) {
    const stream = await this._openAndwaitReadableFile(
      handler,
      file,
      'VDI to import not found in this remote'
    )

    await xapi.importVdiContent(vdiId, stream, {
      format: VDI_FORMAT_VHD
    })
  }

  async importDeltaVdiBackup ({vdi, remoteId, filePath}) {
    const handler = await this._xo.getRemoteHandler(remoteId)
    return this._importDeltaVdiBackup(vdi, handler, filePath)
  }

  async _importDeltaVdiBackup (vdi, handler, filePath) {
    const dir = dirname(filePath)
    const filename = basename(filePath)
    const backups = await this._listVdiBackups(handler, dir)

    // Search file. (delta or full backup)
    const i = findIndex(backups, backup =>
      getVdiTimestamp(backup) === getVdiTimestamp(filename)
    )

    if (i === -1) {
      throw new Error('VDI to import not found in this remote.')
    }

    // Search full backup.
    let j

    for (j = i; j >= 0 && isDeltaVdiBackup(backups[j]); j--);

    if (j === -1) {
      throw new Error(`Unable to found full vdi backup of: ${filePath}`)
    }

    // Restore...
    const xapi = this._xo.getXapi(vdi)

    for (; j <= i; j++) {
      await this._importVdiBackupContent(xapi, handler, `${dir}/${backups[j]}`, vdi._xapiId)
    }
  }

  // -----------------------------------------------------------------

  async _listDeltaVmBackups (handler, dir) {
    const files = await handler.list(dir)
    return await sortBy(filter(files, (fileName) => /^\d+T\d+Z_.*\.(?:xva|json)$/.test(fileName)))
  }

  async _failedRollingDeltaVmBackup (xapi, handler, dir, fulFilledVdiBackups) {
    await Promise.all(
      mapToArray(fulFilledVdiBackups, async vdiBackup => {
        const { newBaseId, backupDirectory, vdiFilename } = vdiBackup.value()

        await xapi.deleteVdi(newBaseId)
        await handler.unlink(`${dir}/${backupDirectory}/${vdiFilename}`).catch(noop)
      })
    )
  }

  async rollingDeltaVmBackup ({vm, remoteId, tag, depth}) {
    const remote = await this._xo.getRemote(remoteId)

    if (!remote) {
      throw new Error(`No such Remote ${remoteId}`)
    }
    if (!remote.enabled) {
      throw new Error(`Remote ${remoteId} is disabled`)
    }

    const handler = await this._xo.getRemoteHandler(remote)
    if (handler.type === 'smb') {
      throw new Error('Delta Backup is not supported for smb remotes')
    }

    const dir = `vm_delta_${tag}_${vm.uuid}`

    const info = {
      vbds: [],
      vdis: {}
    }

    const promises = []
    const xapi = this._xo.getXapi(vm)

    for (const vbdId of vm.$VBDs) {
      const vbd = this._xo.getObject(vbdId)

      if (!vbd.VDI) {
        continue
      }

      if (vbd.is_cd_drive) {
        continue
      }

      const vdiXo = this._xo.getObject(vbd.VDI)
      const vdi = xapi.getObject(vdiXo._xapiId)
      const vdiUUID = vdi.uuid

      info.vbds.push({
        ...xapi.getObject(vbd._xapiId),
        xoVdi: vdiUUID
      })

      // Warning: There may be the same VDI id for a VBD set.
      if (!info.vdis[vdiUUID]) {
        info.vdis[vdiUUID] = { ...vdi }
        promises.push(
          this._deltaVdiBackup({handler, vdi: vdiXo, dir, depth}).then(
            vdiBackup => {
              const { backupDirectory, vdiFilename } = vdiBackup
              info.vdis[vdiUUID].xoPath = `${backupDirectory}/${vdiFilename}`

              return vdiBackup
            }
          )
        )
      }
    }

    const vdiBackups = await pSettle(promises)
    const fulFilledVdiBackups = []
    let fail = false

    // One or many vdi backups have failed.
    for (const vdiBackup of vdiBackups) {
      if (vdiBackup.isFulfilled()) {
        fulFilledVdiBackups.push(vdiBackup)
      } else {
        console.error(`Rejected backup: ${vdiBackup.reason()}`)
        fail = true
      }
    }

    if (fail) {
      console.error(`Remove successful backups in ${handler.path}/${dir}`, fulFilledVdiBackups)
      await this._failedRollingDeltaVmBackup(xapi, handler, dir, fulFilledVdiBackups)

      throw new Error('Rolling delta vm backup failed.')
    }

    const backups = await this._listDeltaVmBackups(handler, dir)
    const date = safeDateFormat(new Date())
    const backupFormat = `${date}_${vm.name_label}`

    const xvaPath = `${dir}/${backupFormat}.xva`
    const infoPath = `${dir}/${backupFormat}.json`

    try {
      await Promise.all([
        this._backupVm(vm, handler, xvaPath, {onlyMetadata: true}),
        handler.outputFile(infoPath, JSON.stringify(info), {flag: 'wx'})
      ])
    } catch (e) {
      await Promise.all([
        handler.unlink(xvaPath).catch(noop),
        handler.unlink(infoPath).catch(noop),
        this._failedRollingDeltaVmBackup(xapi, handler, dir, fulFilledVdiBackups)
      ])

      throw e
    }

    // Here we have a completed backup. We can merge old vdis.
    await Promise.all(
      mapToArray(vdiBackups, vdiBackup => {
        const { backupDirectory } = vdiBackup.value()
        return this._mergeDeltaVdiBackups({handler, dir: `${dir}/${backupDirectory}`, depth})
      })
    )

    // Remove x2 files : json AND xva files.
    await this._removeOldBackups(backups, handler, dir, backups.length - (depth - 1) * 2)

    // Remove old vdi bases.
    Promise.all(
      mapToArray(vdiBackups, async vdiBackup => {
        const { oldBaseId } = vdiBackup.value()

        if (oldBaseId) {
          await xapi.deleteVdi(oldBaseId)
        }
      })
    ).catch(noop)

    // Returns relative path.
    return `${dir}/${backupFormat}`
  }

  async _importVmMetadata (xapi, handler, file) {
    const stream = await this._openAndwaitReadableFile(
      handler,
      file,
      'VM metadata to import not found in this remote'
    )
    return await xapi.importVm(stream, { onlyMetadata: true })
  }

  async _importDeltaVdiBackupFromVm (xapi, vmId, handler, directory, vdiInfo) {
    const vdi = await xapi.createVdi(vdiInfo.virtual_size, vdiInfo)
    const vdiId = vdi.$id

    await this._importDeltaVdiBackup(
      this._xo.getObject(vdiId),
      handler,
      `${directory}/${vdiInfo.xoPath}`
    )

    return vdiId
  }

  async importDeltaVmBackup ({sr, remoteId, filePath}) {
    const handler = await this._xo.getRemoteHandler(remoteId)
    const xapi = this._xo.getXapi(sr)

    // Import vm metadata.
    const vm = await this._importVmMetadata(xapi, handler, `${filePath}.xva`)
    const vmName = vm.name_label

    // Disable start and change the VM name label during import.
    await Promise.all([
      xapi.addForbiddenOperationToVm(vm.$id, 'start', 'Delta backup import...'),
      xapi._setObjectProperties(vm, { name_label: `[Importing...] ${vmName}` })
    ])

    // Destroy vbds if necessary. Why ?
    // Because XenServer creates Vbds linked to the vdis of the backup vm if it exists.
    await xapi.destroyVbdsFromVm(vm.uuid)

    const info = JSON.parse(await handler.readFile(`${filePath}.json`))

    // Import VDIs.
    const vdiIds = {}
    await Promise.all(
      mapToArray(
        info.vdis,
        async vdiInfo => {
          vdiInfo.sr = sr._xapiId

          const vdiId = await this._importDeltaVdiBackupFromVm(xapi, vm.$id, remoteId, dirname(filePath), vdiInfo)
          vdiIds[vdiInfo.uuid] = vdiId
        }
      )
    )

    await Promise.all(
      mapToArray(
        info.vbds,
        vbdInfo => {
          xapi.attachVdiToVm(vdiIds[vbdInfo.xoVdi], vm.$id, vbdInfo)
        }
      )
    )

    // Import done, reenable start and set real vm name.
    await Promise.all([
      xapi.removeForbiddenOperationFromVm(vm.$id, 'start'),
      xapi._setObjectProperties(vm, { name_label: vmName })
    ])

    return xapiObjectToXo(vm).id
  }

  // -----------------------------------------------------------------

  async backupVm ({vm, remoteId, file, compress, onlyMetadata}) {
    const remote = await this._xo.getRemote(remoteId)

    if (!remote) {
      throw new Error(`No such Remote ${remoteId}`)
    }
    if (!remote.enabled) {
      throw new Error(`Backup remote ${remoteId} is disabled`)
    }

    const handler = await this._xo.getRemoteHandler(remote)
    return this._backupVm(vm, handler, file, {compress, onlyMetadata})
  }

  async _backupVm (vm, handler, file, {compress, onlyMetadata}) {
    const targetStream = await handler.createOutputStream(file, { flags: 'wx' })
    const promise = eventToPromise(targetStream, 'finish')

    const sourceStream = await this._xo.getXapi(vm).exportVm(vm._xapiId, {
      compress,
      onlyMetadata: onlyMetadata || false
    })
    sourceStream.pipe(targetStream)

    await promise
  }

  async rollingBackupVm ({vm, remoteId, tag, depth, compress, onlyMetadata}) {
    const remote = await this._xo.getRemote(remoteId)

    if (!remote) {
      throw new Error(`No such Remote ${remoteId}`)
    }
    if (!remote.enabled) {
      throw new Error(`Backup remote ${remoteId} is disabled`)
    }

    const handler = await this._xo.getRemoteHandler(remote)

    const files = await handler.list()

    const reg = new RegExp('^[^_]+_' + escapeStringRegexp(`${tag}_${vm.name_label}.xva`))
    const backups = sortBy(filter(files, (fileName) => reg.test(fileName)))

    const date = safeDateFormat(new Date())
    const file = `${date}_${tag}_${vm.name_label}.xva`

    await this._backupVm(vm, handler, file, {compress, onlyMetadata})
    await this._removeOldBackups(backups, handler, undefined, backups.length - (depth - 1))
  }

  async rollingSnapshotVm (vm, tag, depth) {
    const xapi = this._xo.getXapi(vm)
    vm = xapi.getObject(vm._xapiId)

    const reg = new RegExp('^rollingSnapshot_[^_]+_' + escapeStringRegexp(tag) + '_')
    const snapshots = sortBy(filter(vm.$snapshots, snapshot => reg.test(snapshot.name_label)), 'name_label')
    const date = safeDateFormat(new Date())

    await xapi.snapshotVm(vm.$id, `rollingSnapshot_${date}_${tag}_${vm.name_label}`)

    const promises = []
    for (let surplus = snapshots.length - (depth - 1); surplus > 0; surplus--) {
      const oldSnap = snapshots.shift()
      promises.push(xapi.deleteVm(oldSnap.uuid, true))
    }
    await Promise.all(promises)
  }

  async rollingDrCopyVm ({vm, sr, tag, depth}) {
    tag = 'DR_' + tag
    const reg = new RegExp('^' + escapeStringRegexp(`${vm.name_label}_${tag}_`) + '[0-9]{8}T[0-9]{6}Z$')

    const targetXapi = this._xo.getXapi(sr)
    sr = targetXapi.getObject(sr._xapiId)
    const sourceXapi = this._xo.getXapi(vm)
    vm = sourceXapi.getObject(vm._xapiId)

    const vms = []
    forEach(sr.$VDIs, vdi => {
      const vbds = vdi.$VBDs
      const vm = vbds && vbds[0] && vbds[0].$VM
      if (vm && reg.test(vm.name_label)) {
        vms.push(vm)
      }
    })
    const olderCopies = sortBy(vms, 'name_label')

    const copyName = `${vm.name_label}_${tag}_${safeDateFormat(new Date())}`
    const drCopy = await sourceXapi.remoteCopyVm(vm.$id, targetXapi, sr.$id, {
      nameLabel: copyName
    })
    await targetXapi.addTag(drCopy.$id, 'Disaster Recovery')

    const promises = []
    for (let surplus = olderCopies.length - (depth - 1); surplus > 0; surplus--) {
      const oldDRVm = olderCopies.shift()
      promises.push(targetXapi.deleteVm(oldDRVm.$id, true))
    }
    await Promise.all(promises)
  }
}
