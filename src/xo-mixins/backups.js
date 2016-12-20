import deferrable from 'golike-defer'
import escapeStringRegexp from 'escape-string-regexp'
import eventToPromise from 'event-to-promise'
import execa from 'execa'
import splitLines from 'split-lines'
import { createParser as createPairsParser } from 'parse-pairs'
import { createReadStream, readdir, stat } from 'fs'
import { satisfies as versionSatisfies } from 'semver'
import { utcFormat } from 'd3-time-format'
import {
  basename,
  dirname
} from 'path'
import {
  endsWith,
  filter,
  find,
  findIndex,
  once,
  sortBy,
  startsWith
} from 'lodash'

import vhdMerge, { chainVhd } from '../vhd-merge'
import xapiObjectToXo from '../xapi-object-to-xo'
import {
  forEach,
  mapToArray,
  noop,
  pCatch,
  pFromCallback,
  pSettle,
  resolveSubpath,
  safeDateFormat,
  safeDateParse,
  tmpDir
} from '../utils'
import {
  VDI_FORMAT_VHD
} from '../xapi'

// ===================================================================

const DELTA_BACKUP_EXT = '.json'
const DELTA_BACKUP_EXT_LENGTH = DELTA_BACKUP_EXT.length

const shortDate = utcFormat('%Y-%m-%d')

// Test if a file is a vdi backup. (full or delta)
const isVdiBackup = name => /^\d+T\d+Z_(?:full|delta)\.vhd$/.test(name)

// Test if a file is a delta/full vdi backup.
const isDeltaVdiBackup = name => /^\d+T\d+Z_delta\.vhd$/.test(name)
const isFullVdiBackup = name => /^\d+T\d+Z_full\.vhd$/.test(name)

const parseVmBackupPath = name => {
  const base = basename(name)
  let baseMatches

  baseMatches = /^([^_]+)_([^_]+)_(.+)\.xva$/.exec(base)
  if (baseMatches) {
    return {
      datetime: safeDateParse(baseMatches[1]),
      id: name,
      name: baseMatches[3],
      tag: baseMatches[2],
      type: 'xva'
    }
  }

  let dirMatches
  if (
    (baseMatches = /^([^_]+)_(.+)\.json$/.exec(base)) &&
    (dirMatches = /^vm_delta_([^_]+)_(.+)$/.exec(basename(dirname(name))))
  ) {
    return {
      datetime: safeDateParse(baseMatches[1]),
      id: name,
      name: baseMatches[2],
      tag: dirMatches[1],
      type: 'delta',
      uuid: dirMatches[2]
    }
  }

  throw new Error('invalid VM backup filename')
}

// Get the timestamp of a vdi backup. (full or delta)
const getVdiTimestamp = name => {
  const arr = /^(\d+T\d+Z)_(?:full|delta)\.vhd$/.exec(name)
  return arr[1]
}

const getDeltaBackupNameWithoutExt = name => name.slice(0, -DELTA_BACKUP_EXT_LENGTH)
const isDeltaBackup = name => endsWith(name, DELTA_BACKUP_EXT)

// Checksums have been corrupted between 5.2.6 and 5.2.7.
//
// For a short period of time, bad checksums will be regenerated
// instead of rejected.
//
// TODO: restore when enough time has passed (a week/a month).
async function checkFileIntegrity (handler, name) {
  await handler.refreshChecksum(name)
  //  let stream
  //
  //  try {
  //    stream = await handler.createReadStream(name, { checksum: true })
  //  } catch (error) {
  //    if (error.code === 'ENOENT') {
  //      return
  //    }
  //
  //    throw error
  //  }
  //
  //  stream.resume()
  //  await eventToPromise(stream, 'finish')
}

// -------------------------------------------------------------------

