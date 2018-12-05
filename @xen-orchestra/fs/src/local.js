import fs from 'fs-extra'
import { dirname } from 'path'
import { noop } from 'lodash'

import RemoteHandlerAbstract from './abstract'

export default class LocalHandler extends RemoteHandlerAbstract {
  get type() {
    return 'file'
  }

  _getRealPath() {
    return this._remote.path
  }

  _getFilePath(file) {
    return this._getRealPath() + file
  }

  async _closeFile(fd) {
    return fs.close(fd)
  }

  async _createOutputStream(file, options) {
    if (typeof file === 'string') {
      const path = this._getFilePath(file)
      await fs.ensureDir(dirname(path))
      return fs.createWriteStream(path, options)
    }
    return fs.createWriteStream('', {
      autoClose: false,
      ...options,
      fd: file.fd,
    })
  }

  async _createReadStream(file, options) {
    return typeof file === 'string'
      ? fs.createReadStream(this._getFilePath(file), options)
      : fs.createReadStream('', {
          autoClose: false,
          ...options,
          fd: file.fd,
        })
  }

  async _forget() {
    return noop()
  }

  async _getSize(file) {
    const stats = await fs.stat(
      this._getFilePath(typeof file === 'string' ? file : file.path)
    )
    return stats.size
  }

  async _list(dir = '.') {
    return fs.readdir(this._getFilePath(dir))
  }

  async _openFile(path, flags) {
    return fs.open(this._getFilePath(path), flags)
  }

  async _outputFile(file, data, { flags }) {
    const path = this._getFilePath(file)
    await fs.ensureDir(dirname(path))
    await fs.writeFile(path, data, { flag: flags })
  }

  async _read(file, buffer, position) {
    const needsClose = typeof file === 'string'
    file = needsClose ? await fs.open(this._getFilePath(file), 'r') : file.fd
    try {
      return await fs.read(
        file,
        buffer,
        0,
        buffer.length,
        position === undefined ? null : position
      )
    } finally {
      if (needsClose) {
        await fs.close(file)
      }
    }
  }

  async _readFile(file, options) {
    return fs.readFile(this._getFilePath(file), options)
  }

  async _rename(oldPath, newPath) {
    return fs.rename(this._getFilePath(oldPath), this._getFilePath(newPath))
  }

  async _rmdir(dir) {
    return fs.rmdir(this._getFilePath(dir))
  }

  async _sync() {
    const path = this._getRealPath()
    await fs.ensureDir(path)
    await fs.access(path, fs.R_OK | fs.W_OK)

    return this._remote
  }

  async _unlink(file) {
    return fs.unlink(this._getFilePath(file)).catch(error => {
      // do not throw if the file did not exist
      if (error == null || error.code !== 'ENOENT') {
        throw error
      }
    })
  }
}
