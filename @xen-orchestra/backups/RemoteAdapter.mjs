import { asyncEach } from '@vates/async-each'
import { asyncMap, asyncMapSettled } from '@xen-orchestra/async-map'
import { compose } from '@vates/compose'
import { createLogger } from '@xen-orchestra/log'
import { VhdDirectory, VhdSynthetic } from 'vhd-lib'
import { decorateMethodsWith } from '@vates/decorate-with'
import { deduped } from '@vates/disposable/deduped.js'
import { dirname, join, resolve } from 'node:path'
import { execFile } from 'child_process'
import { mount } from '@vates/fuse-vhd'
import { readdir, lstat } from 'node:fs/promises'
import { synchronized } from 'decorator-synchronized'
import { ZipFile } from 'yazl'
import Disposable from 'promise-toolbox/Disposable'
import fromCallback from 'promise-toolbox/fromCallback'
import fromEvent from 'promise-toolbox/fromEvent'
import groupBy from 'lodash/groupBy.js'
import pDefer from 'promise-toolbox/defer'
import pickBy from 'lodash/pickBy.js'
import reduce from 'lodash/reduce.js'
import tar from 'tar'
import zlib from 'zlib'

import { BACKUP_DIR } from './_getVmBackupDir.mjs'
import { cleanVm } from './_cleanVm.mjs'
import { formatFilenameDate } from './_filenameDate.mjs'
import { getTmpDir } from './_getTmpDir.mjs'
import { isMetadataFile } from './_backupType.mjs'
import { isValidXva } from './_isValidXva.mjs'
import { listPartitions, LVM_PARTITION_TYPE } from './_listPartitions.mjs'
import { lvs, pvs } from './_lvm.mjs'
import { watchStreamSize } from './_watchStreamSize.mjs'

import { RemoteVhd } from './disks/RemoteVhd.mjs'
import { openDiskChain } from './disks/openDiskChain.mjs'
import { toVhdStream, writeToVhdDirectory } from 'vhd-lib/disk-consumer/index.mjs'
import { ReadAhead } from '@xen-orchestra/disk-transform'

export const DIR_XO_CONFIG_BACKUPS = 'xo-config-backups'

export const DIR_XO_POOL_METADATA_BACKUPS = 'xo-pool-metadata-backups'

const IMMUTABILITY_METADATA_FILENAME = '/immutability.json'

const { debug, warn } = createLogger('xo:backups:RemoteAdapter')

const compareTimestamp = (a, b) => a.timestamp - b.timestamp

const noop = Function.prototype

const resolveRelativeFromFile = (file, path) => resolve('/', dirname(file), path).slice(1)
const makeRelative = path => resolve('/', path).slice(1)
const resolveSubpath = (root, path) => resolve(root, makeRelative(path))