const listPartitions = (() => {
  const IGNORED = {}
  forEach([
    // https://github.com/jhermsmeier/node-mbr/blob/master/lib/partition.js#L38
    0x05, 0x0F, 0x85, 0x15, 0x91, 0x9B, 0x5E, 0x5F, 0xCF, 0xD5, 0xC5,

    0x82 // swap
  ], type => {
    IGNORED[type] = true
  })

  const TYPES = {
    0x7: 'NTFS',
    0x83: 'linux',
    0xc: 'FAT'
  }

  const parseLine = createPairsParser({
    keyTransform: key => key === 'UUID'
      ? 'id'
      : key.toLowerCase(),
    valueTransform: (value, key) => key === 'start' || key === 'size'
      ? +value
      : key === 'type'
        ? TYPES[+value] || value
        : value
  })

  return device => execa.stdout('partx', [
    '--bytes',
    '--output=NR,START,SIZE,NAME,UUID,TYPE',
    '--pairs',
    device.path
  ]).then(stdout => filter(
    mapToArray(splitLines(stdout), parseLine),
    ({ type }) => type != null && !IGNORED[+type]
  ))
})()

const mountPartition = (device, partitionId) => Promise.all([
  partitionId != null && listPartitions(device),
  tmpDir()
]).then(([ partitions, path ]) => {
  const partition = partitionId && find(partitions, { id: partitionId })

  const options = [
    'loop',
    'ro'
  ]

  if (partition) {
    options.push(`offset=${partition.start * 512}`)

    if (partition.type === 'linux') {
      options.push('noload')
    }
  }

  return execa('mount', [
    `--options=${options.join(',')}`,
    `--source=${device.path}`,
    `--target=${path}`
  ], {
    timeout: 1e4
  }).then(() => ({
    path,
    unmount: once(() => execa('umount', [ '--lazy', path ]))
  })).catch(error => {
    console.log(error)

    throw error
  })
})

// ===================================================================

export default class {
  constructor (xo) {
    this._xo = xo
  }

  async listRemoteBackups (remoteId) {
    const handler = await this._xo.getRemoteHandler(remoteId)

    // List backups. (No delta)
    const backupFilter = file => endsWith(file, '.xva')

    const files = await handler.list()
    const backups = filter(files, backupFilter)

    // List delta backups.
    const deltaDirs = filter(files, file => startsWith(file, 'vm_delta_'))

    for (const deltaDir of deltaDirs) {
      const files = await handler.list(deltaDir)
      const deltaBackups = filter(files, isDeltaBackup)

      backups.push(...mapToArray(
        deltaBackups,
        deltaBackup => {
          return `${deltaDir}/${getDeltaBackupNameWithoutExt(deltaBackup)}`
        }
      ))
    }

    return backups
  }

  async listVmBackups (remoteId) {
    const handler = await this._xo.getRemoteHandler(remoteId)

    const backups = []

    await Promise.all(mapToArray(await handler.list(), entry => {
      if (endsWith(entry, '.xva')) {
        backups.push(parseVmBackupPath(entry))
      } else if (startsWith(entry, 'vm_delta_')) {
        return handler.list(entry).then(children => Promise.all(mapToArray(children, child => {
          if (endsWith(child, '.json')) {
            const path = `${entry}/${child}`

            const record = parseVmBackupPath(path)
            backups.push(record)

            return handler.readFile(path).then(data => {
              record.disks = mapToArray(JSON.parse(data).vdis, vdi => ({
                id: `${entry}/${vdi.xoPath}`,
                name: vdi.name_label,
                uuid: vdi.uuid
              }))
            }).catch(noop)
          }
        })))
      }
    }))

    return backups
  }

  async importVmBackup (remoteId, file, sr) {
    const handler = await this._xo.getRemoteHandler(remoteId)
    const stream = await handler.createReadStream(file)
    const xapi = this._xo.getXapi(sr)

    const vm = await xapi.importVm(stream, { srId: sr._xapiId })

    const { datetime } = parseVmBackupPath(file)
    await Promise.all([
      xapi.addTag(vm.$id, 'restored from backup'),
      xapi.editVm(vm.$id, {
        name_label: `${vm.name_label} (${shortDate(datetime)})`
      })
    ])

    return xapiObjectToXo(vm).id
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
      const delta = await srcXapi.exportDeltaVm(srcVm.$id, localBaseUuid, {
        snapshotNameLabel: `XO_DELTA_EXPORT: ${targetSr.name_label} (${targetSr.uuid})`
      })
      $onFailure(async () => {
        await Promise.all(mapToArray(
          delta.streams,
          stream => stream.cancel()
        ))

        return srcXapi.deleteVm(delta.vm.uuid, true)
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
        promise.then(() => srcXapi.deleteVm(localBaseUuid, true))::pCatch(noop)
      }

      // (Asynchronously) Identify snapshot as future base.
      promise.then(() => {
        return srcXapi._updateObjectMapProperty(srcVm, 'other_config', {
          [TAG_LAST_BASE_DELTA]: delta.vm.uuid
        })
      })::pCatch(noop)

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
      mapToArray(backups.slice(0, n), async backup => /* await */ handler.unlink(getPath(backup, dir)))
    )
  }

