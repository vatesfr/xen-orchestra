const { asyncMap, asyncMapSettled } = require('@xen-orchestra/async-map')
const Disposable = require('promise-toolbox/Disposable.js')
const fromCallback = require('promise-toolbox/fromCallback.js')
const fromEvent = require('promise-toolbox/fromEvent.js')
const pDefer = require('promise-toolbox/defer.js')
const groupBy = require('lodash/groupBy.js')
const { dirname, join, normalize, resolve } = require('path')
const { createLogger } = require('@xen-orchestra/log')
const { Constants, createVhdDirectoryFromStream, openVhd, VhdAbstract, VhdDirectory, VhdSynthetic } = require('vhd-lib')
const { deduped } = require('@vates/disposable/deduped.js')
const { execFile } = require('child_process')
const { readdir, stat } = require('fs-extra')
const { v4: uuidv4 } = require('uuid')
const { ZipFile } = require('yazl')

const { BACKUP_DIR } = require('./_getVmBackupDir.js')
const { cleanVm } = require('./_cleanVm.js')
const { getTmpDir } = require('./_getTmpDir.js')
const { isMetadataFile } = require('./_backupType.js')
const { isValidXva } = require('./_isValidXva.js')
const { listPartitions, LVM_PARTITION_TYPE } = require('./_listPartitions.js')
const { lvs, pvs } = require('./_lvm.js')

const DIR_XO_CONFIG_BACKUPS = 'xo-config-backups'
exports.DIR_XO_CONFIG_BACKUPS = DIR_XO_CONFIG_BACKUPS

const DIR_XO_POOL_METADATA_BACKUPS = 'xo-pool-metadata-backups'
exports.DIR_XO_POOL_METADATA_BACKUPS = DIR_XO_POOL_METADATA_BACKUPS

const { warn } = createLogger('xo:backups:RemoteAdapter')

const compareTimestamp = (a, b) => a.timestamp - b.timestamp

const noop = Function.prototype

const resolveRelativeFromFile = (file, path) => resolve('/', dirname(file), path).slice(1)

const resolveSubpath = (root, path) => resolve(root, `.${resolve('/', path)}`)

const RE_VHDI = /^vhdi(\d+)$/

async function addDirectory(files, realPath, metadataPath) {
  try {
    const subFiles = await readdir(realPath)
    await asyncMap(subFiles, file => addDirectory(files, realPath + '/' + file, metadataPath + '/' + file))
  } catch (error) {
    if (error == null || error.code !== 'ENOTDIR') {
      throw error
    }
    files.push({
      realPath,
      metadataPath,
    })
  }
}

const createSafeReaddir = (handler, methodName) => (path, options) =>
  handler.list(path, options).catch(error => {
    if (error?.code !== 'ENOENT') {
      warn(`${methodName} ${path}`, { error })
    }
    return []
  })

const debounceResourceFactory = factory =>
  function () {
    return this._debounceResource(factory.apply(this, arguments))
  }

class RemoteAdapter {
  constructor(handler, { debounceResource = res => res, dirMode, vhdDirectoryCompression } = {}) {
    this._debounceResource = debounceResource
    this._dirMode = dirMode
    this._handler = handler
    this._vhdDirectoryCompression = vhdDirectoryCompression
  }

  get handler() {
    return this._handler
  }

  async _findPartition(devicePath, partitionId) {
    const partitions = await listPartitions(devicePath)
    const partition = partitions.find(_ => _.id === partitionId)
    if (partition === undefined) {
      throw new Error(`partition ${partitionId} not found`)
    }
    return partition
  }

  _getLvmLogicalVolumes = Disposable.factory(this._getLvmLogicalVolumes)
  _getLvmLogicalVolumes = deduped(this._getLvmLogicalVolumes, (devicePath, pvId, vgName) => [devicePath, pvId, vgName])
  _getLvmLogicalVolumes = debounceResourceFactory(this._getLvmLogicalVolumes)
  async *_getLvmLogicalVolumes(devicePath, pvId, vgName) {
    yield this._getLvmPhysicalVolume(devicePath, pvId && (await this._findPartition(devicePath, pvId)))

    await fromCallback(execFile, 'vgchange', ['-ay', vgName])
    try {
      yield lvs(['lv_name', 'lv_path'], vgName)
    } finally {
      await fromCallback(execFile, 'vgchange', ['-an', vgName])
    }
  }

