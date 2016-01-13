import endsWith from 'lodash.endswith'
import escapeStringRegexp from 'escape-string-regexp'
import eventToPromise from 'event-to-promise'
import filter from 'lodash.filter'
import find from 'lodash.find'
import findIndex from 'lodash.findindex'
import sortBy from 'lodash.sortby'
import startsWith from 'lodash.startswith'
import {
  createReadStream,
  createWriteStream,
  ensureDir,
  readdir,
  readFile,
  stat,
  unlink,
  writeFile
} from 'fs-promise'
import {
  basename,
  dirname
} from 'path'

import xapiObjectToXo from '../xapi-object-to-xo'
import {
  forEach,
  mapToArray,
  noop,
  safeDateFormat
} from '../utils'
import {
  VDI_FORMAT_VHD
} from '../xapi'

// ===================================================================

const isVdiBackup = name => /^\d+T\d+Z_(?:full|delta)\.vhd$/.test(name)
const isDeltaVdiBackup = name => /^\d+T\d+Z_delta\.vhd$/.test(name)

// ===================================================================

export default class {
  constructor (xo) {
    this._xo = xo
  }

  async _listRemoteBackups (remote) {
    const path = remote.path

    // List backups. (Except delta backups)
    const xvaFilter = file => endsWith(file, '.xva')

    const files = await readdir(path)
    const backups = filter(files, xvaFilter)

    // List delta backups.
    const deltaDirs = filter(files, file => startsWith(file, 'vm_delta_'))

    for (const deltaDir of deltaDirs) {
      const files = await readdir(`${path}/${deltaDir}`)
      const deltaBackups = filter(files, xvaFilter)

      backups.push(...mapToArray(
        deltaBackups,
        deltaBackup => `${deltaDir}/${deltaBackup}`
      ))
    }

    return backups
  }

  async _openAndwaitReadableFile (path, errorMessage) {
    const stream = createReadStream(path)

    try {
      await eventToPromise(stream, 'readable')
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(errorMessage)
      }
      throw error
    }

    const stats = await stat(path)

