import deferrable from 'golike-defer'
import escapeStringRegexp from 'escape-string-regexp'
import eventToPromise from 'event-to-promise'
import execa from 'execa'
import splitLines from 'split-lines'
import { CancelToken, ignoreErrors } from 'promise-toolbox'
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
  includes,
  once,
  range,
  sortBy,
  startsWith,
  trim
} from 'lodash'

import createSizeStream from '../size-stream'
import vhdMerge, { chainVhd } from '../vhd-merge'
import xapiObjectToXo from '../xapi-object-to-xo'
import { lvs, pvs } from '../lvm'
import {
  asyncMap,
  forEach,
  getFirstPropertyName,
  mapFilter,
  mapToArray,
  pFinally,
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

const toTimestamp = date => date && Math.round(date.getTime() / 1000)

const parseVmBackupPath = name => {
  const base = basename(name)
  let baseMatches

  baseMatches = /^([^_]+)_([^_]+)_(.+)\.xva$/.exec(base)
  if (baseMatches) {
    return {
      datetime: toTimestamp(safeDateParse(baseMatches[1])),
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
      datetime: toTimestamp(safeDateParse(baseMatches[1])),
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
  ]).then(stdout => mapFilter(splitLines(stdout), line => {
    const partition = parseLine(line)
    const { type } = partition
    if (type != null && !IGNORED[+type]) {
      return partition
    }
  }))
})()

// handle LVM logical volumes automatically
const listPartitions2 = device => listPartitions(device).then(partitions => {
  const partitions2 = []
  const promises = []
  forEach(partitions, partition => {
    if (+partition.type === 0x8e) {
      promises.push(mountLvmPv(device, partition).then(device => {
        const promise = listLvmLvs(device).then(lvs => {
          forEach(lvs, lv => {
            partitions2.push({
              name: lv.lv_name,
              size: +lv.lv_size,
              id: `${partition.id}/${lv.vg_name}/${lv.lv_name}`
            })
          })
        })
        promise::pFinally(device.unmount)
        return promise
      }))
    } else {
      partitions2.push(partition)
    }
  })
  return Promise.all(promises).then(() => partitions2)
})

const mountPartition = (device, partitionId) => Promise.all([
  partitionId != null && listPartitions(device),
  tmpDir()
]).then(([ partitions, path ]) => {
  const options = [
    'loop',
    'ro'
  ]

  if (partitions) {
    const partition = find(partitions, { id: partitionId })

    const { start } = partition
    if (start != null) {
      options.push(`offset=${start * 512}`)
    }
  }

  const mount = options => execa('mount', [
    `--options=${options.join(',')}`,
    `--source=${device.path}`,
    `--target=${path}`
  ])

  // `norecovery` option is used for ext3/ext4/xfs, if it fails it
  // might be another fs, try without
  return mount([ ...options, 'norecovery' ]).catch(() =>
    mount(options)
  ).then(() => ({
    path,
    unmount: once(() => execa('umount', [ '--lazy', path ]))
  }), error => {
    console.log(error)

    throw error
  })
})

// handle LVM logical volumes automatically
const mountPartition2 = (device, partitionId) => {
  if (
    partitionId == null ||
    !includes(partitionId, '/')
  ) {
    return mountPartition(device, partitionId)
  }

  const [ pvId, vgName, lvName ] = partitionId.split('/')

  return listPartitions(device).then(partitions =>
    find(partitions, { id: pvId })
  ).then(pvId => mountLvmPv(device, pvId)).then(device1 =>
    execa('vgchange', [ '-ay', vgName ]).then(() =>
      lvs([ 'lv_name', 'lv_path' ], vgName).then(lvs =>
        find(lvs, { lv_name: lvName }).lv_path
      )
    ).then(path =>
      mountPartition({ path }).then(device2 => ({
        ...device2,
        unmount: () => device2.unmount().then(device1.unmount)
      }))
    ).catch(error => device1.unmount().then(() => {
      throw error
    }))
  )
}

// -------------------------------------------------------------------

const listLvmLvs = device => pvs([
  'lv_name',
  'lv_path',
  'lv_size',
  'vg_name'
], device.path).then(pvs => filter(pvs, 'lv_name'))

const mountLvmPv = (device, partition) => {
  const args = []
  if (partition) {
    args.push('-o', partition.start * 512)
  }
  args.push(
    '--show',
    '-f',
    device.path
  )

  return execa.stdout('losetup', args).then(stdout => {
    const path = trim(stdout)
    return {
      path,
      unmount: once(() => Promise.all([
        execa('losetup', [ '-d', path ]),
        pvs('vg_name', path).then(vgNames => execa('vgchange', [
          '-an',
          ...vgNames
        ]))
      ]))
    }
  })
}

// ===================================================================

