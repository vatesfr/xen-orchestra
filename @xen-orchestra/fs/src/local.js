import df from '@sindresorhus/df'
import fs from 'fs-extra'
import { fromEvent } from 'promise-toolbox'

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

  async _createReadStream(file, options) {
    if (typeof file === 'string') {
      const stream = fs.createReadStream(this._getFilePath(file), options)
      await fromEvent(stream, 'open')
      return stream
    }
    return fs.createReadStream('', {
      autoClose: false,
      ...options,
      fd: file.fd,
    })
  }

  async _createWriteStream(file, options) {
    if (typeof file === 'string') {
      const stream = fs.createWriteStream(this._getFilePath(file), options)
      await fromEvent(stream, 'open')
      return stream
    }
    return fs.createWriteStream('', {
      autoClose: false,
      ...options,
      fd: file.fd,
    })
  }

  async _getInfo() {
    // df.file() resolves with an object with the following properties:
    // filesystem, type, size, used, available, capacity and mountpoint.
    // size, used, available and capacity may be `NaN` so we remove any `NaN`
    // value from the object.
    const info = await df.file(this._getFilePath('/'))
    Object.keys(info).forEach(key => {
      if (Number.isNaN(info[key])) {
        delete info[key]
      }
    })

    return info
  }

  async _getSize(file) {
    const stats = await fs.stat(this._getFilePath(typeof file === 'string' ? file : file.path))
    return stats.size
  }

  async _list(dir) {
    return fs.readdir(this._getFilePath(dir))
  }

  _mkdir(dir, { mode }) {
    return fs.mkdir(this._getFilePath(dir), { mode })
  }

  async _openFile(path, flags) {
    return fs.open(this._getFilePath(path), flags)
  }

  async _read(file, buffer, position) {
    const needsClose = typeof file === 'string'
    file = needsClose ? await fs.open(this._getFilePath(file), 'r') : file.fd
    try {
      return await fs.read(file, buffer, 0, buffer.length, position === undefined ? null : position)
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
    const path = this._getRealPath('/')
    await fs.ensureDir(path)
    await fs.access(path, fs.R_OK | fs.W_OK)
  }

  _truncate(file, len) {
    return fs.truncate(this._getFilePath(file), len)
  }

  async _unlink(file) {
    return fs.unlink(this._getFilePath(file))
  }

  _writeFd(file, buffer, position) {
    return fs.write(file.fd, buffer, 0, buffer.length, position)
  }

  _writeFile(file, data, { flags }) {
    return fs.writeFile(this._getFilePath(file), data, { flag: flags })
  }
}
