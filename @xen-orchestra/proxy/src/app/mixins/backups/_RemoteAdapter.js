import asyncMapSettled from '@xen-orchestra/async-map'
import Disposable from 'promise-toolbox/Disposable'
import fromCallback from 'promise-toolbox/fromCallback'
import pump from 'pump'
import using from 'promise-toolbox/using'
import Vhd, { createSyntheticStream, mergeVhd } from 'vhd-lib'
import { basename, dirname, join, normalize, resolve } from 'path'
import { createLogger } from '@xen-orchestra/log'
import { decorateWith } from '@vates/decorate-with'
import { execFile } from 'child_process'
import { parseDuration } from '@vates/parse-duration'
import { readdir, stat } from 'fs-extra'

import { debounceResource } from '../../_debounceResource'
import { decorateResult } from '../../_decorateResult'
import { deduped } from '../../_deduped'

import { asyncMap } from '../../../_asyncMap'

import { BACKUP_DIR } from './_getVmBackupDir'
import { listPartitions, LVM_PARTITION_TYPE } from './_listPartitions'
import { lvs, pvs } from './_lvm'

const { warn } = createLogger('xo:proxy:backups:RemoteAdapter')

const compareTimestamp = (a, b) => a.timestamp - b.timestamp

const isMetadataFile = filename => filename.endsWith('.json')
const isVhdFile = filename => filename.endsWith('.vhd')

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

function getDebouncedResource(resource) {
  return debounceResource(resource, this._app.hooks, parseDuration(this._config.resourceDebounce))
}

export class RemoteAdapter {
  constructor(handler, { app, config }) {
    this._app = app
    this._config = config
    this._handler = handler
  }

  get handler() {
    return this._handler
  }

  async _deleteVhd(path) {
    const handler = this._handler
    const vhds = await asyncMapSettled(
      await handler.list(dirname(path), {
        filter: isVhdFile,
        prependDir: true,
      }),
      async path => {
        try {
          const vhd = new Vhd(handler, path)
          await vhd.readHeaderAndFooter()
          return {
            footer: vhd.footer,
            header: vhd.header,
            path,
          }
        } catch (error) {
          // Do not fail on corrupted VHDs (usually uncleaned temporary files),
          // they are probably inconsequent to the backup process and should not
          // fail it.
          warn(`BackupNg#_deleteVhd ${path}`, { error })
        }
      }
    )
    const base = basename(path)
    const child = vhds.find(_ => _ !== undefined && _.header.parentUnicodeName === base)
    if (child === undefined) {
      await handler.unlink(path)
      return 0
    }

    try {
      const childPath = child.path
      const mergedDataSize = await mergeVhd(handler, path, handler, childPath)
      await handler.rename(path, childPath)
      return mergedDataSize
    } catch (error) {
      handler.unlink(path).catch(warn)
      throw error
    }
  }

  async _findPartition(devicePath, partitionId) {
    const partitions = await listPartitions(devicePath)
    const partition = partitions.find(_ => _.id === partitionId)
    if (partition === undefined) {
      throw new Error(`partition ${partitionId} not found`)
    }
    return partition
  }

  @decorateResult(getDebouncedResource)
  @decorateWith(deduped, (devicePath, pvId, vgName) => [devicePath, pvId, vgName])
  @decorateWith(Disposable.factory)
  async *_getLvmLogicalVolumes(devicePath, pvId, vgName) {
    yield this._getLvmPhysicalVolume(devicePath, pvId && (await this._findPartition(devicePath, pvId)))

    await fromCallback(execFile, 'vgchange', ['-ay', vgName])
    try {
      yield lvs(['lv_name', 'lv_path'], vgName)
    } finally {
      await fromCallback(execFile, 'vgchange', ['-an', vgName])
    }
  }

  @decorateResult(getDebouncedResource)
  @decorateWith(deduped, (devicePath, partition) => [devicePath, partition?.id])
  @decorateWith(Disposable.factory)
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