export default class {
  constructor (xo) {
    this._xo = xo

    // clean any LVM volumes that might have not been properly
    // unmounted
    xo.on('start', () => Promise.all([
      execa('losetup', [ '-D' ]),
      execa('vgchange', [ '-an' ])
    ]).then(() =>
      execa('pvscan', [ '--cache' ])
    ))
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

    await asyncMap(handler.list(), entry => {
      if (endsWith(entry, '.xva')) {
        backups.push(parseVmBackupPath(entry))
      } else if (startsWith(entry, 'vm_delta_')) {
        return handler.list(entry).then(children =>
          asyncMap(children, child => {
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
              })
            }
          })
        )
      }
    })::ignoreErrors()

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
        name_label: `${vm.name_label} (${shortDate(datetime * 1e3)})`
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
    let size = 0
    const dstVm = await (async () => {
      const { cancel, token } = CancelToken.source()
      const delta = await srcXapi.exportDeltaVm(token, srcVm.$id, localBaseUuid, {
        snapshotNameLabel: `XO_DELTA_EXPORT: ${targetSr.name_label} (${targetSr.uuid})`
      })
      $onFailure(() => srcXapi.deleteVm(delta.vm.uuid))
      $onFailure(cancel)

      delta.vm.name_label += ` (${shortDate(Date.now())})`

      forEach(delta.vdis, (vdi, key) => {
        const id = `${key}.vhd`
        const sizeStream = createSizeStream().once('finish', () => {
          size += sizeStream.size
        })
        delta.streams[id] = delta.streams[id].pipe(sizeStream)
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
        promise.then(() => srcXapi.deleteVm(localBaseUuid))::ignoreErrors()
      }

      // (Asynchronously) Identify snapshot as future base.
      promise.then(() => {
        return srcXapi._updateObjectMapProperty(srcVm, 'other_config', {
          [TAG_LAST_BASE_DELTA]: delta.vm.uuid
        })
      })::ignoreErrors()

      return promise
    })()

    return {
    // 5. Return the identifier of the new XO VM object.
      id: xapiObjectToXo(dstVm).id,
      size
    }
  }

  // -----------------------------------------------------------------

  // TODO: The other backup methods must use this function !
  // Prerequisite: The backups array must be ordered. (old to new backups)
  async _removeOldBackups (backups, handler, dir, n) {
    if (n <= 0) {
      return
    }

    const getPath = (file, dir) => dir ? `${dir}/${file}` : file

    await asyncMap(backups.slice(0, n), backup =>
      handler.unlink(getPath(backup, dir))
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

  async _legacyImportDeltaVmBackup (xapi, { remoteId, handler, filePath, info, sr, mapVdisSrs = {} }) {
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
          vdiInfo.sr = mapVdisSrs[vdiInfo.uuid] || sr._xapiId

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

  async _mergeDeltaVdiBackups ({handler, dir, retention}) {
    const backups = await this._listVdiBackups(handler, dir)
    let i = backups.length - retention

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
    await asyncMap(range(0, j), i =>
      handler.unlink(`${dir}/${backups[i]}`)
    )

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

      await handler.unlink(backup)
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

  async _saveDeltaVdiBackup (xapi, { vdiParent, isFull, handler, stream, dir, retention }) {
    const backupDirectory = `vdi_${vdiParent.uuid}`
    dir = `${dir}/${backupDirectory}`

    const date = safeDateFormat(new Date())

    // For old versions: remove old bases if exists.
    const bases = sortBy(
      filter(vdiParent.$snapshots, { name_label: 'XO_DELTA_BASE_VDI_SNAPSHOT' }),
      base => base.snapshot_time
    )
    forEach(bases, base => { xapi.deleteVdi(base.$id)::ignoreErrors() })

    // Export full or delta backup.
    const vdiFilename = `${date}_${isFull ? 'full' : 'delta'}.vhd`
    const backupFullPath = `${dir}/${vdiFilename}`

    const sizeStream = createSizeStream()

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
        eventToPromise(
          stream
            .pipe(sizeStream)
            .pipe(targetStream),
          'finish'
        ),
        stream.task
      ])
    } catch (error) {
      // Remove new backup. (corrupt).
      await handler.unlink(backupFullPath)::ignoreErrors()

      throw error
    }

    return {
      // Returns relative path.
      path: `${backupDirectory}/${vdiFilename}`,
      size: sizeStream.size
    }
  }

  async _removeOldDeltaVmBackups (xapi, { handler, dir, retention }) {
    const backups = await this._listDeltaVmBackups(handler, dir)
    const nOldBackups = backups.length - retention

    if (nOldBackups > 0) {
      await asyncMap(backups.slice(0, nOldBackups), backup => Promise.all([
        // Remove json file.
        handler.unlink(`${dir}/${backup}`),

        // Remove xva file.
        // Version 0.0.0 (Legacy) Delta Backup.
        handler.unlink(`${dir}/${getDeltaBackupNameWithoutExt(backup)}.xva`)::ignoreErrors()
      ]))
    }
  }

  @deferrable.onFailure
  async rollingDeltaVmBackup ($onFailure, {vm, remoteId, tag, retention}) {
    const handler = await this._xo.getRemoteHandler(remoteId)
    const xapi = this._xo.getXapi(vm)

    vm = xapi.getObject(vm._xapiId)

    // Get most recent base.
    const bases = sortBy(
      filter(vm.$snapshots, { name_label: `XO_DELTA_BASE_VM_SNAPSHOT_${tag}` }),
      base => base.snapshot_time
    )
    const baseVm = bases.pop()
    forEach(bases, base => { xapi.deleteVm(base.$id)::ignoreErrors() })

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
    const { cancel, token } = CancelToken.source()
    const delta = await xapi.exportDeltaVm(token, vm.$id, baseVm && baseVm.$id, {
      snapshotNameLabel: `XO_DELTA_BASE_VM_SNAPSHOT_${tag}`,
      fullVdisRequired,
      disableBaseTags: true
    })
    $onFailure(() => xapi.deleteVm(delta.vm.uuid))
    $onFailure(cancel)

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
          retention
        })
          .then(data => {
            delta.vdis[key] = {
              ...delta.vdis[key],
              xoPath: data.path
            }

            return data
          })
      })
    )

    const fulFilledVdiBackups = []
    let error

    // One or many vdi backups have failed.
    for (const vdiBackup of vdiBackups) {
      if (vdiBackup.isFulfilled()) {
        fulFilledVdiBackups.push(vdiBackup)
      } else {
        error = vdiBackup.reason()
        console.error('Rejected backup:', error)
      }
    }

    $onFailure(() => asyncMap(fulFilledVdiBackups, vdiBackup =>
      handler.unlink(`${dir}/${vdiBackup.value()}`)::ignoreErrors()
    ))

    if (error) {
      throw error
    }

    const date = safeDateFormat(new Date())
    const backupFormat = `${date}_${vm.name_label}`
    const infoPath = `${dir}/${backupFormat}${DELTA_BACKUP_EXT}`

    $onFailure(() => handler.unlink(infoPath))

    // Write Metadata.
    await handler.outputFile(infoPath, JSON.stringify(delta, null, 2))

    let dataSize = 0

    // Here we have a completed backup. We can merge old vdis.
    await Promise.all(
      mapToArray(vdiBackups, vdiBackup => {
        const backupName = vdiBackup.value().path
        const backupDirectory = backupName.slice(0, backupName.lastIndexOf('/'))
        const backupDir = `${dir}/${backupDirectory}`
        dataSize += vdiBackup.value().size

        return this._mergeDeltaVdiBackups({ handler, dir: backupDir, retention })
          .then(() => { this._chainDeltaVdiBackups({ handler, dir: backupDir }) })
      })
    )

    // Delete old backups.
    await this._removeOldDeltaVmBackups(xapi, { vm, handler, dir, retention })

    if (baseVm) {
      xapi.deleteVm(baseVm.$id)::ignoreErrors()
    }

    return {
      // Returns relative path.
      path: `${dir}/${backupFormat}`,
      size: dataSize
    }
  }

  async importDeltaVmBackup ({sr, remoteId, filePath, mapVdisSrs = {}}) {
    filePath = `${filePath}${DELTA_BACKUP_EXT}`
    const { datetime } = parseVmBackupPath(filePath)

    const handler = await this._xo.getRemoteHandler(remoteId)
    const xapi = this._xo.getXapi(sr || mapVdisSrs[getFirstPropertyName(mapVdisSrs)])

    const delta = JSON.parse(await handler.readFile(filePath))
    let vm
    const { version } = delta

    if (!version) {
      // Legacy import. (Version 0.0.0)
      vm = await this._legacyImportDeltaVmBackup(xapi, {
        remoteId, handler, filePath, info: delta, sr, mapVdisSrs
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

      delta.vm.name_label += ` (${shortDate(datetime * 1e3)})`
      delta.vm.tags.push('restored from backup')

      vm = await xapi.importDeltaVm(delta, {
        disableStartAfterImport: false,
        srId: sr !== undefined && sr._xapiId,
        mapVdisSrs
      })
    } else {
      throw new Error(`Unsupported delta backup version: ${version}`)
    }

    return xapiObjectToXo(vm).id
  }

  // -----------------------------------------------------------------

  async backupVm ({vm, remoteId, file, compress, onlyMetadata}) {
    const handler = await this._xo.getRemoteHandler(remoteId)
    return this._backupVm(vm, handler, file, {compress, onlyMetadata})
  }

  async _backupVm (vm, handler, file, {compress, onlyMetadata}) {
    const targetStream = await handler.createOutputStream(file)
    const promise = eventToPromise(targetStream, 'finish')

    const sourceStream = await this._xo.getXapi(vm).exportVm(vm._xapiId, {
      compress,
      onlyMetadata: onlyMetadata || false
    })

    const sizeStream = createSizeStream()

    sourceStream
      .pipe(sizeStream)
      .pipe(targetStream)

    await promise

    return {
      size: sizeStream.size
    }
  }

  async rollingBackupVm ({vm, remoteId, tag, retention, compress, onlyMetadata}) {
    const handler = await this._xo.getRemoteHandler(remoteId)

    const files = await handler.list()

    const reg = new RegExp('^[^_]+_' + escapeStringRegexp(`${tag}_${vm.name_label}.xva`))
    const backups = sortBy(filter(files, (fileName) => reg.test(fileName)))

    const date = safeDateFormat(new Date())
    const file = `${date}_${tag}_${vm.name_label}.xva`

    const data = await this._backupVm(vm, handler, file, {compress, onlyMetadata})
    await this._removeOldBackups(backups, handler, undefined, backups.length - (retention - 1))

    return data
  }

  async rollingSnapshotVm (vm, tag, retention) {
    const xapi = this._xo.getXapi(vm)
    vm = xapi.getObject(vm._xapiId)

    const reg = new RegExp('^rollingSnapshot_[^_]+_' + escapeStringRegexp(tag) + '_')
    const snapshots = sortBy(filter(vm.$snapshots, snapshot => reg.test(snapshot.name_label)), 'name_label')
    const date = safeDateFormat(new Date())

    await xapi.snapshotVm(vm.$id, `rollingSnapshot_${date}_${tag}_${vm.name_label}`)

    const promises = []
    for (let surplus = snapshots.length - (retention - 1); surplus > 0; surplus--) {
      const oldSnap = snapshots.shift()
      promises.push(xapi.deleteVm(oldSnap.uuid))
    }
    await Promise.all(promises)
  }

  _removeVms (xapi, vms) {
    return Promise.all(mapToArray(vms, vm =>
      // Do not consider a failure to delete an old copy as a fatal error.
      xapi.deleteVm(vm.$id)::ignoreErrors()
    ))
  }

  async rollingDrCopyVm ({vm, sr, tag, retention, deleteOldBackupsFirst}) {
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

    let vmsToRemove = sortBy(vms, 'name_label')

    if (retention > 1) {
      vmsToRemove = vmsToRemove.slice(0, 1 - retention)
    }

    if (deleteOldBackupsFirst) {
      await this._removeVms(targetXapi, vmsToRemove)
    }

    const copyName = `${vm.name_label}_${tag}_${safeDateFormat(new Date())}`
    const data = await sourceXapi.remoteCopyVm(vm.$id, targetXapi, sr.$id, {
      nameLabel: copyName
    })

    targetXapi._updateObjectMapProperty(data.vm, 'blocked_operations', {
      start: 'Start operation for this vm is blocked, clone it if you want to use it.'
    })

    await targetXapi.addTag(data.vm.$id, 'Disaster Recovery')

    if (!deleteOldBackupsFirst) {
      await this._removeVms(targetXapi, vmsToRemove)
    }

    return {
      size: data.size
    }
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
      vhdPath = resolveSubpath(remotePath, vhdPath)

      return Promise.resolve().then(() => {
        // TODO: remove when no longer necessary.
        //
        // Currently, the filenames of the VHD changes over time
        // (delta → full), but the JSON is not updated, therefore the
        // VHD path may need to be fixed.
        return endsWith(vhdPath, '_delta.vhd')
          ? pFromCallback(cb => stat(vhdPath, cb)).then(
            () => vhdPath,
            error => {
              if (error && error.code === 'ENOENT') {
                return `${vhdPath.slice(0, -10)}_full.vhd`
              }
            }
          )
          : vhdPath
      }).then(vhdPath => execa('vhdimount', [ vhdPath, mountDir ])).then(() =>
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
      mountPartition2(device, partitionId).then(partition => ({
        ...partition,
        unmount: () => partition.unmount().then(device.unmount)
      })).catch(error => device.unmount().then(() => {
        throw error
      }))
    )
  }

  @deferrable
  async scanDiskBackup ($defer, remoteId, vhdPath) {
    const device = await this._mountVhd(remoteId, vhdPath)
    $defer(device.unmount)

    return {
      partitions: await listPartitions2(device)
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
      const stats = await pFromCallback(cb => stat(`${path}/${name}`, cb))::ignoreErrors()
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