    return [ stream, stats.size ]
  }

  async importVmBackup (remoteId, file, sr) {
    const remote = await this._xo.getRemote(remoteId)
    const path = `${remote.path}/${file}`
    const [ stream, length ] = await this._openAndwaitReadableFile(
      path, 'VM to import not found in this remote')

    const xapi = this._xo.getXAPI(sr)

    await xapi.importVm(stream, length, { srId: sr._xapiId })
  }

  // -----------------------------------------------------------------

  // TODO: The other backup methods must use this function !
  // Prerequisite: The backups array must be ordered. (old to new backups)
  async _removeOldBackups (backups, path, n) {
    if (n <= 0) {
      return
    }

    await Promise.all(
      mapToArray(backups.slice(0, n), backup => unlink(`${path}/${backup}`))
    )
  }

  // -----------------------------------------------------------------

  async _listVdiBackups (path) {
    const files = await readdir(path)
    const backups = sortBy(filter(files, fileName => isVdiBackup(fileName)))
    let i

    // Avoid unstable state: No full vdi found to the beginning of array. (base)
    for (i = 0; i < backups.length && isDeltaVdiBackup(backups[i]); i++);
    await this._removeOldBackups(backups, path, i)

    return backups.slice(i)
  }

  _countDeltaVdiBackups (backups) {
    let nDelta = 0
    for (let i = backups.length - 1; i >= 0 && isDeltaVdiBackup(backups[i]); nDelta++, i--);
    return nDelta
  }

  async _rollingDeltaVdiBackup ({vdi, path, depth}) {
    const xapi = this._xo.getXAPI(vdi)
    const backupDirectory = `vdi_${vdi.uuid}`

    vdi = xapi.getObject(vdi._xapiId)
    path = `${path}/${backupDirectory}`
    await ensureDir(path)

    const backups = await this._listVdiBackups(path)

    // Count delta backups.
    const nDelta = this._countDeltaVdiBackups(backups)

    // Make snapshot.
    const date = safeDateFormat(new Date())
    const base = find(vdi.$snapshots, { name_label: 'XO_DELTA_BASE_VDI_SNAPSHOT' })
    const currentSnapshot = await xapi.snapshotVdi(vdi.$id, 'XO_DELTA_BASE_VDI_SNAPSHOT')

    // It is strange to have no base but a full backup !
    // A full is necessary if it not exists backups or
    // the number of delta backups is sufficient.
    const isFull = (nDelta + 1 >= depth || !backups.length || !base)

    // Export full or delta backup.
    const vdiFilename = `${date}_${isFull ? 'full' : 'delta'}.vhd`
    const backupFullPath = `${path}/${vdiFilename}`

    try {
      const sourceStream = await xapi.exportVdi(currentSnapshot.$id, {
        baseId: isFull ? undefined : base.$id,
        format: VDI_FORMAT_VHD
      })

      const targetStream = createWriteStream(backupFullPath, { flags: 'wx' })
      sourceStream.on('error', error => targetStream.emit('error', error))
      await eventToPromise(sourceStream.pipe(targetStream), 'finish')
    } catch (e) {
      // Remove backup. (corrupt)
      await xapi.deleteVdi(currentSnapshot.$id)
      unlink(backupFullPath).catch(noop)
      throw e
    }

    if (base) {
      await xapi.deleteVdi(base.$id)
    }

    // Returns relative path. (subdir and vdi filename)
    return [ backupDirectory, vdiFilename ]
  }

  async _removeOldDeltaVdiBackups ({path, depth}) {
    const backups = await this._listVdiBackups(path)
    let i

    for (i = backups.length - depth; i >= 0 && isDeltaVdiBackup(backups[i]); i--);
    await this._removeOldBackups(backups, path, i)
  }

  async _importVdiBackupContent (xapi, file, vdiId) {
    const [ stream, length ] = await this._openAndwaitReadableFile(
      file, 'VDI to import not found in this remote'
    )

    await xapi.importVdiContent(vdiId, stream, {
      length,
      format: VDI_FORMAT_VHD
    })
  }

  async importDeltaVdiBackup ({vdi, remoteId, filePath}) {
    const remote = await this._xo.getRemote(remoteId)
    const path = dirname(`${remote.path}/${filePath}`)

    const filename = basename(filePath)
    const backups = await this._listVdiBackups(path)

    // Search file. (delta or full backup)
    const i = findIndex(backups, backup => backup === filename)

    if (i === -1) {
      throw new Error('VDI to import not found in this remote')
    }

    // Search full backup.
    let j

    for (j = i; j >= 0 && isDeltaVdiBackup(backups[j]); j--);

    if (j === -1) {
      throw new Error(`unable to found full vdi backup of: ${filePath}`)
    }

    // Restore...
    const xapi = this._xo.getXAPI(vdi)

    for (; j <= i; j++) {
      await this._importVdiBackupContent(xapi, `${path}/${backups[j]}`, vdi._xapiId)
    }
  }

  // -----------------------------------------------------------------

  async _listDeltaVmBackups (path) {
    const files = await readdir(path)
    return await sortBy(filter(files, (fileName) => /^\d+T\d+Z_.*\.(?:xva|json)$/.test(fileName)))
  }

  async rollingDeltaVmBackup ({vm, remoteId, tag, depth}) {
    const remote = await this._xo.getRemote(remoteId)
    const directory = `vm_delta_${tag}_${vm.uuid}`
    const path = `${remote.path}/${directory}`

    await ensureDir(path)

    const info = {
      vbds: [],
      vdis: {}
    }

    const promises = []
    const xapi = this._xo.getXAPI(vm)

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
          this._rollingDeltaVdiBackup({vdi: vdiXo, path, depth}).then(
            ([ backupPath, backupFile ]) => {
              info.vdis[vdiUUID].xoPath = `${backupPath}/${backupFile}`
              return backupPath // Used by _removeOldDeltaVdiBackups
            }
          )
        )
      }
    }

    const vdiDirPaths = await Promise.all(promises)

    const backups = await this._listDeltaVmBackups(path)
    const date = safeDateFormat(new Date())
    const backupFormat = `${date}_${vm.name_label}`

    const xvaPath = `${path}/${backupFormat}.xva`
    const infoPath = `${path}/${backupFormat}.json`

    try {
      await Promise.all([
        this.backupVm({vm, pathToFile: xvaPath, onlyMetadata: true}),
        writeFile(infoPath, JSON.stringify(info), {flag: 'wx'})
      ])
    } catch (e) {
      await Promise.all([unlink(xvaPath).catch(noop), unlink(infoPath).catch(noop)])
      throw e
    }

    // Here we have a completed backup. We can remove old vdis.
    await Promise.all(
      mapToArray(vdiDirPaths, vdiDirPath => this._removeOldDeltaVdiBackups({path: `${path}/${vdiDirPath}`, depth}))
    )

    // Remove x2 files : json AND xva files.
    await this._removeOldBackups(backups, path, backups.length - (depth - 1) * 2)

    // Returns relative path.
    return `${directory}/${backupFormat}`
  }

  async _importVmMetadata (xapi, file) {
    const [ stream, length ] = await this._openAndwaitReadableFile(
      file, 'VM metadata to import not found in this remote'
    )
    return await xapi.importVm(stream, length, { onlyMetadata: true })
  }

  async _importDeltaVdiBackupFromVm (xapi, vmId, remoteId, directory, vdiInfo) {
    const vdi = await xapi.createVdi(vdiInfo.virtual_size, vdiInfo)
    const vdiId = vdi.$id

    await this.importDeltaVdiBackup({
      vdi: this._xo.getObject(vdiId),
      remoteId,
      filePath: `${directory}/${vdiInfo.xoPath}`
    })

    return vdiId
  }

  async importDeltaVmBackup ({sr, remoteId, filePath}) {
    const remote = await this._xo.getRemote(remoteId)
    const fullBackupPath = `${remote.path}/${filePath}`
    const xapi = this._xo.getXAPI(sr)

    // Import vm metadata.
    const vm = await this._importVmMetadata(xapi, `${fullBackupPath}.xva`)
    const vmName = vm.name_label

    // Disable start and change the VM name label during import.
    await Promise.all([
      xapi.addForbiddenOperationToVm(vm.$id, 'start', 'Delta backup import...'),
      xapi._setObjectProperties(vm, { name_label: `[Importing...] ${vmName}` })
    ])

    // Destroy vbds if necessary. Why ?
    // Because XenServer creates Vbds linked to the vdis of the backup vm if it exists.
    await xapi.destroyVbdsFromVm(vm.uuid)

    const info = JSON.parse(await readFile(`${fullBackupPath}.json`))

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

  async backupVm ({vm, pathToFile, compress, onlyMetadata}) {
    const targetStream = createWriteStream(pathToFile, { flags: 'wx' })
    const promise = eventToPromise(targetStream, 'finish')

    const sourceStream = await this._xo.getXAPI(vm).exportVm(vm._xapiId, {
      compress,
      onlyMetadata: onlyMetadata || false
    })
    sourceStream.pipe(targetStream)

    await promise
  }

  async rollingBackupVm ({vm, path, tag, depth, compress, onlyMetadata}) {
    await ensureDir(path)
    const files = await readdir(path)

    const reg = new RegExp('^[^_]+_' + escapeStringRegexp(`${tag}_${vm.name_label}.xva`))
    const backups = sortBy(filter(files, (fileName) => reg.test(fileName)))

    const date = safeDateFormat(new Date())
    const backupFullPath = `${path}/${date}_${tag}_${vm.name_label}.xva`

    await this.backupVm({vm, pathToFile: backupFullPath, compress, onlyMetadata})

    const promises = []
    for (let surplus = backups.length - (depth - 1); surplus > 0; surplus--) {
      const oldBackup = backups.shift()
      promises.push(unlink(`${path}/${oldBackup}`))
    }
    await Promise.all(promises)

    return backupFullPath
  }

  async rollingSnapshotVm (vm, tag, depth) {
    const xapi = this._xo.getXAPI(vm)
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

    const targetXapi = this._xo.getXAPI(sr)
    sr = targetXapi.getObject(sr._xapiId)
    const sourceXapi = this._xo.getXAPI(vm)
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
