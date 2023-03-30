'use strict'

const { asyncMap, asyncMapSettled } = require('@xen-orchestra/async-map')
const { synchronized } = require('decorator-synchronized')
const Disposable = require('promise-toolbox/Disposable')
const fromCallback = require('promise-toolbox/fromCallback')
const fromEvent = require('promise-toolbox/fromEvent')
const pDefer = require('promise-toolbox/defer')
const groupBy = require('lodash/groupBy.js')
const pickBy = require('lodash/pickBy.js')
const { dirname, join, normalize, resolve } = require('path')
const { createLogger } = require('@xen-orchestra/log')
const {
  createVhdDirectoryFromStream,
  createVhdStreamWithLength,
  openVhd,
  VhdAbstract,
  VhdDirectory,
  VhdSynthetic,
} = require('vhd-lib')
const { deduped } = require('@vates/disposable/deduped.js')
const { decorateMethodsWith } = require('@vates/decorate-with')
const { compose } = require('@vates/compose')
const { execFile } = require('child_process')
const { readdir, lstat } = require('fs-extra')
const { v4: uuidv4 } = require('uuid')
const { ZipFile } = require('yazl')
const zlib = require('zlib')

const { BACKUP_DIR } = require('./_getVmBackupDir.js')
const { cleanVm } = require('./_cleanVm.js')
const { formatFilenameDate } = require('./_filenameDate.js')
const { getTmpDir } = require('./_getTmpDir.js')
const { isMetadataFile } = require('./_backupType.js')
const { isValidXva } = require('./_isValidXva.js')
const { listPartitions, LVM_PARTITION_TYPE } = require('./_listPartitions.js')
const { lvs, pvs } = require('./_lvm.js')
const { watchStreamSize } = require('./_watchStreamSize')
// @todo : this import is marked extraneous , sould be fixed when lib is published
const { mount } = require('@vates/fuse-vhd')
const { asyncEach } = require('@vates/async-each')
const { strictEqual } = require('assert')

const DIR_XO_CONFIG_BACKUPS = 'xo-config-backups'
exports.DIR_XO_CONFIG_BACKUPS = DIR_XO_CONFIG_BACKUPS

const DIR_XO_POOL_METADATA_BACKUPS = 'xo-pool-metadata-backups'
exports.DIR_XO_POOL_METADATA_BACKUPS = DIR_XO_POOL_METADATA_BACKUPS

const { debug, warn } = createLogger('xo:backups:RemoteAdapter')

const compareTimestamp = (a, b) => a.timestamp - b.timestamp

const noop = Function.prototype

const resolveRelativeFromFile = (file, path) => resolve('/', dirname(file), path).slice(1)

const resolveSubpath = (root, path) => resolve(root, `.${resolve('/', path)}`)