  _getLvmPhysicalVolume = Disposable.factory(this._getLvmPhysicalVolume)
  _getLvmPhysicalVolume = deduped(this._getLvmPhysicalVolume, (devicePath, partition) => [devicePath, partition?.id])
  _getLvmPhysicalVolume = debounceResourceFactory(this._getLvmPhysicalVolume)
  async *_getLvmPhysicalVolume(devicePath, partition) {
    const args = []
    if (partition !== undefined) {
      args.push('-o', partition.start * 512, '--sizelimit', partition.size)
    }
    args.push('--show', '-f', devicePath)
    const path = (await fromCallback(execFile, 'losetup', args)).trim()
    try {
      await fromCallback(execFile, 'pvscan', ['--cache', path])
      yield path
    } finally {
      try {
        const vgNames = await pvs('vg_name', path)
        await fromCallback(execFile, 'vgchange', ['-an', ...vgNames])
      } finally {
        await fromCallback(execFile, 'losetup', ['-d', path])
      }
    }
  }

  _getPartition = Disposable.factory(this._getPartition)
  _getPartition = deduped(this._getPartition, (devicePath, partition) => [devicePath, partition?.id])
  _getPartition = debounceResourceFactory(this._getPartition)
  async *_getPartition(devicePath, partition) {
    const options = ['loop', 'ro']

    if (partition !== undefined) {
      const { size, start } = partition
      options.push(`sizelimit=${size}`)
      if (start !== undefined) {
        options.push(`offset=${start * 512}`)
      }
    }

    const path = yield getTmpDir()
    const mount = options => {
      return fromCallback(execFile, 'mount', [
        `--options=${options.join(',')}`,
        `--source=${devicePath}`,
        `--target=${path}`,
      ])
    }

    // `norecovery` option is used for ext3/ext4/xfs, if it fails it might be
    // another fs, try without
    try {
      await mount([...options, 'norecovery'])
    } catch (error) {
      await mount(options)
    }
    try {
      yield path
    } finally {
      await fromCallback(execFile, 'umount', ['--lazy', path])
    }
  }

  _listLvmLogicalVolumes(devicePath, partition, results = []) {
    return Disposable.use(this._getLvmPhysicalVolume(devicePath, partition), async path => {
      const lvs = await pvs(['lv_name', 'lv_path', 'lv_size', 'vg_name'], path)
      const partitionId = partition !== undefined ? partition.id : ''
      lvs.forEach((lv, i) => {
        const name = lv.lv_name
        if (name !== '') {
          results.push({
            id: `${partitionId}/${lv.vg_name}/${name}`,
            name,
            size: lv.lv_size,
          })
        }
      })
      return results
    })
  }

  _usePartitionFiles = Disposable.factory(this._usePartitionFiles)
  async *_usePartitionFiles(diskId, partitionId, paths) {
    const path = yield this.getPartition(diskId, partitionId)

    const files = []
    await asyncMap(paths, file =>
      addDirectory(files, resolveSubpath(path, file), normalize('./' + file).replace(/\/+$/, ''))
    )

    return files
  }

  // check if we will be allowed to merge a a vhd created in this adapter
  // with the vhd at path `path`
  async isMergeableParent(packedParentUid, path) {
    return await Disposable.use(openVhd(this.handler, path), vhd => {
      // this baseUuid is not linked with this vhd
      if (!vhd.footer.uuid.equals(packedParentUid)) {
        return false
      }

      const isVhdDirectory = vhd instanceof VhdDirectory
      return isVhdDirectory
        ? this.#useVhdDirectory() && this.#getCompressionType() === vhd.compressionType
        : !this.#useVhdDirectory()
    })
  }

  fetchPartitionFiles(diskId, partitionId, paths) {
    const { promise, reject, resolve } = pDefer()
    Disposable.use(
      async function* () {
        const files = yield this._usePartitionFiles(diskId, partitionId, paths)
        const zip = new ZipFile()
        files.forEach(({ realPath, metadataPath }) => zip.addFile(realPath, metadataPath))
        zip.end()
        const { outputStream } = zip
        resolve(outputStream)
        await fromEvent(outputStream, 'end')
      }.bind(this)
    ).catch(error => {
      warn(error)
      reject(error)
    })
    return promise
  }

