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
import { createHash, randomBytes } from 'node:crypto'
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
import { watchStreamSize } from './_watchStreamSize.mjs'

const { debug, info, warn } = createLogger('xo:backups:RemoteAdapter')

const noop = Function.prototype

// Restrict LVM scanning to a single device. Backup PVs are clones: the very same PVID
// appears at once on the raw loop device, the dm-snapshot overlaid on it, and every
// other restored copy of the same VM. An unscoped pvs/pvscan/vgimportclone/vgchange then
// aborts with "duplicate PV ... for PVID ..." and the VG can neither be renamed nor
// activated. Accepting only the device in hand removes every duplicate from LVM's view.
const lvmOnlyDevice = devicePath => `devices { global_filter=[ "a|^${devicePath}$|", "r|.*|" ] }`

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

  async *_getLvmLogicalVolumes(devicePath, pvId, vgName) {
    const { path: pvPath, lvmConfig } = yield this._getLvmPhysicalVolume(
      devicePath,
      pvId && (await this._findPartition(devicePath, pvId))
    )

    // vgimportclone may have renamed the VG (e.g. ubuntu-vg → xo<hash>); query the
    // actual name from the PV rather than trusting the partitionId-embedded name.
    // lvmConfig scopes every command to this PV so a colliding/duplicate VG on the host
    // or another restored copy can't shadow it.
    const [actualVgName] = (await pvs('vg_name', '--config', lvmConfig, pvPath).catch(() => [])).filter(Boolean)
    const effectiveVgName = actualVgName ?? vgName

    debug('activate LVM volume group', { effectiveVgName, requestedVgName: vgName })
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

    let cowPath, cowLoop, mapperName, effectivePath, originalVgName, lvmConfig
    try {
      try {
        // Create a sparse COW file (~4 MB is enough to hold LVM metadata rewrites)
        mapperName = `xo-pv-${randomBytes(4).toString('hex')}`
        const mapperPath = `/dev/mapper/${mapperName}`
        // Scope LVM to the snapshot only: the raw loop device carries the same PVID and
        // would otherwise be flagged as a duplicate, breaking pvscan and vgimportclone.
        const mapperConfig = lvmOnlyDevice(mapperPath)
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

        // Capture the original VG name before vgimportclone renames it so callers can display a
        // human-readable name. We deliberately do NOT `pvscan --cache` first: with a duplicate
        // PVID present (concurrent restore of the same VM) it fails, and vgimportclone reads the
        // device directly (scoped by mapperConfig) without needing the online cache anyway.
        ;[originalVgName] = (await pvs('vg_name', '--config', mapperConfig, mapperPath).catch(() => [])).filter(Boolean)

        // Deterministic VG name: same hash for the same disk+partition across list and mount calls,
        // but unique across different disks — avoids duplicate VG name conflicts without state.
        const vgBase =
          'xo' +
          createHash('sha256')
            .update(devicePath)
            .update(String(partition?.id ?? ''))
            .digest('hex')
            .slice(0, 10)
        debug('import LVM volume group with unique name via dm-snapshot', { vgBase, originalVgName })
        await fromCallback(execFile, 'vgimportclone', ['--config', mapperConfig, '--basevgname', vgBase, mapperPath])

        effectivePath = mapperPath
      } catch (error) {
        // dm-snapshot or vgimportclone unavailable — fall back to direct loop device.
        // Duplicate VG names across disks may still cause activation failures.
        const message = String(error.message ?? '')
        if (error.code === 5 && message.includes('device is partitioned')) {
          debug('device is partitioned, skipping vgimportclone', { devicePath, partition })
        } else if (error.code === 5) {
          // Other LVM exit-5 errors (e.g. "No physical volume found", "Failed to find PVID")
          debug('vgimportclone failed, falling back to direct loop device', {
            devicePath,
            partition,
            message,
          })
        } else {
          warn('dm-snapshot overlay failed, falling back to direct loop device', { error })
        }
        if (mapperName !== undefined) {
          await fromCallback(execFile, 'dmsetup', ['remove', mapperName]).catch(noop)
          mapperName = undefined
        }
        if (cowLoop !== undefined) {
          await fromCallback(execFile, 'losetup', ['-d', cowLoop]).catch(noop)
          cowLoop = undefined
        }
        if (cowPath !== undefined) {
          await unlink(cowPath).catch(noop)
          cowPath = undefined
        }
        originalVgName = undefined
        effectivePath = loopDevice
      }

      // Whether we ended up on the snapshot or fell back to the raw loop, scope every
      // remaining command to that one device so duplicate PVIDs from other copies (or a
      // same-named VG on the host) can't shadow it.
      lvmConfig = lvmOnlyDevice(effectivePath)

      // Best-effort: activation/listing below scans the device directly via lvmConfig, so a
      // duplicate-PVID failure here (concurrent restore of the same VM) must not abort.
      debug('scan LVM physical volumes', { path: effectivePath })
      await fromCallback(execFile, 'pvscan', ['--config', lvmConfig, '--cache', effectivePath]).catch(error =>
        debug('pvscan --cache failed (continuing)', { path: effectivePath, error })
      )

      // In the fallback path the VG is unmodified, so query the original name now.
      if (originalVgName === undefined) {
        ;[originalVgName] = (await pvs('vg_name', '--config', lvmConfig, effectivePath).catch(() => [])).filter(Boolean)
      }

      yield { path: effectivePath, originalVgName, lvmConfig }
    } finally {
      try {
        const vgNames = (await pvs('vg_name', '--config', lvmConfig, effectivePath).catch(() => [])).filter(Boolean)
        if (vgNames.length > 0) {
          debug('deactivate LVM volume groups', { vgNames })
          await fromCallback(execFile, 'vgchange', ['--config', lvmConfig, '-an', ...vgNames])
        }
      } finally {
        if (mapperName !== undefined) {
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
        lvItems.forEach(lv => {
          const lvName = lv.lv_name
          if (lvName !== '') {
            results.push({
              id: `${partitionId}/${lv.vg_name}/${lvName}`,
              // show "ubuntu-vg/ubuntu-lv" so users can identify the volume group
              name: originalVgName !== undefined ? `${originalVgName}/${lvName}` : lvName,
              size: lv.lv_size,
            })
          }
        })
        return results
      }
    )
  },

  fetchPartitionFiles(diskId, partitionId, paths, format) {
    const { promise, reject, resolve } = pDefer()
    Disposable.use(
      async function* () {
        const path = yield this.getPartition(diskId, partitionId)
        let outputStream

        // debug: bytes actually transmitted to the client (compressed wire bytes).
        // Unlike fuse-vhd's fuseBytes (skewed by kernel_cache), this is comparable
        // across configs. Logged every 5s so it can be read at any cut-off point.
        const transmitted = { size: 0 }
        const startedAt = Date.now()
        const report = setInterval(() => {
          const seconds = (Date.now() - startedAt) / 1000
          info('partition files transmitted', {
            format,
            transmittedMiB: +(transmitted.size / 1048576).toFixed(1),
            seconds: +seconds.toFixed(1),
            mibPerSec: +(transmitted.size / 1048576 / seconds).toFixed(1),
          })
        }, 60e3)
        report.unref()

        try {
          if (format === 'tgz') {
            // jobs: 1 — process one entry at a time. node-tar defaults to 4
            // concurrent jobs, which on a FUSE-backed restore mount means up to 4
            // simultaneous reads; those saturate the libuv threadpool and starve
            // the underlying vhd/CIFS reads NTFS-3g depends on (FUSE-on-FUSE
            // threadpool deadlock). Serializing keeps a worker free for them.
            outputStream = tar.c({ cwd: path, gzip: true, jobs: 1 }, paths.map(makeRelative))
            watchStreamSize(outputStream, transmitted)
            resolve(outputStream)
          } else if (format === 'zip') {
            const zip = new ZipFile()
            // Resolve with the stream before enumeration so the client can start
            // receiving data immediately — addZipEntries over FUSE/S3 can take
            // minutes for large trees (e.g. node_modules) and would otherwise
            // appear as a freeze with no response sent.
            outputStream = zip.outputStream
            watchStreamSize(outputStream, transmitted)
            resolve(zip.outputStream)
            await addZipEntries(zip, path, '', paths.map(makeRelative))
            zip.end()
          } else {
            throw new Error('unsupported format ' + format)
          }

          // Wait for the stream to finish before releasing the mounted partition.
          // finished() correctly handles 'end', 'close', and 'error' — unlike
          // fromEvent('end') which hangs forever if the stream errors (client
          // disconnect, FUSE read failure), leaking the mount and loop devices.
          await finished(outputStream).catch(noop)
        } finally {
          clearInterval(report)
        }
      }.bind(this)
    ).catch(error => {
      warn(error)
      reject(error)
    })
    return promise
  },

  async *getDisk(diskId) {
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
    return Disposable.use(this.getDisk(diskId), async devicePath => {
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
        if (partition.type === LVM_PARTITION_TYPE_MBR || partition.type === LVM_PARTITION_TYPE_GPT) {
          return this._listLvmLogicalVolumes(devicePath, partition, results)
        }

        // Some Linux installers (e.g. Ubuntu subiquity) mark LVM PV partitions with a
        // generic Linux-data type instead of the standard LVM type. Only those need the
        // (expensive) loop + dm-snapshot + vgimportclone probe; other types — BIOS boot,
        // EFI, swap, … — are never LVM PVs, so mount them directly as regular partitions.
        const isProbeableForLvm =
          partition.type === LINUX_DATA_PARTITION_TYPE_MBR || partition.type === LINUX_DATA_PARTITION_TYPE_GPT
        if (!isProbeableForLvm) {
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