  @decorateResult(getDebouncedResource)
  @decorateWith(deduped, (devicePath, partition) => [devicePath, partition?.id])
  @decorateWith(Disposable.factory)
  async *_getPartition(devicePath, partition) {
    const options = ['loop', 'ro']

    if (partition !== undefined) {
      const { size, start } = partition
      options.push(`sizelimit=${size}`)
      if (start !== undefined) {
        options.push(`offset=${start * 512}`)
      }
    }

    const path = yield this._app.remotes.getTempMountDir()
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
    return using(this._getLvmPhysicalVolume(devicePath, partition), async path => {
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

  @decorateWith(Disposable.factory)
  async *usePartitionFiles(diskId, partitionId, paths) {
    const path = yield this.getPartition(diskId, partitionId)

    const files = []
    await asyncMap(paths, file =>
      addDirectory(files, resolveSubpath(path, file), normalize('./' + file).replace(/\/+$/, ''))
    )

    return files
  }

  async deleteDeltaVmBackups(backups) {
    const handler = this._handler
    let mergedDataSize = 0
    await asyncMapSettled(backups, ({ _filename, vhds }) =>
      Promise.all([
        handler.unlink(_filename),
        asyncMap(Object.values(vhds), async _ => {
          mergedDataSize += await this._deleteVhd(resolveRelativeFromFile(_filename, _))
        }),
      ])
    )
    return mergedDataSize
  }

  async deleteFullVmBackups(backups) {
    const handler = this._handler
    await asyncMapSettled(backups, ({ _filename, xva }) =>
      Promise.all([handler.unlink(_filename), handler.unlink(resolveRelativeFromFile(_filename, xva))])
    )
  }

  async deleteVmBackup(filename) {
    const metadata = JSON.parse(String(await this._handler.readFile(filename)))
    metadata._filename = filename

    if (metadata.mode === 'delta') {
      await this.deleteDeltaVmBackups([metadata])
    } else if (metadata.mode === 'full') {
      await this.deleteFullVmBackups([metadata])
    } else {
      throw new Error(`no deleter for backup mode ${metadata.mode}`)
    }
  }

  @decorateResult(getDebouncedResource)
  @decorateWith(deduped, diskId => [diskId])
  @decorateWith(Disposable.factory)
  async *getDisk(diskId) {
    const handler = this._handler

    const diskPath = handler._getFilePath('/' + diskId)
    const mountDir = yield this._app.remotes.getTempMountDir()
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
  @decorateWith(Disposable.factory)
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

  async listAllVmBackups() {
    const handler = this._handler

    const backups = { __proto__: null }
    await asyncMap(await handler.list(BACKUP_DIR), async vmUuid => {
      const vmBackups = await this.listVmBackups(vmUuid)
      backups[vmUuid] = vmBackups
    })

    return backups
  }

  listPartitionFiles(diskId, partitionId, path) {
    return using(this.getPartition(diskId, partitionId), async rootPath => {
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
    return using(this.getDisk(diskId), async devicePath => {
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

  async listVmBackups(vmUuid, predicate) {
    const handler = this._handler
    const backups = []

    try {
      const files = (
        await handler.list(`${BACKUP_DIR}/${vmUuid}`, {
          filter: isMetadataFile,
          prependDir: true,
        })
      ).sort()

      const chainSizeByVdi = {}
      for (const file of files) {
        try {
          const metadata = await this.readVmBackupMetadata(file)
          if (predicate === undefined || predicate(metadata)) {
            // inject an id usable by importVmBackupNg()
            metadata.id = metadata._filename

            // a backup size is a sum of all its VHDs' size
            // a VHD size is a sum of all the VHDs' chain size
            if (metadata.mode === 'delta') {
              for (const vhdRef in metadata.vdis) {
                const vdiUuid = metadata.vdis[vhdRef].$snapshot_of$uuid
                const vhdPath = metadata.vhds[vhdRef]

                if (chainSizeByVdi[vdiUuid] === undefined) {
                  chainSizeByVdi[vdiUuid] = 0
                }
                if (metadata.size === undefined) {
                  metadata.size = 0
                }

                metadata.size += chainSizeByVdi[vdiUuid] += await handler.getSize(`${BACKUP_DIR}/${vmUuid}/${vhdPath}`)
              }
            }

            backups.push(metadata)
          }
        } catch (error) {
          warn(`listVmBackups ${file}`, { error })
        }
      }
    } catch (error) {
      let code
      if (error == null || ((code = error.code) !== 'ENOENT' && code !== 'ENOTDIR')) {
        throw error
      }
    }

    return backups.sort(compareTimestamp)
  }

  async outputStream(input, path, { checksum = true, validator = noop } = {}) {
    const handler = this._handler
    input = await input
    const tmpPath = `${dirname(path)}/.${basename(path)}`
    const output = await handler.createOutputStream(tmpPath, { checksum, dirMode: this._config.backups.dirMode })
    try {
      await Promise.all([fromCallback(pump, input, output), output.checksumWritten, input.task])
      await validator(tmpPath)
      await handler.rename(tmpPath, path, { checksum })
    } catch (error) {
      await handler.unlink(tmpPath, { checksum })
      throw error
    }
  }

  async readDeltaVmBackup(metadata) {
    const handler = this._handler
    const { vbds, vdis, vhds, vifs, vm } = metadata
    const dir = dirname(metadata._filename)

    const streams = {}
    await asyncMapSettled(vdis, async (vdi, id) => {
      streams[`${id}.vhd`] = await createSyntheticStream(handler, join(dir, vhds[id]))
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
