import fs from 'fs-promise'
import RemoteHandlerAbstract from './abstract'
import {dirname} from 'path'
import {noop} from '../utils'

export default class LocalHandler extends RemoteHandlerAbstract {
  constructor (remote) {
    super(remote)
    this.forget = noop
  }

  _getFilePath (file) {
    const parts = [this._remote.path]
    if (file) {
      parts.push(file)
    }
    return parts.join('/')
  }

  async sync () {
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

  async outputFile (file, data, options) {
    const path = this._getFilePath(file)
    await fs.ensureDir(dirname(path))
    await fs.writeFile(path, data, options)
  }

  async readFile (file, options) {
    return await fs.readFile(this._getFilePath(file), options)
  }

  async rename (oldPath, newPath) {
    return await fs.rename(this._getFilePath(oldPath), this._getFilePath(newPath))
  }

  async list (dir = undefined) {
    return await fs.readdir(this._getFilePath(dir))
  }

  async createReadStream (file) {
    return fs.createReadStream(this._getFilePath(file))
  }

  async createOutputStream (file, options) {
    const path = this._getFilePath(file)
    await fs.ensureDir(dirname(path))
    return fs.createWriteStream(path, options)
  }

  async unlink (file) {
    return fs.unlink(this._getFilePath(file))
  }

  async getSize (file) {
    const stats = await fs.stat(this._getFilePath(file))
    return stats.size
  }

}