async function addDirectory(files, realPath, metadataPath) {
  const stats = await lstat(realPath)
  if (stats.isDirectory()) {
    await asyncMap(await readdir(realPath), file =>
      addDirectory(files, realPath + '/' + file, metadataPath + '/' + file)
    )
  } else if (stats.isFile()) {
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
  constructor(
    handler,
    { debounceResource = res => res, dirMode, vhdDirectoryCompression, useGetDiskLegacy = false } = {}
  ) {
    this._debounceResource = debounceResource
    this._dirMode = dirMode
    this._handler = handler
    this._vhdDirectoryCompression = vhdDirectoryCompression
    this._readCacheListVmBackups = synchronized.withKey()(this._readCacheListVmBackups)
    this._useGetDiskLegacy = useGetDiskLegacy
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

  async *_getLvmLogicalVolumes(devicePath, pvId, vgName) {
    yield this._getLvmPhysicalVolume(devicePath, pvId && (await this._findPartition(devicePath, pvId)))

    await fromCallback(execFile, 'vgchange', ['-ay', vgName])
    try {
      yield lvs(['lv_name', 'lv_path'], vgName)
    } finally {
      await fromCallback(execFile, 'vgchange', ['-an', vgName])
    }
  }

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

  async *_getPartition(devicePath, partition) {
    // the norecovery option is necessary because if the partition is dirty,
    // mount will try to fix it which is impossible if because the device is read-only
    const options = ['loop', 'ro', 'norecovery']

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
        ? this.useVhdDirectory() && this.#getCompressionType() === vhd.compressionType
        : !this.useVhdDirectory()
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

  async #removeVmBackupsFromCache(backups) {
    await asyncEach(
      Object.entries(
        groupBy(
          backups.map(_ => _._filename),
          dirname
        )
      ),
      ([dir, filenames]) =>
        // will not reject
        this._updateCache(dir + '/cache.json.gz', backups => {
          for (const filename of filenames) {
            debug('removing cache entry', { entry: filename })
            delete backups[filename]
          }
        })
    )
  }

  async deleteDeltaVmBackups(backups) {
    const handler = this._handler

    // this will delete the json, unused VHDs will be detected by `cleanVm`
    await asyncMapSettled(backups, ({ _filename }) => handler.unlink(_filename))

    await this.#removeVmBackupsFromCache(backups)
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

    await this.#removeVmBackupsFromCache(backups)
  }

  deleteVmBackup(file) {
    return this.deleteVmBackups([file])
  }

  async deleteVmBackups(files) {
    const metadatas = await asyncMap(files, file => this.readVmBackupMetadata(file))
    const { delta, full, ...others } = groupBy(metadatas, 'mode')

    const unsupportedModes = Object.keys(others)
    if (unsupportedModes.length !== 0) {
      throw new Error('no deleter for backup modes: ' + unsupportedModes.join(', '))
    }

    await Promise.all([
      delta !== undefined && this.deleteDeltaVmBackups(delta),
      full !== undefined && this.deleteFullVmBackups(full),
    ])

    await asyncMap(new Set(files.map(file => dirname(file))), dir =>
      // - don't merge in main process, unused VHDs will be merged in the next backup run
      // - don't error in case this fails:
      //   - if lock is already being held, a backup is running and cleanVm will be ran at the end
      //   - otherwise, there is nothing more we can do, orphan file will be cleaned in the future
      this.cleanVm(dir, { remove: true, logWarn: warn }).catch(noop)
    )
  }

  #getCompressionType() {
    return this._vhdDirectoryCompression
  }

  useVhdDirectory() {
    return this.handler.useVhdDirectory()
  }

  #useAlias() {
    return this.useVhdDirectory()
  }

  async *#getDiskLegacy(diskId) {
    const RE_VHDI = /^vhdi(\d+)$/
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

  async *getDisk(diskId) {
    if (this._useGetDiskLegacy) {
      yield* this.#getDiskLegacy(diskId)
      return
    }
    const handler = this._handler
    // this is a disposable
    const mountDir = yield getTmpDir()
    // this is also a disposable
    yield mount(handler, diskId, mountDir)
    // this will yield disk path to caller
    yield `${mountDir}/vhd0`
  }

  // partitionId values:
  //
  // - undefined: raw disk
  // - `<partitionId>`: partitioned disk
  // - `<pvId>/<vgName>/<lvName>`: LVM on a partitioned disk
  // - `/<vgName>/lvName>`: LVM on a raw disk
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
      await asyncEach(
        await readdir(path),
        async name => {
          try {
            const stats = await lstat(`${path}/${name}`)
            if (stats.isDirectory()) {
              entriesMap[name + '/'] = {}
            } else if (stats.isFile()) {
              entriesMap[name] = {}
            }
          } catch (error) {
            if (error == null || error.code !== 'ENOENT') {
              throw error
            }
          }
        },
        { concurrency: 1 }
      )

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

  #getVmBackupsCache(vmUuid) {
    return `${BACKUP_DIR}/${vmUuid}/cache.json.gz`
  }

  async _readCache(path) {
    try {
      return JSON.parse(await fromCallback(zlib.gunzip, await this.handler.readFile(path)))
    } catch (error) {
      if (error.code !== 'ENOENT') {
        warn('#readCache', { error, path })
      }
    }
  }

  _updateCache = synchronized.withKey()(this._updateCache)
  // eslint-disable-next-line no-dupe-class-members
  async _updateCache(path, fn) {
    const cache = await this._readCache(path)
    if (cache !== undefined) {
      fn(cache)

      await this._writeCache(path, cache)
    }
  }

  async _writeCache(path, data) {
    try {
      await this.handler.writeFile(path, await fromCallback(zlib.gzip, JSON.stringify(data)), { flags: 'w' })
    } catch (error) {
      warn('#writeCache', { error, path })
    }
  }

  async #getCachabledDataListVmBackups(dir) {
    debug('generating cache', { path: dir })

    const handler = this._handler
    const backups = {}

    try {
      const files = await handler.list(dir, {
        filter: isMetadataFile,
        prependDir: true,
      })
      await asyncMap(files, async file => {
        try {
          const metadata = await this.readVmBackupMetadata(file)
          // inject an id usable by importVmBackupNg()
          metadata.id = metadata._filename
          backups[file] = metadata
        } catch (error) {
          warn(`can't read vm backup metadata`, { error, file, dir })
        }
      })
      return backups
    } catch (error) {
      let code
      if (error == null || ((code = error.code) !== 'ENOENT' && code !== 'ENOTDIR')) {
        throw error
      }
    }
  }

  // use _ to mark this method as private by convention
  // since we decorate it with synchronized.withKey in the constructor
  // and # function are not writeable.
  //
  // read the list of backup of a Vm from cache
  // if cache is missing  or broken  => regenerate it and return

  async _readCacheListVmBackups(vmUuid) {
    const path = this.#getVmBackupsCache(vmUuid)

    const cache = await this._readCache(path)
    if (cache !== undefined) {
      debug('found VM backups cache, using it', { path })
      return cache
    }

    // nothing cached, or cache unreadable => regenerate it
    const backups = await this.#getCachabledDataListVmBackups(`${BACKUP_DIR}/${vmUuid}`)
    if (backups === undefined) {
      return
    }

    // detached async action, will not reject
    this._writeCache(path, backups)

    return backups
  }

  async listVmBackups(vmUuid, predicate) {
    const backups = []
    const cached = await this._readCacheListVmBackups(vmUuid)

    if (cached === undefined) {
      return []
    }

    Object.values(cached).forEach(metadata => {
      if (predicate === undefined || predicate(metadata)) {
        backups.push(metadata)
      }
    })

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

  async writeVmBackupMetadata(vmUuid, metadata) {
    const path = `/${BACKUP_DIR}/${vmUuid}/${formatFilenameDate(metadata.timestamp)}.json`

    await this.handler.outputFile(path, JSON.stringify(metadata), {
      dirMode: this._dirMode,
    })

    // will not throw
    await this._updateCache(this.#getVmBackupsCache(vmUuid), backups => {
      debug('adding cache entry', { entry: path })
      backups[path] = {
        ...metadata,

        // these values are required in the cache
        _filename: path,
        id: path,
      }
    })

    return path
  }

  async writeVhd(path, input, { checksum = true, validator = noop, writeBlockConcurrency } = {}) {
    const handler = this._handler
    if (this.useVhdDirectory()) {
      const dataPath = `${dirname(path)}/data/${uuidv4()}.vhd`
      const size = await createVhdDirectoryFromStream(handler, dataPath, input, {
        concurrency: writeBlockConcurrency,
        compression: this.#getCompressionType(),
        async validator() {
          await input.task
          return validator.apply(this, arguments)
        },
      })
      await VhdAbstract.createAlias(handler, path, dataPath)
      return size
    } else {
      const inputWithSize = await createVhdStreamWithLength(input)
      return this.outputStream(path, inputWithSize, { checksum, validator, expectedSize: inputWithSize.length })
    }
  }

  async outputStream(path, input, { checksum = true, validator = noop, expectedSize } = {}) {
    const container = watchStreamSize(input)

    await this._handler.outputStream(path, input, {
      checksum,
      dirMode: this._dirMode,
      async validator() {
        await input.task
        if (expectedSize !== undefined) {
          // check that we read all the stream
          strictEqual(
            container.size,
            expectedSize,
            `transferred size ${container.size}, expected file size : ${expectedSize}`
          )
        }
        let size
        try {
          size = await this._handler.getSize(path)
        } catch (err) {
          // can fail is the remote is encrypted
        }
        if (size !== undefined) {
          // check that everything is written to disk
          strictEqual(size, container.size, `written size ${size}, transfered size : ${container.size}`)
        }
        return validator.apply(this, arguments)
      },
    })
    return container.size
  }

  // open the  hierarchy of ancestors until we find a full one
  async _createSyntheticStream(handler, path) {
    const disposableSynthetic = await VhdSynthetic.fromVhdChain(handler, path)
    // I don't want the vhds to be disposed on return
    // but only when the stream is done ( or failed )

    let disposed = false
    const disposeOnce = async () => {
      if (!disposed) {
        disposed = true
        try {
          await disposableSynthetic.dispose()
        } catch (error) {
          warn('openVhd: failed to dispose VHDs', { error })
        }
      }
    }
    const synthetic = disposableSynthetic.value
    await synthetic.readBlockAllocationTable()
    const stream = await synthetic.stream()

    stream.on('end', disposeOnce)
    stream.on('close', disposeOnce)
    stream.on('error', disposeOnce)
    return stream
  }

  async readDeltaVmBackup(metadata, ignoredVdis) {
    const handler = this._handler
    const { vbds, vhds, vifs, vm } = metadata
    const dir = dirname(metadata._filename)
    const vdis = ignoredVdis === undefined ? metadata.vdis : pickBy(metadata.vdis, vdi => !ignoredVdis.has(vdi.uuid))

    const streams = {}
    await asyncMapSettled(Object.keys(vdis), async ref => {
      streams[`${ref}.vhd`] = await this._createSyntheticStream(handler, join(dir, vhds[ref]))
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
    // _filename is a private field used to compute the backup id
    //
    // it's enumerable to make it cacheable
    return { ...JSON.parse(await this._handler.readFile(path)), _filename: path }
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

decorateMethodsWith(RemoteAdapter, {
  _getLvmLogicalVolumes: compose([
    Disposable.factory,
    [deduped, (devicePath, pvId, vgName) => [devicePath, pvId, vgName]],
    debounceResourceFactory,
  ]),

  _getLvmPhysicalVolume: compose([
    Disposable.factory,
    [deduped, (devicePath, partition) => [devicePath, partition?.id]],
    debounceResourceFactory,
  ]),

  _getPartition: compose([
    Disposable.factory,
    [deduped, (devicePath, partition) => [devicePath, partition?.id]],
    debounceResourceFactory,
  ]),

  _usePartitionFiles: Disposable.factory,

  getDisk: compose([Disposable.factory, [deduped, diskId => [diskId]], debounceResourceFactory]),

  getPartition: Disposable.factory,
})

exports.RemoteAdapter = RemoteAdapter
