import fs from 'fs-promise'
import RemoteHandlerAbstract from './abstract'
import startsWith from 'lodash.startswith'
import {noop} from '../utils'
import {resolve} from 'path'

export default class LocalHandler extends RemoteHandlerAbstract {
  _getFilePath (file) {
    const parts = [this._remote.path]
    if (file) {
      parts.push(file)
    }
    const path = resolve.apply(null, parts)
    if (!startsWith(path, this._remote.path)) {
      throw new Error('Remote path is unavailable')
    }
    return path
  }

  async _sync () {
    if (this._remote.enabled) {
      try {
        await fs.ensureDir(this._remote.path)
        await fs.access(this._remote.path, fs.R_OK | fs.W_OK)
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
    await fs.outputFile(this._getFilePath(file), data, options)
  }

  async _readFile (file, options) {
    return await fs.readFile(this._getFilePath(file), options)
  }

  async _rename (oldPath, newPath) {
    return await fs.rename(this._getFilePath(oldPath), this._getFilePath(newPath))
  }

  async _list (dir = '.') {
    return await fs.readdir(this._getFilePath(dir))
  }

  async _createReadStream (file, options) {
    return await fs.createReadStream(this._getFilePath(file), options)
  }

  async _createOutputStream (file, options) {
    return await fs.createOutputStream(this._getFilePath(file), options)
  }

  async _unlink (file) {
    return await fs.unlink(this._getFilePath(file))
  }

  async _getSize (file) {
    const stats = await fs.stat(this._getFilePath(file))
    return stats.size
  }

}
