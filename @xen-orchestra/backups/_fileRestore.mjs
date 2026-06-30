// File-level-restore (FLR) methods for RemoteAdapter.
//
// These were extracted from RemoteAdapter.mjs to keep that file focused on backup
// CRUD/cache/metadata. They are mixed back onto `RemoteAdapter.prototype` via
// `Object.assign` and decorated via `decorateMethodsWith` in RemoteAdapter.mjs, so `this`
// is the RemoteAdapter instance at call time (`this._handler`, `this._debounceResource`,
// `this._useGetDiskLegacy` keep working unchanged). The logger keeps the original
// `xo:backups:RemoteAdapter` namespace so existing debug filters are unaffected.
import { asyncEach } from '@vates/async-each'
import { asyncMapSettled } from '@xen-orchestra/async-map'
import { compose } from '@vates/compose'
import { createLogger } from '@xen-orchestra/log'
import { deduped } from '@vates/disposable/deduped.js'
import { randomBytes } from 'node:crypto'
import { join, resolve } from 'node:path'
import { execFile } from 'child_process'
import { finished } from 'node:stream/promises'
import { lstat, open, readdir, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { mount } from '@vates/fuse-vhd'
import { ZipFile } from 'yazl'
import Disposable from 'promise-toolbox/Disposable'
import fromCallback from 'promise-toolbox/fromCallback'
import pDefer from 'promise-toolbox/defer'
import * as tar from 'tar'

import { getTmpDir } from './_getTmpDir.mjs'
import {
  listPartitions,
  LINUX_DATA_PARTITION_TYPE_GPT,
  LINUX_DATA_PARTITION_TYPE_MBR,
  LVM_PARTITION_TYPE_GPT,
  LVM_PARTITION_TYPE_MBR,
} from './_listPartitions.mjs'
import { lvs, pvs } from './_lvm.mjs'

const { debug, warn } = createLogger('xo:backups:RemoteAdapter')

const noop = Function.prototype

// Restrict LVM scanning to a single device. Backup PVs are clones: the very same PVID
// appears at once on the raw loop device, the dm-snapshot overlaid on it, and every
// other restored copy of the same VM. An unscoped pvs/pvscan/vgimportclone/vgchange then
// aborts with "duplicate PV ... for PVID ..." and the VG can neither be renamed nor
// activated. Accepting only the device in hand removes every duplicate from LVM's view.
export const lvmOnlyDevice = devicePath => `devices { global_filter=[ "a|^${devicePath}$|", "r|.*|" ] }`

// Partition-type predicates (exported for unit tests).
export const isLvmPartitionType = type => type === LVM_PARTITION_TYPE_MBR || type === LVM_PARTITION_TYPE_GPT

// Some installers (e.g. Ubuntu subiquity) place an LVM PV on a generic Linux-data partition
// instead of the LVM type, so those are the only non-LVM types worth the (expensive) probe.
export const isProbeableForLvm = type =>
  type === LINUX_DATA_PARTITION_TYPE_MBR || type === LINUX_DATA_PARTITION_TYPE_GPT

// Build the partition entries for a PV's logical volumes (exported for unit tests).
// Shows "ubuntu-vg/ubuntu-lv" for readability; skips unnamed LVs.
export const toLvPartitions = (partitionId, originalVgName, lvItems) =>
  lvItems
    .filter(lv => lv.lv_name !== '')
    .map(lv => ({
      id: `${partitionId}/${lv.vg_name}/${lv.lv_name}`,
      name: originalVgName !== undefined ? `${originalVgName}/${lv.lv_name}` : lv.lv_name,
      size: lv.lv_size,
    }))

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

const debounceResourceFactory = factory =>
  function () {
    return this._debounceResource(factory.apply(this, arguments))
  }

// legacy disk mount via vhdimount; extracted from a private method so it can live in this
// module (mixin methods cannot reference class-private members).
async function* getDiskLegacy(handler, diskId) {
  const RE_VHDI = /^vhdi(\d+)$/

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

// Mixed onto RemoteAdapter.prototype — `this` is the RemoteAdapter instance.
export const fileRestoreMethods = {
  async _findPartition(devicePath, partitionId) {
    const partitions = await listPartitions(devicePath)
    const partition = partitions.find(_ => _.id === partitionId)
    if (partition === undefined) {
      throw new Error(`partition ${partitionId} not found`)
    }
    return partition
  },

  async *_getLvmLogicalVolumes(devicePath, pvId, requestedVgName) {
    const { vgName, lvmConfig } = yield this._getLvmPhysicalVolume(
      devicePath,
      pvId && (await this._findPartition(devicePath, pvId))
    )

    // vgName is the unique name vgimportclone just assigned to this PV; prefer it over the
    // (possibly stale) name embedded in the partitionId. lvmConfig scopes every command to
    // this device so a colliding/duplicate VG on the host or another copy can't shadow it.
    const effectiveVgName = vgName ?? requestedVgName

    debug('activate LVM volume group', { effectiveVgName, requestedVgName })
    await fromCallback(execFile, 'vgchange', ['--config', lvmConfig, '-ay', effectiveVgName])
    try {
      debug('get LVM logical volumes', { effectiveVgName })
      yield lvs(['lv_name', 'lv_path'], '--config', lvmConfig, effectiveVgName)
    } finally {
      debug('deactivate LVM volume group', { effectiveVgName })
      await fromCallback(execFile, 'vgchange', ['--config', lvmConfig, '-an', effectiveVgName])
    }
  },

  async *_getLvmPhysicalVolume(devicePath, partition) {
    const loopArgs = []
    if (partition !== undefined) {
      loopArgs.push('-o', partition.start * 512, '--sizelimit', partition.size)
    }
    loopArgs.push('--show', '-f', devicePath)

    debug('attach loop device', { devicePath, partition })
    const loopDevice = (await fromCallback(execFile, 'losetup', loopArgs)).trim()

    let cowPath, cowLoop, mapperName, vgName, lvmConfig
    try {
      // Cheap pre-check, scoped to this loop so a duplicate PVID (another copy of the same
      // VM restored concurrently) can't make it fail: is there an LVM PV here at all?
      // Non-PV partitions (/boot, EFI, raw disks) skip the whole dm-snapshot machinery.
      const [originalVgName] = (
        await pvs('vg_name', '--config', lvmOnlyDevice(loopDevice), loopDevice).catch(() => [])
      ).filter(Boolean)
      if (originalVgName === undefined) {
        const where = partition !== undefined ? ` partition ${partition.id}` : ''
        throw new Error(`no LVM physical volume on ${devicePath}${where}`)
      }

      // The backup is read-only, so overlay a writable dm-snapshot to let vgimportclone
      // rewrite metadata, and rename the VG to a unique name so concurrent clones (identical
      // PVID and VG name) don't collide on device-mapper node names. Every LVM command is
      // scoped to the snapshot device (lvmConfig) to keep duplicate PVIDs out of LVM's view.
      mapperName = `xo-pv-${randomBytes(4).toString('hex')}`
      const mapperPath = `/dev/mapper/${mapperName}`
      lvmConfig = lvmOnlyDevice(mapperPath)

      // ~4 MB sparse COW is enough to hold the LVM metadata rewrites
      cowPath = join(tmpdir(), `${mapperName}.cow`)
      const fh = await open(cowPath, 'w')
      await fh.truncate(4 * 1024 * 1024)
      await fh.close()
      cowLoop = (await fromCallback(execFile, 'losetup', ['--show', '-f', cowPath])).trim()

      const sectors = (await fromCallback(execFile, 'blockdev', ['--getsz', loopDevice])).trim()
      await fromCallback(execFile, 'dmsetup', [
        'create',
        mapperName,
        '--table',
        `0 ${sectors} snapshot ${loopDevice} ${cowLoop} P 8`,
      ])

      // Unique random VG name: list and mount each query/yield the name from the device, so
      // it need not be deterministic — only collision-free across concurrent clones.
      vgName = `xo${randomBytes(8).toString('hex')}`
      debug('import LVM volume group with unique name via dm-snapshot', { vgName, originalVgName })
      await fromCallback(execFile, 'vgimportclone', ['--config', lvmConfig, '--basevgname', vgName, mapperPath])

      yield { path: mapperPath, originalVgName, vgName, lvmConfig }
    } finally {
      if (mapperName !== undefined) {
        // best-effort deactivate (a no-op if it was never activated) before removing the snapshot
        await fromCallback(execFile, 'vgchange', ['--config', lvmConfig, '-an', vgName]).catch(noop)
        debug('remove dm-snapshot', { mapperName })
        await fromCallback(execFile, 'dmsetup', ['remove', mapperName]).catch(err =>
          warn('failed to remove dm-snapshot', { mapperName, error: err })
        )
      }
      if (cowLoop !== undefined) {
        await fromCallback(execFile, 'losetup', ['-d', cowLoop]).catch(noop)
      }
      if (cowPath !== undefined) {
        await unlink(cowPath).catch(noop)
      }
      debug('detach loop device', { loopDevice })
      await fromCallback(execFile, 'losetup', ['-d', loopDevice])
    }
  },

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
      debug('mount device', { devicePath, mountPath: path })
      return fromCallback(execFile, 'mount', [
        `--options=${options.join(',')}`,
        `--source=${devicePath}`,
        `--target=${path}`,
      ]).catch(error => {
        if (error.stderr) {
          error.message = `${error.message}: ${error.stderr.trim()}`
        }
        throw error
      })
    }

    // norecovery prevents mount from attempting journal replay on a read-only device (ext3/ext4/xfs).
    // Other filesystems don't support it, so fall back without it on failure.
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
  },

  _listLvmLogicalVolumes(devicePath, partition, results = []) {
    return Disposable.use(
      this._getLvmPhysicalVolume(devicePath, partition),
      async ({ path, originalVgName, lvmConfig }) => {
        const lvItems = await pvs(['lv_name', 'lv_path', 'lv_size', 'vg_name'], '--config', lvmConfig, path)
        const partitionId = partition !== undefined ? partition.id : ''
        results.push(...toLvPartitions(partitionId, originalVgName, lvItems))
        return results
      }
    )
  },

  fetchPartitionFiles(diskId, partitionId, paths, format) {
    const { promise, reject, resolve } = pDefer()
    const self = this
    Disposable.use(async function* () {
      const path = yield self.getPartition(diskId, partitionId)
      let outputStream

      if (format === 'tgz') {
        // process one entry at a time with { job: 1}. node-tar defaults to 4
        // concurrent jobs, which on a FUSE-backed restore mount means up to 4
        // simultaneous reads. Those saturate the libuv threadpool and starve
        // the underlying vhd/CIFS reads NTFS-3g depends on (FUSE-on-FUSE
        // threadpool deadlock). Serializing keeps a worker free for them.
        outputStream = tar.c({ cwd: path, gzip: true, jobs: 1 }, paths.map(makeRelative))
        resolve(outputStream)
      } else if (format === 'zip') {
        const zip = new ZipFile()
        // Resolve with the stream before enumeration so the client can start
        // receiving data immediately — addZipEntries over FUSE/S3 can take
        // minutes for large trees (e.g. node_modules) and would otherwise
        // appear as a freeze with no response sent.
        outputStream = zip.outputStream
        resolve(zip.outputStream)
        await addZipEntries(zip, path, '', paths.map(makeRelative))
        zip.end()
      } else {
        throw new Error('unsupported format ' + format)
      }

      await finished(outputStream).catch(noop)
    }).catch(error => {
      warn(error)
      reject(error)
    })
    return promise
  },

  async *getDisk(diskId) {
    try {
      if (this._useGetDiskLegacy) {
        yield* getDiskLegacy(this._handler, diskId)
        return
      }
      const handler = this._handler
      // this is a disposable
      const mountDir = yield getTmpDir()
      // this is also a disposable
      yield mount(handler, diskId, mountDir)
      // this will yield disk path to caller
      yield `${mountDir}/vhd0`
    } finally {
      // Disposable.factory disposes by calling gen.return(), which runs this finally before
      // the mount/tmpdir disposers — i.e. exactly as the disk is unmounted.
      this._partitionsCache.delete(diskId)
    }
  },

  // partitionId values:
  //
  // - undefined: raw disk
  // - `<partitionId>`: partitioned disk
  // - `<pvId>/<vgName>/<lvName>`: LVM on a partitioned disk
  // - `/<vgName>/lvName>`: LVM on a raw disk
  async *getPartition(diskId, partitionId) {
    const devicePath = yield this.getDisk(diskId)
    if (partitionId === undefined) {
      debug(
        'no partition specified, attempting raw disk mount — call listPartitions first if disk has partitions or LVM'
      )
      return yield this._getPartition(devicePath)
    }

    const isLvmPartition = partitionId.includes('/')
    if (isLvmPartition) {
      const [pvId, vgName, lvName] = partitionId.split('/')
      const lvs = yield this._getLvmLogicalVolumes(devicePath, pvId !== '' ? pvId : undefined, vgName)
      return yield this._getPartition(lvs.find(_ => _.lv_name === lvName).lv_path)
    }

    return yield this._getPartition(devicePath, await this._findPartition(devicePath, partitionId))
  },

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
  },

  listPartitions(diskId) {
    const cache = this._partitionsCache
    const cached = cache.get(diskId)
    if (cached !== undefined) {
      return cached
    }

    const pPartitions = Disposable.use(this.getDisk(diskId), async devicePath => {
      // partx may return empty on FUSE-backed files (vhd0); a loop device
      // presents proper block-device semantics that partx reads reliably.
      // losetup may itself fail if the FUSE mount isn't fully ready yet —
      // fall back to the direct path so listPartitions returns [] instead of throwing.
      let loopForParts, partitions
      try {
        loopForParts = (await fromCallback(execFile, 'losetup', ['--show', '-f', devicePath])).trim()
        partitions = await listPartitions(loopForParts)
      } catch (error) {
        debug('partition probe via loop device failed, falling back to direct path', { error })
        partitions = await listPartitions(devicePath)
      } finally {
        if (loopForParts !== undefined) {
          await fromCallback(execFile, 'losetup', ['-d', loopForParts]).catch(noop)
        }
      }

      if (partitions.length === 0) {
        try {
          // handle potential raw LVM physical volume
          return await this._listLvmLogicalVolumes(devicePath, undefined, partitions)
        } catch (error) {
          return []
        }
      }

      const results = []
      await asyncMapSettled(partitions, async partition => {
        if (isLvmPartitionType(partition.type)) {
          return this._listLvmLogicalVolumes(devicePath, partition, results)
        }

        // Only generic Linux-data partitions can hide an LVM PV (subiquity-style); other
        // types — BIOS boot, EFI, swap, … — are never PVs, so list them directly without
        // the (expensive) loop + dm-snapshot + vgimportclone probe.
        if (!isProbeableForLvm(partition.type)) {
          results.push(partition)
          return
        }

        const lvResults = []
        try {
          await this._listLvmLogicalVolumes(devicePath, partition, lvResults)
        } catch (error) {
          debug('LVM probe failed for Linux-data partition, treating as regular partition', {
            partition,
            error,
          })
        }
        if (lvResults.length > 0) {
          results.push(...lvResults)
        } else {
          results.push(partition)
        }
      })
      return results
    })

    // The entry is evicted on disk unmount (see getDisk)
    // a failed probe is not cached so the next call retries.
    cache.set(diskId, pPartitions)
    pPartitions.catch(() => {
      if (cache.get(diskId) === pPartitions) {
        cache.delete(diskId)
      }
    })
    return pPartitions
  },
}

// Applied by RemoteAdapter.mjs via decorateMethodsWith(RemoteAdapter, fileRestoreDecorators).
// debounceResourceFactory/deduped reference `this._debounceResource` at call time.
export const fileRestoreDecorators = {
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
}