async function addZipEntries(zip, realBasePath, virtualBasePath, relativePaths) {
  for (const relativePath of relativePaths) {
    const realPath = join(realBasePath, relativePath)
    const virtualPath = join(virtualBasePath, relativePath)

    const stats = await lstat(realPath)
    const { mode, mtime } = stats
    const opts = { mode, mtime }
    if (stats.isDirectory()) {
      zip.addEmptyDirectory(virtualPath, opts)
      await addZipEntries(zip, realPath, virtualPath, await readdir(realPath))
    } else if (stats.isFile()) {
      zip.addFile(realPath, virtualPath, opts)
    }
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

export class RemoteAdapter {
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

    debug('activate LVM volume group', { vgName })
    await fromCallback(execFile, 'vgchange', ['-ay', vgName])
    try {
      debug('get LVM volume group name and path', { vgName })
      yield lvs(['lv_name', 'lv_path'], vgName)
    } finally {
      debug('deactivate LVM volume group', { vgName })
      await fromCallback(execFile, 'vgchange', ['-an', vgName])
    }
  }

  async *_getLvmPhysicalVolume(devicePath, partition) {
    const args = []
    if (partition !== undefined) {
      args.push('-o', partition.start * 512, '--sizelimit', partition.size)
    }
    args.push('--show', '-f', devicePath)

    debug('attach loop device', { devicePath, partition })
    const path = (await fromCallback(execFile, 'losetup', args)).trim()
    try {
      debug('list LVM physical volume', { path })
      await fromCallback(execFile, 'pvscan', ['--cache', path])

      yield path
    } finally {
      try {
        const vgNames = await pvs('vg_name', path)

        debug('deactivate LVM volume groups', { vgNames })
        await fromCallback(execFile, 'vgchange', ['-an', ...vgNames])
      } finally {
        debug('detach loop device', { path })
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
      debug('mount device', { devicePath, mountPath: path })
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
      debug('umount device', { devicePath, mountPath: path })
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

  // check if we will be allowed to merge a vhd created in this adapter
  // with the vhd at path `path`
  async isMergeableParent(packedParentUid, path) {
    return await Disposable.use(VhdSynthetic.fromVhdChain(this.handler, path), vhd => {
      // this baseUuid is not linked with this vhd
      if (!vhd.footer.uuid.equals(packedParentUid)) {
        return false
      }

      // check if all the chain is composed of vhd directory
      const isVhdDirectory = vhd.checkVhdsClass(VhdDirectory)
      return isVhdDirectory
        ? this.useVhdDirectory() && this.#getCompressionType() === vhd.compressionType
        : !this.useVhdDirectory()
    })
  }

  fetchPartitionFiles(diskId, partitionId, paths, format) {
    const { promise, reject, resolve } = pDefer()
    Disposable.use(
      async function* () {
        const path = yield this.getPartition(diskId, partitionId)
        let outputStream

        if (format === 'tgz') {
          outputStream = tar.c({ cwd: path, gzip: true }, paths.map(makeRelative))
        } else if (format === 'zip') {
          const zip = new ZipFile()
          await addZipEntries(zip, path, '', paths.map(makeRelative))
          zip.end()
          ;({ outputStream } = zip)
        } else {
          throw new Error('unsupported format ' + format)
        }

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
    const metadata = await asyncMap(files, file => this.readVmBackupMetadata(file))
    const { delta, full, ...others } = groupBy(metadata, 'mode')

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

    const diskPath = handler.getFilePath('/' + diskId)
    const mountDir = yield getTmpDir()

    debug('mount VHD (vhdimount)', { diskPath, mountPath: mountDir })
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
      debug('umount VHD (fusermount)', { diskPath, mountPath: mountDir })
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

  async listAllVms() {
    const handler = this._handler
    const vmsUuids = []
    try {
      await asyncEach(await handler.list(BACKUP_DIR), async entry => {
        // ignore hidden and lock files
        if (entry[0] !== '.' && !entry.endsWith('.lock')) {
          vmsUuids.push(entry)
        }
      })
    } catch (error) {
      // remote without any VM backup are ok
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    return vmsUuids
  }

  async listAllVmBackups() {
    const vmsUuids = await this.listAllVms()
    const backups = { __proto__: null }
    await asyncEach(vmsUuids, async vmUuid => {
      const vmBackups = await this.listVmBackups(vmUuid)
      if (vmBackups.length !== 0) {
        backups[vmUuid] = vmBackups
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

  async #getCacheableDataListVmBackups(dir) {
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
    const backups = await this.#getCacheableDataListVmBackups(`${BACKUP_DIR}/${vmUuid}`)
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

  async writeVhd(path, disk, { validator = noop, writeBlockConcurrency } = {}) {
    const handler = this._handler

    if (this.useVhdDirectory()) {
      await writeToVhdDirectory({
        disk,
        target: {
          handler,
          path,
          concurrency: writeBlockConcurrency,
          validator,
          compression: 'brotli',
        },
      })
    } else {
      const stream = await toVhdStream({ disk })
      await this.outputStream(path, stream, { validator })
      await validator(path)
    }
  }

  async outputStream(
    path,
    input,
    { checksum = !this._handler.isEncrypted, maxStreamLength, streamLength, validator = noop } = {}
  ) {
    const container = watchStreamSize(input)
    await this._handler.outputStream(path, input, {
      checksum,
      dirMode: this._dirMode,
      maxStreamLength,
      streamLength,
      async validator() {
        await input.task
        return validator.apply(this, arguments)
      },
    })
    return container.size
  }

  // open the  hierarchy of ancestors until we find a full one
  async _createVhdDisk(handler, path, { useChain }) {
    let disk
    if (useChain) {
      disk = await openDiskChain({ handler, path })
    } else {
      disk = new RemoteVhd({ handler, path })
      await disk.init()
    }
    disk = new ReadAhead(disk)
    return disk
  }

  async readIncrementalVmBackup(metadata, ignoredVdis, { useChain = true } = {}) {
    const handler = this._handler
    const { vbds, vhds, vifs, vm, vmSnapshot, vtpms } = metadata
    const dir = dirname(metadata._filename)
    const vdis = ignoredVdis === undefined ? metadata.vdis : pickBy(metadata.vdis, vdi => !ignoredVdis.has(vdi.uuid))
    const disks = {}
    await asyncMapSettled(Object.keys(vdis), async ref => {
      delete vdis[ref].baseVdi
      disks[ref] = await this._createVhdDisk(handler, join(dir, vhds[ref]), { useChain })
    })

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

  readFullVmBackup(metadata) {
    return this._handler.createReadStream(resolve('/', dirname(metadata._filename), metadata.xva))
  }

  async readVmBackupMetadata(path) {
    let json
    let isImmutable = false
    let remoteIsImmutable = false
    // if the remote is immutable, check if this metadata is also immutable
    try {
      // this file is not encrypted
      await this._handler._readFile(IMMUTABILITY_METADATA_FILENAME)
      remoteIsImmutable = true
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    try {
      // this will trigger an EPERM error if the file is immutable
      json = await this.handler.readFile(path, { flag: 'r+' })
      // s3 handler don't respect flags
    } catch (err) {
      // retry without triggering immutability check ,only on immutable remote
      if (err.code === 'EPERM' && remoteIsImmutable) {
        isImmutable = true
        json = await this._handler.readFile(path, { flag: 'r' })
      } else {
        throw err
      }
    }
    // _filename is a private field used to compute the backup id
    //
    // it's enumerable to make it cacheable
    const metadata = { ...JSON.parse(json), _filename: path, isImmutable }

    // backups created on XenServer < 7.1 via JSON in XML-RPC transports have boolean values encoded as integers, which make them unusable with more recent XAPIs
    if (typeof metadata.vm.is_a_template === 'number') {
      const properties = {
        vbds: ['bootable', 'unpluggable', 'storage_lock', 'empty', 'currently_attached'],
        vdis: [
          'sharable',
          'read_only',
          'storage_lock',
          'managed',
          'missing',
          'is_a_snapshot',
          'allow_caching',
          'metadata_latest',
        ],
        vifs: ['currently_attached', 'MAC_autogenerated'],
        vm: ['is_a_template', 'is_control_domain', 'ha_always_run', 'is_a_snapshot', 'is_snapshot_from_vmpp'],
        vmSnapshot: ['is_a_template', 'is_control_domain', 'ha_always_run', 'is_snapshot_from_vmpp'],
      }

      function fixBooleans(obj, properties) {
        properties.forEach(property => {
          if (typeof obj[property] === 'number') {
            obj[property] = obj[property] === 1
          }
        })
      }

      for (const [key, propertiesInKey] of Object.entries(properties)) {
        const value = metadata[key]
        if (value !== undefined) {
          // some properties of the metadata are collections indexed by the opaqueRef
          const isCollection = Object.keys(value).some(subKey => subKey.startsWith('OpaqueRef:'))
          if (isCollection) {
            Object.values(value).forEach(subValue => fixBooleans(subValue, propertiesInKey))
          } else {
            fixBooleans(value, propertiesInKey)
          }
        }
      }
    }
    return metadata
  }

  #computeTotalBackupSizeRecursively(backups) {
    return reduce(
      backups,
      (prev, backup) => {
        const _backup = Array.isArray(backup) ? this.#computeTotalBackupSizeRecursively(backup) : backup
        return {
          onDisk: prev.onDisk + (_backup.onDisk ?? _backup.size),
        }
      },
      { onDisk: 0 }
    )
  }

  async getTotalVmBackupSize() {
    return this.#computeTotalBackupSizeRecursively(await this.listAllVmBackups())
  }

  async getTotalBackupSize() {
    const vmBackupSize = await this.getTotalVmBackupSize()
    // @TODO: add `getTotalXoBackupSize` and `getTotalPoolBackupSize` once `size` is implemented by fs
    return vmBackupSize
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

  getDisk: compose([Disposable.factory, [deduped, diskId => [diskId]], debounceResourceFactory]),

  getPartition: Disposable.factory,
})
