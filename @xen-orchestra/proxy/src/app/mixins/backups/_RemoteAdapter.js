import asyncMap from '@xen-orchestra/async-map'
import fromCallback from 'promise-toolbox/fromCallback'
import pump from 'pump'
import { basename, dirname, resolve } from 'path'
import { createLogger } from '@xen-orchestra/log'

import { BACKUP_DIR } from './_getVmBackupDir'

const { warn } = createLogger('xo:proxy:backups:RemoteAdapter')

const compareTimestamp = (a, b) => a.timestamp - b.timestamp

const isMetadataFile = filename => filename.endsWith('.json')

const noop = Function.prototype

const resolveRelativeFromFile = (file, path) =>
  resolve('/', dirname(file), path).slice(1)

export class RemoteAdapter {
  constructor(handler) {
    this._handler = handler
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
      (await handler.list(BACKUP_DIR, { prependDir: true })).map(async dir => {
        const vmBackups = await this.listVmBackups(dir)
        backups[vmBackups[0].vm.uuid] = vmBackups
      })
    )
    return backups
  }

  async listVmBackups(backupDir, predicate) {
    const handler = this._handler
    const backups = []

    try {
      const files = await handler.list(backupDir)
      await Promise.all(
        files.filter(isMetadataFile).map(async file => {
          const path = `${backupDir}/${file}`
          try {
            const metadata = JSON.parse(String(await handler.readFile(path)))
            // if (metadata.mode === 'full') {
            //   metadata.size = await timeout
            //     .call(
            //       handler.getSize(resolveRelativeFromFile(path, metadata.xva)),
            //       parseDuration(this._backupOptions.vmBackupSizeTimeout)
            //     )
            //     .catch(err => {
            //       warn(`listVmBackups, getSize`, { err })
            //     })
            // }
            if (predicate === undefined || predicate(metadata)) {
              Object.defineProperty(metadata, '_filename', {
                value: path,
              })
              backups.push(metadata)
            }
          } catch (error) {
            warn(`listVmBackups ${path}`, { error })
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
}
