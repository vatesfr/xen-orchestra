import fs from 'fs-extra'
import { dirname, resolve } from 'path'
import { noop, startsWith } from 'lodash'

import RemoteHandlerAbstract from './abstract'

export default class LocalHandler extends RemoteHandlerAbstract {
  get type () {
    return 'file'
  }

  _getRealPath () {
    return this._remote.path
  }

  _getFilePath (file) {
    const realPath = this._getRealPath()
    const parts = [realPath]
    if (file) {
      parts.push(file)
    }
    const path = resolve.apply(null, parts)
    if (!startsWith(path, realPath)) {
      throw new Error('Remote path is unavailable')
    }
    return path
  }

  async _sync () {
    if (this._remote.enabled) {
      try {
        const path = this._getRealPath()
        await fs.ensureDir(path)
        await fs.access(path, fs.R_OK | fs.W_OK)
      } catch (exc) {
        this._remote.enabled = false
        this._remote.error = exc.message
      }
    }
    return this._remote
  }

  async _forget () {
    return noop()
  }

  async _outputFile (file, data, options) {
    const path = this._getFilePath(file)
    await fs.ensureDir(dirname(path))
    await fs.writeFile(path, data, options)
  }

  async _readFile (file, options) {
    return fs.readFile(this._getFilePath(file), options)
  }

  async _rename (oldPath, newPath) {
    return fs.rename(this._getFilePath(oldPath), this._getFilePath(newPath))
  }

  async _list (dir = '.') {
    return fs.readdir(this._getFilePath(dir))
  }

  async _createReadStream (file, options) {
    return fs.createReadStream(this._getFilePath(file), options)
  }

  async _createOutputStream (file, options) {
    const path = this._getFilePath(file)
    await fs.ensureDir(dirname(path))
    return fs.createWriteStream(path, options)
  }

  async _unlink (file) {
    return fs.unlink(this._getFilePath(file)).catch(error => {
      // do not throw if the file did not exist
      if (error == null || error.code !== 'ENOENT') {
        throw error
      }
    })
  }

  async _getSize (file) {
    const stats = await fs.stat(this._getFilePath(file))
    return stats.size
  }
}
