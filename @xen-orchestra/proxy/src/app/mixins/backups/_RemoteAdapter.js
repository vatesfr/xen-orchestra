import asyncMap from '@xen-orchestra/async-map'
import fromCallback from 'promise-toolbox/fromCallback'
import pump from 'pump'
import Vhd, { createSyntheticStream, mergeVhd } from 'vhd-lib'
import { basename, dirname, resolve } from 'path'
import { createLogger } from '@xen-orchestra/log'
import { getHandler } from '@xen-orchestra/fs/dist'

import { BACKUP_DIR } from './_getVmBackupDir'
import { deduped } from './_deduped'
import { disposable } from './_disposable'

const { warn } = createLogger('xo:proxy:backups:RemoteAdapter')

const compareTimestamp = (a, b) => a.timestamp - b.timestamp

const isMetadataFile = filename => filename.endsWith('.json')
const isVhdFile = filename => filename.endsWith('.vhd')

const noop = Function.prototype

const resolveRelativeFromFile = (file, path) =>
  resolve('/', dirname(file), path).slice(1)

export class RemoteAdapter {
  constructor(handler) {
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
    const child = vhds.find(
      _ => _ !== undefined && _.header.parentUnicodeName === base
    )
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

  async deleteDeltaVmBackups(backups) {
    const handler = this._handler
    let mergedDataSize = 0
    await asyncMap(backups, ({ _filename, vhds }) =>
      Promise.all([
        handler.unlink(_filename),
        Promise.all(
          Object.values(vhds).map(async _ => {
            mergedDataSize += await this._deleteVhd(
              resolveRelativeFromFile(_filename, _)
            )
          })
        ),
      ])
    )
    return mergedDataSize
  }

  async deleteFullVmBackups(backups) {
    const handler = this._handler
    await asyncMap(backups, ({ _filename, xva }) =>
      Promise.all([
        handler.unlink(_filename),
        handler.unlink(resolveRelativeFromFile(_filename, xva)),
      ])
    )
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
      if (
        error == null ||
        ((code = error.code) !== 'ENOENT' && code !== 'ENOTDIR')
      ) {
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
      await Promise.all([
        fromCallback(pump, input, output),
        output.checksumWritten,
        input.task,
      ])
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
      streams[`${id}.vhd`] = await createSyntheticStream(
        handler,
        resolve(dir, vhds[id])
      )
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
    return this._handler.createReadStream(
      resolve('/', dirname(metadata._filename), metadata.xva)
    )
  }

  async readVmBackupMetadata(path) {
    return Object.defineProperty(
      JSON.parse(await this._handler.readFile(path)),
      '_filename',
      { value: path }
    )
  }
}

export const getRemoteHandler = deduped(
  disposable(async function* (remote, config, options) {
    const handler = getHandler(remote, options)
    await handler.sync()
    try {
      yield handler
    } finally {
      await handler.forget()
    }
  }),
  remote => [remote.url],
  (_, config) => config.resourceDebounce
)

export const getRemoteAdapter = deduped(
  disposable(function* (remote, config) {
    return new RemoteAdapter(yield getRemoteHandler(remote, config))
  }),
  remote => [remote.url],
  (_, config) => config.resourceDebounce
)