  async deleteDeltaVmBackups(backups) {
    const handler = this._handler

    // this will delete the json, unused VHDs will be detected by `cleanVm`
    await asyncMapSettled(backups, ({ _filename }) => handler.unlink(_filename))
  }

  async deleteMetadataBackup(backupId) {
    const uuidReg = '\\w{8}(-\\w{4}){3}-\\w{12}'
    const metadataDirReg = 'xo-(config|pool-metadata)-backups'
    const timestampReg = '\\d{8}T\\d{6}Z'
    const regexp = new RegExp(`^${metadataDirReg}/${uuidReg}(/${uuidReg})?/${timestampReg}`)
    if (!regexp.test(backupId)) {
      throw new Error(`The id (${backupId}) not correspond to a metadata folder`)
    }

    await this._handler.rmtree(backupId)
  }

  async deleteOldMetadataBackups(dir, retention) {
    const handler = this.handler
    let list = await handler.list(dir)
    list.sort()
    list = list.filter(timestamp => /^\d{8}T\d{6}Z$/.test(timestamp)).slice(0, -retention)
    await asyncMapSettled(list, timestamp => handler.rmtree(`${dir}/${timestamp}`))
  }

  async deleteFullVmBackups(backups) {
    const handler = this._handler
    await asyncMapSettled(backups, ({ _filename, xva }) =>
      Promise.all([handler.unlink(_filename), handler.unlink(resolveRelativeFromFile(_filename, xva))])
    )
  }

  deleteVmBackup(file) {
    return this.deleteVmBackups([file])
  }

  async deleteVmBackups(files) {
    const { delta, full, ...others } = groupBy(await asyncMap(files, file => this.readVmBackupMetadata(file)), 'mode')

    const unsupportedModes = Object.keys(others)
    if (unsupportedModes.length !== 0) {
      throw new Error('no deleter for backup modes: ' + unsupportedModes.join(', '))
    }

    await Promise.all([
      delta !== undefined && this.deleteDeltaVmBackups(delta),
      full !== undefined && this.deleteFullVmBackups(full),
    ])
  }