  // -----------------------------------------------------------------

  async _legacyImportDeltaVdiBackup (xapi, { vmId, handler, dir, vdiInfo }) {
    const vdi = await xapi.createVdi(vdiInfo.virtual_size, vdiInfo)
    const vdiId = vdi.$id

    // dir = vm_delta_xxx
    // xoPath = vdi_xxx/timestamp_(full|delta).vhd
    // vdiDir = vdi_xxx
    const { xoPath } = vdiInfo
    const filePath = `${dir}/${xoPath}`
    const vdiDir = dirname(xoPath)

    const backups = await this._listDeltaVdiDependencies(handler, filePath)

    for (const backup of backups) {
      const stream = await handler.createReadStream(`${dir}/${vdiDir}/${backup}`)

      await xapi.importVdiContent(vdiId, stream, {
        format: VDI_FORMAT_VHD
      })
    }

    return vdiId
  }

  async _legacyImportDeltaVmBackup (xapi, { remoteId, handler, filePath, info, sr }) {
    // Import vm metadata.
    const vm = await (async () => {
      const stream = await handler.createReadStream(`${filePath}.xva`)
      return /* await */ xapi.importVm(stream, { onlyMetadata: true })
    })()

    const vmName = vm.name_label
    const dir = dirname(filePath)

    // Disable start and change the VM name label during import.
    await Promise.all([
      xapi.addForbiddenOperationToVm(vm.$id, 'start', 'Delta backup import...'),
      xapi._setObjectProperties(vm, { name_label: `[Importing...] ${vmName}` })
    ])

    // Destroy vbds if necessary. Why ?
    // Because XenServer creates Vbds linked to the vdis of the backup vm if it exists.
    await xapi.destroyVbdsFromVm(vm.uuid)

    // Import VDIs.
    const vdiIds = {}
    await Promise.all(
      mapToArray(
        info.vdis,
        async vdiInfo => {
          vdiInfo.sr = sr._xapiId

          const vdiId = await this._legacyImportDeltaVdiBackup(xapi, { vmId: vm.$id, handler, dir, vdiInfo })
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

    return vm
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

  // fix the parent UUID and filename in delta files after download from xapi or backup compression
  async _chainDeltaVdiBackups ({handler, dir}) {
    const backups = await this._listVdiBackups(handler, dir)
    for (let i = 1; i < backups.length; i++) {
      const childPath = dir + '/' + backups[i]
      const modified = await chainVhd(handler, dir + '/' + backups[i - 1], handler, childPath)
      if (modified) {
        await handler.refreshChecksum(childPath)
      }
    }
  }

  async _mergeDeltaVdiBackups ({handler, dir, depth}) {
    const backups = await this._listVdiBackups(handler, dir)
    let i = backups.length - depth

    // No merge.
    if (i <= 0) {
      return
    }

    const timestamp = getVdiTimestamp(backups[i])
    const newFullBackup = `${dir}/${timestamp}_full.vhd`

    await checkFileIntegrity(handler, `${dir}/${backups[i]}`)

    let j = i
    for (; j > 0 && isDeltaVdiBackup(backups[j]); j--);
    const fullBackupId = j

    // Remove old backups before the most recent full.
    if (j > 0) {
      for (j--; j >= 0; j--) {
        await handler.unlink(`${dir}/${backups[j]}`, { checksum: true })
      }
    }

    const parent = `${dir}/${backups[fullBackupId]}`

    for (j = fullBackupId + 1; j <= i; j++) {
      const backup = `${dir}/${backups[j]}`

      try {
        await checkFileIntegrity(handler, backup)
        await vhdMerge(handler, parent, handler, backup)
      } catch (e) {
        console.error('Unable to use vhd-util.', e)
        throw e
      }

      await handler.unlink(backup, { checksum: true })
    }

    // Rename the first old full backup to the new full backup.
    await handler.rename(parent, newFullBackup)
  }

  async _listDeltaVdiDependencies (handler, filePath) {
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

    return backups.slice(j, i + 1)
  }

  // -----------------------------------------------------------------

  async _listDeltaVmBackups (handler, dir) {
    const files = await handler.list(dir)
    return sortBy(filter(files, isDeltaBackup))
  }

  async _saveDeltaVdiBackup (xapi, { vdiParent, isFull, handler, stream, dir, depth }) {
    const backupDirectory = `vdi_${vdiParent.uuid}`
    dir = `${dir}/${backupDirectory}`

    const date = safeDateFormat(new Date())

    // For old versions: remove old bases if exists.
    const bases = sortBy(
      filter(vdiParent.$snapshots, { name_label: 'XO_DELTA_BASE_VDI_SNAPSHOT' }),
      base => base.snapshot_time
    )
    forEach(bases, base => { xapi.deleteVdi(base.$id)::pCatch(noop) })

    // Export full or delta backup.
    const vdiFilename = `${date}_${isFull ? 'full' : 'delta'}.vhd`
    const backupFullPath = `${dir}/${vdiFilename}`

    try {
      const targetStream = await handler.createOutputStream(backupFullPath, {
        // FIXME: Checksum is not computed for full vdi backups.
        // The problem is in the merge case, a delta merged in a full vdi
        // backup forces us to browse the resulting file =>
        // Significant transfer time on the network !
        checksum: !isFull
      })

      stream.on('error', error => targetStream.emit('error', error))

      await Promise.all([
        eventToPromise(stream.pipe(targetStream), 'finish'),
        stream.task
      ])
    } catch (error) {
      // Remove new backup. (corrupt).
      await handler.unlink(backupFullPath, { checksum: true })::pCatch(noop)

      throw error
    }

    // Returns relative path.
    return `${backupDirectory}/${vdiFilename}`
  }

  async _removeOldDeltaVmBackups (xapi, { handler, dir, depth }) {
    const backups = await this._listDeltaVmBackups(handler, dir)
    const nOldBackups = backups.length - depth

    if (nOldBackups > 0) {
      await Promise.all(
        mapToArray(backups.slice(0, nOldBackups), async backup => {
          // Remove json file.
          await handler.unlink(`${dir}/${backup}`)

          // Remove xva file.
          // Version 0.0.0 (Legacy) Delta Backup.
          handler.unlink(`${dir}/${getDeltaBackupNameWithoutExt(backup)}.xva`)::pCatch(noop)
        })
      )
    }
  }

  @deferrable.onFailure
  async rollingDeltaVmBackup ($onFailure, {vm, remoteId, tag, depth}) {
    const remote = await this._xo.getRemote(remoteId)

    if (!remote) {
      throw new Error(`No such Remote ${remoteId}`)
    }
    if (!remote.enabled) {
      throw new Error(`Remote ${remoteId} is disabled`)
    }

    const handler = await this._xo.getRemoteHandler(remote)
    const xapi = this._xo.getXapi(vm)

    vm = xapi.getObject(vm._xapiId)

    // Get most recent base.
    const bases = sortBy(
      filter(vm.$snapshots, { name_label: `XO_DELTA_BASE_VM_SNAPSHOT_${tag}` }),
      base => base.snapshot_time
    )
    const baseVm = bases.pop()
    forEach(bases, base => { xapi.deleteVm(base.$id, true)::pCatch(noop) })

    // Check backup dirs.
    const dir = `vm_delta_${tag}_${vm.uuid}`
    const fullVdisRequired = []

    await Promise.all(
      mapToArray(vm.$VBDs, async vbd => {
        if (!vbd.VDI || vbd.type !== 'Disk') {
          return
        }

        const vdi = vbd.$VDI
        const backups = await this._listVdiBackups(handler, `${dir}/vdi_${vdi.uuid}`)

        // Force full if missing full.
        if (!find(backups, isFullVdiBackup)) {
          fullVdisRequired.push(vdi.$id)
        }
      })
    )

    // Export...
    const delta = await xapi.exportDeltaVm(vm.$id, baseVm && baseVm.$id, {
      snapshotNameLabel: `XO_DELTA_BASE_VM_SNAPSHOT_${tag}`,
      fullVdisRequired,
      disableBaseTags: true
    })

    $onFailure(async () => {
      await Promise.all(mapToArray(
        delta.streams,
        stream => stream.cancel()
      ))

      await xapi.deleteVm(delta.vm.ref, true)
    })

    // Save vdis.
    const vdiBackups = await pSettle(
      mapToArray(delta.vdis, async (vdi, key) => {
        const vdiParent = xapi.getObject(vdi.snapshot_of)

        return this._saveDeltaVdiBackup(xapi, {
          vdiParent,
          isFull: !baseVm || find(fullVdisRequired, id => vdiParent.$id === id),
          handler,
          stream: delta.streams[`${key}.vhd`],
          dir,
          depth
        })
          .then(path => {
            delta.vdis[key] = {
              ...delta.vdis[key],
              xoPath: path
            }

            return path
          })
      })
    )

    const fulFilledVdiBackups = []
    let success = true

    // One or many vdi backups have failed.
    for (const vdiBackup of vdiBackups) {
      if (vdiBackup.isFulfilled()) {
        fulFilledVdiBackups.push(vdiBackup)
      } else {
        console.error(`Rejected backup: ${vdiBackup.reason()}`)
        success = false
      }
    }

    $onFailure(async () => {
      await Promise.all(
        mapToArray(fulFilledVdiBackups, vdiBackup => {
          return handler.unlink(`${dir}/${vdiBackup.value()}`, { checksum: true })::pCatch(noop)
        })
      )
    })

    if (!success) {
      throw new Error('Rolling delta vm backup failed.')
    }

    const date = safeDateFormat(new Date())
    const backupFormat = `${date}_${vm.name_label}`
    const infoPath = `${dir}/${backupFormat}${DELTA_BACKUP_EXT}`

    $onFailure(() => handler.unlink(infoPath)::pCatch(noop))

    // Write Metadata.
    await handler.outputFile(infoPath, JSON.stringify(delta, null, 2))

    // Here we have a completed backup. We can merge old vdis.
    await Promise.all(
      mapToArray(vdiBackups, vdiBackup => {
        const backupName = vdiBackup.value()
        const backupDirectory = backupName.slice(0, backupName.lastIndexOf('/'))
        const backupDir = `${dir}/${backupDirectory}`
        return this._mergeDeltaVdiBackups({ handler, dir: backupDir, depth })
          .then(() => { this._chainDeltaVdiBackups({ handler, dir: backupDir }) })
      })
    )

    // Delete old backups.
    await this._removeOldDeltaVmBackups(xapi, { vm, handler, dir, depth })

    if (baseVm) {
      xapi.deleteVm(baseVm.$id, true)::pCatch(noop)
    }

    // Returns relative path.
    return `${dir}/${backupFormat}`
  }

  async importDeltaVmBackup ({sr, remoteId, filePath}) {
    filePath = `${filePath}${DELTA_BACKUP_EXT}`
    const { datetime } = parseVmBackupPath(filePath)

    const handler = await this._xo.getRemoteHandler(remoteId)
    const xapi = this._xo.getXapi(sr)

    const delta = JSON.parse(await handler.readFile(filePath))
    let vm
    const { version } = delta

    if (!version) {
      // Legacy import. (Version 0.0.0)
      vm = await this._legacyImportDeltaVmBackup(xapi, {
        remoteId, handler, filePath, info: delta, sr
      })
    } else if (versionSatisfies(delta.version, '^1')) {
      const basePath = dirname(filePath)
      const streams = delta.streams = {}

      await Promise.all(
        mapToArray(
          delta.vdis,
          async (vdi, id) => {
            const vdisFolder = `${basePath}/${dirname(vdi.xoPath)}`
            const backups = await this._listDeltaVdiDependencies(handler, `${basePath}/${vdi.xoPath}`)

            streams[`${id}.vhd`] = await Promise.all(mapToArray(backups, async backup =>
              handler.createReadStream(`${vdisFolder}/${backup}`, { checksum: true, ignoreMissingChecksum: true })
            ))
          }
        )
      )

      delta.vm.name_label += ` (${shortDate(datetime)})`
      delta.vm.tags.push('restored from backup')

      vm = await xapi.importDeltaVm(delta, {
        disableStartAfterImport: false,
        srId: sr._xapiId
      })
    } else {
      throw new Error(`Unsupported delta backup version: ${version}`)
    }

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
    const targetStream = await handler.createOutputStream(file)
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

    const vms = {}
    forEach(sr.$VDIs, vdi => {
      const vbds = vdi.$VBDs
      const vm = vbds && vbds[0] && vbds[0].$VM
      if (vm && reg.test(vm.name_label)) {
        vms[vm.$id] = vm
      }
    })
    const olderCopies = sortBy(vms, 'name_label')

    const copyName = `${vm.name_label}_${tag}_${safeDateFormat(new Date())}`
    const drCopy = await sourceXapi.remoteCopyVm(vm.$id, targetXapi, sr.$id, {
      nameLabel: copyName
    })
    await targetXapi.addTag(drCopy.$id, 'Disaster Recovery')

    const n = 1 - depth
    await Promise.all(mapToArray(n ? olderCopies.slice(0, n) : olderCopies, vm =>
      // Do not consider a failure to delete an old copy as a fatal error.
      targetXapi.deleteVm(vm.$id, true)::pCatch(noop)
    ))
  }

  // -----------------------------------------------------------------

  _mountVhd (remoteId, vhdPath) {
    return Promise.all([
      this._xo.getRemoteHandler(remoteId),
      tmpDir()
    ]).then(([ handler, mountDir ]) => {
      if (!handler._getRealPath) {
        throw new Error(`this remote is not supported`)
      }

      const remotePath = handler._getRealPath()

      return execa('vhdimount', [ resolveSubpath(remotePath, vhdPath), mountDir ]).then(() =>
        pFromCallback(cb => readdir(mountDir, cb)).then(entries => {
          let max = 0
          forEach(entries, entry => {
            const matches = /^vhdi(\d+)/.exec(entry)
            if (matches) {
              const value = +matches[1]
              if (value > max) {
                max = value
              }
            }
          })

          if (!max) {
            throw new Error('no disks found')
          }

          return {
            path: `${mountDir}/vhdi${max}`,
            unmount: once(() => execa('fusermount', [ '-uz', mountDir ]))
          }
        })
      )
    })
  }

  _mountPartition (remoteId, vhdPath, partitionId) {
    return this._mountVhd(remoteId, vhdPath).then(device =>
      mountPartition(device, partitionId).then(partition => ({
        ...partition,
        unmount: () => partition.unmount().then(device.unmount)
      }))
    )
  }

  @deferrable
  async scanDiskBackup ($defer, remoteId, vhdPath) {
    const device = await this._mountVhd(remoteId, vhdPath)
    $defer(device.unmount)

    return {
      partitions: await listPartitions(device)
    }
  }

  @deferrable
  async scanFilesInDiskBackup ($defer, remoteId, vhdPath, partitionId, path) {
    const partition = await this._mountPartition(remoteId, vhdPath, partitionId)
    $defer(partition.unmount)

    path = resolveSubpath(partition.path, path)

    const entries = await pFromCallback(cb => readdir(path, cb))

    const entriesMap = {}
    await Promise.all(mapToArray(entries, async name => {
      const stats = await pFromCallback(cb => stat(`${path}/${name}`, cb))::pCatch(noop)
      if (stats) {
        entriesMap[stats.isDirectory() ? `${name}/` : name] = {}
      }
    }))
    return entriesMap
  }

  async fetchFilesInDiskBackup (remoteId, vhdPath, partitionId, paths) {
    const partition = await this._mountPartition(remoteId, vhdPath, partitionId)

    let i = 0
    const onEnd = () => {
      if (!--i) {
        partition.unmount()
      }
    }
    return mapToArray(paths, path => {
      ++i
      return createReadStream(resolveSubpath(partition.path, path)).once('end', onEnd)
    })
  }
}
