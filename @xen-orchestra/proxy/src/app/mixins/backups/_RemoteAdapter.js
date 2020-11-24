import asyncMap from '@xen-orchestra/async-map'
import fromCallback from 'promise-toolbox/fromCallback'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import pump from 'pump'
import using from 'promise-toolbox/using'
import Vhd, { createSyntheticStream, mergeVhd } from 'vhd-lib'
import { basename, dirname, join, normalize, resolve } from 'path'
import { createLogger } from '@xen-orchestra/log'
import { decorateWith } from '@vates/decorate-with'
import { execFile } from 'child_process'
import { parseDuration } from '@vates/parse-duration'
import { readdir, stat } from 'fs-extra'
import { ZipFile } from 'yazl'

import { debounceResource } from '../../_debounceResource'
import { decorateResult } from '../../_decorateResult'
import { deduped } from '../../_deduped'
import { disposable } from '../../_disposable'

import { BACKUP_DIR } from './_getVmBackupDir'
import { listPartitions, LVM_PARTITION_TYPE } from './_listPartitions'

const { warn } = createLogger('xo:proxy:backups:RemoteAdapter')

const compareTimestamp = (a, b) => a.timestamp - b.timestamp

const isMetadataFile = filename => filename.endsWith('.json')
const isVhdFile = filename => filename.endsWith('.vhd')

const noop = Function.prototype

const resolveRelativeFromFile = (file, path) => resolve('/', dirname(file), path).slice(1)

const resolveSubpath = (root, path) => resolve(root, `.${resolve('/', path)}`)

const RE_VHDI = /^vhdi(\d+)$/

async function addDirectory(zip, realPath, metadataPath) {
  try {
    const files = await readdir(realPath)
    await Promise.all(files.map(file => addDirectory(zip, realPath + '/' + file, metadataPath + '/' + file)))
  } catch (error) {
    if (error == null || error.code !== 'ENOTDIR') {
      throw error
    }
    zip.addFile(realPath, metadataPath)
  }
}

function getDebouncedResource(resource) {
  return debounceResource(resource, this._app.hooks, parseDuration(this._config.resourceDebounce))
}

export class RemoteAdapter {
  constructor(handler, { app, config } = {}) {
    this._app = app
    this._config = config
    this._handler = handler
  }

  async _deleteVhd(path) {
    const handler = this._handler
    const vhds = await asyncMap(
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

  async _findPartition(diskId, partitionId) {
    const partitions = await this.listPartitions(diskId)
    const partition = partitions.find(_ => _.id === partitionId)
    if (partition === undefined) {
      throw new Error(`partition ${partitionId} not found`)
    }
    return partition
  }

  async deleteDeltaVmBackups(backups) {
    const handler = this._handler
    let mergedDataSize = 0
    await asyncMap(backups, ({ _filename, vhds }) =>
      Promise.all([
        handler.unlink(_filename),
        Promise.all(
          Object.values(vhds).map(async _ => {
            mergedDataSize += await this._deleteVhd(resolveRelativeFromFile(_filename, _))
          })
        ),
      ])
    )
    return mergedDataSize
  }

  async deleteFullVmBackups(backups) {
    const handler = this._handler
    await asyncMap(backups, ({ _filename, xva }) =>
      Promise.all([handler.unlink(_filename), handler.unlink(resolveRelativeFromFile(_filename, xva))])
    )
  }

  async fetchPartitionFiles(diskId, partitionId, paths) {
    const resource = this.getPartition(diskId, partitionId)
    const path = await resource.p
    try {
      const zip = new ZipFile()
      await Promise.all(
        paths.map(file => addDirectory(zip, resolveSubpath(path, file), normalize('./' + file).replace(/\/+$/, '')))
      )
      zip.end()
      return zip.outputStream.on('end', () => resource.d(path))
    } catch (error) {
      ignoreErrors.call(resource.d(path))
      throw error
    }
  }

  @decorateResult(getDebouncedResource)
  @decorateWith(deduped, diskId => [diskId])
  @decorateWith(disposable)
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

  @decorateResult(getDebouncedResource)
  @decorateWith(deduped, (diskId, partitionId) => [diskId, partitionId])
  @decorateWith(disposable)
  async *getPartition(diskId, partitionId) {
    const devicePath = yield this.getDisk(diskId)

    const options = ['loop', 'ro']
    const { start } = await this._findPartition(diskId, partitionId)
    if (start !== undefined) {
      options.push(`offset=${start * 512}`)
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

  async listAllVmBackups() {
    const handler = this._handler

    const backups = { __proto__: null }
    await Promise.all(
      (await handler.list(BACKUP_DIR)).map(async vmUuid => {
        const vmBackups = await this.listVmBackups(vmUuid)
        backups[vmUuid] = vmBackups
      })
    )
    return backups
  }

  listPartitionFiles(diskId, partitionId, path) {
    return using(this.getPartition(diskId, partitionId), async rootPath => {
      path = resolveSubpath(rootPath, path)

      const entriesMap = {}
      await Promise.all(
        (await readdir(path)).map(async name => {
          try {
            const stats = await stat(`${path}/${name}`)
            entriesMap[stats.isDirectory() ? `${name}/` : name] = {}
          } catch (error) {
            if (error == null || error.code !== 'ENOENT') {
              throw error
            }
          }
        })
      )

      return entriesMap
    })
  }

  listPartitions(diskId) {
    return using(this.getDisk(diskId), async devicePath => {
      const partitions = await listPartitions(devicePath)

      // TODO: support LVM partitions
      return partitions.filter(({ type }) => type !== LVM_PARTITION_TYPE)
    })
  }

  async listVmBackups(vmUuid, predicate) {
    const handler = this._handler
    const backups = []

    try {
      const files = await handler.list(`${BACKUP_DIR}/${vmUuid}`, {
        filter: isMetadataFile,
        prependDir: true,
      })
      await Promise.all(
        files.map(async file => {
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
      )
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
    const output = await handler.createOutputStream(tmpPath, { checksum })
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
    await asyncMap(vdis, async (vdi, id) => {
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