  #getCompressionType() {
    return this._vhdDirectoryCompression
  }

  #useVhdDirectory() {
    return this.handler.type === 's3'
  }

  #useAlias() {
    return this.#useVhdDirectory()
  }

  getDisk = Disposable.factory(this.getDisk)
  getDisk = deduped(this.getDisk, diskId => [diskId])
  getDisk = debounceResourceFactory(this.getDisk)
  async *getDisk(diskId) {
    const handler = this._handler

    const diskPath = handler._getFilePath('/' + diskId)
    const mountDir = yield getTmpDir()
    await fromCallback(execFile, 'vhdimount', [diskPath, mountDir])
    try {
      let max = 0
      let maxEntry
      const entries = await readdir(mountDir)
      entries.forEach(entry => {
        const matches = RE_VHDI.exec(entry)
        if (matches !== null) {
          const value = +matches[1]
          if (value > max) {
            max = value
            maxEntry = entry
          }
        }
      })
      if (max === 0) {
        throw new Error('no disks found')
      }

      yield `${mountDir}/${maxEntry}`
    } finally {
      await fromCallback(execFile, 'fusermount', ['-uz', mountDir])
    }
  }

  // partitionId values:
  //
  // - undefined: raw disk
  // - `<partitionId>`: partitioned disk
  // - `<pvId>/<vgName>/<lvName>`: LVM on a partitioned disk
  // - `/<vgName>/lvName>`: LVM on a raw disk
  getPartition = Disposable.factory(this.getPartition)
  async *getPartition(diskId, partitionId) {
    const devicePath = yield this.getDisk(diskId)
    if (partitionId === undefined) {
      return yield this._getPartition(devicePath)
    }

    const isLvmPartition = partitionId.includes('/')
    if (isLvmPartition) {
      const [pvId, vgName, lvName] = partitionId.split('/')
      const lvs = yield this._getLvmLogicalVolumes(devicePath, pvId !== '' ? pvId : undefined, vgName)
      return yield this._getPartition(lvs.find(_ => _.lv_name === lvName).lv_path)
    }

    return yield this._getPartition(devicePath, await this._findPartition(devicePath, partitionId))
  }

  // if we use alias on this remote, we have to name the file alias.vhd
  getVhdFileName(baseName) {
    if (this.#useAlias()) {
      return `${baseName}.alias.vhd`
    }
    return `${baseName}.vhd`
  }

  async listAllVmBackups() {
    const handler = this._handler

    const backups = { __proto__: null }
    await asyncMap(await handler.list(BACKUP_DIR), async entry => {
      // ignore hidden and lock files
      if (entry[0] !== '.' && !entry.endsWith('.lock')) {
        const vmBackups = await this.listVmBackups(entry)
        if (vmBackups.length !== 0) {
          backups[entry] = vmBackups
        }
      }
    })

    return backups
  }

  listPartitionFiles(diskId, partitionId, path) {
    return Disposable.use(this.getPartition(diskId, partitionId), async rootPath => {
      path = resolveSubpath(rootPath, path)

      const entriesMap = {}
      await asyncMap(await readdir(path), async name => {
        try {
          const stats = await stat(`${path}/${name}`)
          entriesMap[stats.isDirectory() ? `${name}/` : name] = {}
        } catch (error) {
          if (error == null || error.code !== 'ENOENT') {
            throw error
          }
        }
      })

      return entriesMap
    })
  }

  listPartitions(diskId) {
    return Disposable.use(this.getDisk(diskId), async devicePath => {
      const partitions = await listPartitions(devicePath)

      if (partitions.length === 0) {
        try {
          // handle potential raw LVM physical volume
          return await this._listLvmLogicalVolumes(devicePath, undefined, partitions)
        } catch (error) {
          return []
        }
      }

      const results = []
      await asyncMapSettled(partitions, partition =>
        partition.type === LVM_PARTITION_TYPE
          ? this._listLvmLogicalVolumes(devicePath, partition, results)
          : results.push(partition)
      )
      return results
    })
  }

  async listPoolMetadataBackups() {
    const handler = this._handler
    const safeReaddir = createSafeReaddir(handler, 'listPoolMetadataBackups')

    const backupsByPool = {}
    await asyncMap(await safeReaddir(DIR_XO_POOL_METADATA_BACKUPS, { prependDir: true }), async scheduleDir =>
      asyncMap(await safeReaddir(scheduleDir), async poolId => {
        const backups = backupsByPool[poolId] ?? (backupsByPool[poolId] = [])
        return asyncMap(await safeReaddir(`${scheduleDir}/${poolId}`, { prependDir: true }), async backupDir => {
          try {
            backups.push({
              id: backupDir,
              ...JSON.parse(String(await handler.readFile(`${backupDir}/metadata.json`))),
            })
          } catch (error) {
            warn(`listPoolMetadataBackups ${backupDir}`, {
              error,
            })
          }
        })
      })
    )

    // delete empty entries and sort backups
    Object.keys(backupsByPool).forEach(poolId => {
      const backups = backupsByPool[poolId]
      if (backups.length === 0) {
        delete backupsByPool[poolId]
      } else {
        backups.sort(compareTimestamp)
      }
    })

    return backupsByPool
  }

  async listVmBackups(vmUuid, predicate) {
    const handler = this._handler
    const backups = []

    try {
      const files = await handler.list(`${BACKUP_DIR}/${vmUuid}`, {
        filter: isMetadataFile,
        prependDir: true,
      })
      await asyncMap(files, async file => {
        try {
          const metadata = await this.readVmBackupMetadata(file)
          if (predicate === undefined || predicate(metadata)) {
            // inject an id usable by importVmBackupNg()
            metadata.id = metadata._filename

            backups.push(metadata)
          }
        } catch (error) {
          warn(`listVmBackups ${file}`, { error })
        }
      })
    } catch (error) {
      let code
      if (error == null || ((code = error.code) !== 'ENOENT' && code !== 'ENOTDIR')) {
        throw error
      }
    }

    return backups.sort(compareTimestamp)
  }

  async listXoMetadataBackups() {
    const handler = this._handler
    const safeReaddir = createSafeReaddir(handler, 'listXoMetadataBackups')

    const backups = []
    await asyncMap(await safeReaddir(DIR_XO_CONFIG_BACKUPS, { prependDir: true }), async scheduleDir =>
      asyncMap(await safeReaddir(scheduleDir, { prependDir: true }), async backupDir => {
        try {
          backups.push({
            id: backupDir,
            ...JSON.parse(String(await handler.readFile(`${backupDir}/metadata.json`))),
          })
        } catch (error) {
          warn(`listXoMetadataBackups ${backupDir}`, { error })
        }
      })
    )

    return backups.sort(compareTimestamp)
  }

  async writeVhd(path, input, { checksum = true, validator = noop } = {}) {
    const handler = this._handler

    if (this.#useVhdDirectory()) {
      const dataPath = `${dirname(path)}/data/${uuidv4()}.vhd`
      await createVhdDirectoryFromStream(handler, dataPath, input, {
        concurrency: 16,
        compression: this.#getCompressionType(),
        async validator() {
          await input.task
          return validator.apply(this, arguments)
        },
      })
      await VhdAbstract.createAlias(handler, path, dataPath)
    } else {
      await this.outputStream(path, input, { checksum, validator })
    }
  }

  async outputStream(path, input, { checksum = true, validator = noop } = {}) {
    await this._handler.outputStream(path, input, {
      checksum,
      dirMode: this._dirMode,
      async validator() {
        await input.task
        return validator.apply(this, arguments)
      },
    })
  }

  async _createSyntheticStream(handler, paths) {
    let disposableVhds = []

    // if it's a path : open all hierarchy of parent
    if (typeof paths === 'string') {
      let vhd,
        vhdPath = paths
      do {
        const disposable = await openVhd(handler, vhdPath)
        vhd = disposable.value
        disposableVhds.push(disposable)
        vhdPath = resolveRelativeFromFile(vhdPath, vhd.header.parentUnicodeName)
      } while (vhd.footer.diskType !== Constants.DISK_TYPES.DYNAMIC)
    } else {
      // only open the list of path given
      disposableVhds = paths.map(path => openVhd(handler, path))
    }

    // I don't want the vhds to be disposed on return
    // but only when the stream is done ( or failed )
    const disposables = await Disposable.all(disposableVhds)
    const vhds = disposables.value

    let disposed = false
    const disposeOnce = async () => {
      if (!disposed) {
        disposed = true

        try {
          await disposables.dispose()
        } catch (error) {
          warn('_createSyntheticStream: failed to dispose VHDs', { error })
        }
      }
    }

    const synthetic = new VhdSynthetic(vhds)
    await synthetic.readHeaderAndFooter()
    await synthetic.readBlockAllocationTable()
    const stream = await synthetic.stream()
    stream.on('end', disposeOnce)
    stream.on('close', disposeOnce)
    stream.on('error', disposeOnce)
    return stream
  }

  async readDeltaVmBackup(metadata) {
    const handler = this._handler
    const { vbds, vdis, vhds, vifs, vm } = metadata
    const dir = dirname(metadata._filename)

    const streams = {}
    await asyncMapSettled(Object.keys(vdis), async id => {
      streams[`${id}.vhd`] = await this._createSyntheticStream(handler, join(dir, vhds[id]))
    })

    return {
      streams,
      vbds,
      vdis,
      version: '1.0.0',
      vifs,
      vm,
    }
  }

  readFullVmBackup(metadata) {
    return this._handler.createReadStream(resolve('/', dirname(metadata._filename), metadata.xva))
  }

  async readVmBackupMetadata(path) {
    return Object.defineProperty(JSON.parse(await this._handler.readFile(path)), '_filename', { value: path })
  }
}

Object.assign(RemoteAdapter.prototype, {
  cleanVm(vmDir, { lock = true } = {}) {
    if (lock) {
      return Disposable.use(this._handler.lock(vmDir), () => cleanVm.apply(this, arguments))
    } else {
      return cleanVm.apply(this, arguments)
    }
  },
  isValidXva,
})

exports.RemoteAdapter = RemoteAdapter
