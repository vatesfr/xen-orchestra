import df from '@sindresorhus/df'
import fs from 'fs-extra'
import lockfile from 'proper-lockfile'
import { createLogger } from '@xen-orchestra/log'
import { fromEvent, retry } from 'promise-toolbox'

import RemoteHandlerAbstract from './abstract'

const { info, warn } = createLogger('xo:fs:local')

// save current stack trace and add it to any rejected error
//
// This is especially useful when the resolution is separate from the initial
// call, which is often the case with RPC libs.
//
// There is a perf impact and it should be avoided in production.
async function addSyncStackTrace(fn, ...args) {
  const stackContainer = new Error()
  try {
    return await fn.apply(this, args)
  } catch (error) {
    let { stack } = stackContainer

    // remove first line which does not contain stack information, simply `Error`
    stack = stack.slice(stack.indexOf('\n') + 1)

    error.stack = [error.stack, 'From:', stack].join('\n')
    throw error
  }
}

function dontAddSyncStackTrace(fn, ...args) {
  return fn.apply(this, args)
}

export default class LocalHandler extends RemoteHandlerAbstract {
  constructor(remote, opts = {}) {
    super(remote)

    this._addSyncStackTrace = opts.syncStackTraces ?? true ? addSyncStackTrace : dontAddSyncStackTrace
    this._retriesOnEagain = {
      delay: 1e3,
      retries: 9,
      ...opts.retriesOnEagain,
      when: {
        code: 'EAGAIN',
      },
    }
  }
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
    return this._addSyncStackTrace(fs.close, fd)
  }

  async _copy(oldPath, newPath) {
    return this._addSyncStackTrace(fs.copy, this._getFilePath(oldPath), this._getFilePath(newPath))
  }

  async _createReadStream(file, options) {
    if (typeof file === 'string') {
      const stream = fs.createReadStream(this._getFilePath(file), options)
      await this._addSyncStackTrace(fromEvent, stream, 'open')
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
      await this._addSyncStackTrace(fromEvent, stream, 'open')
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
    const stats = await this._addSyncStackTrace(fs.stat, this._getFilePath(typeof file === 'string' ? file : file.path))
    return stats.size
  }

  async _list(dir) {
    return this._addSyncStackTrace(fs.readdir, this._getFilePath(dir))
  }

  async _lock(path) {
    const acquire = lockfile.lock.bind(undefined, this._getFilePath(path), {
      async onCompromised(error) {
        warn('lock compromised', { error })
        try {
          release = await acquire()
          info('compromised lock was reacquired')
        } catch (error) {
          warn('compromised lock could not be reacquired', { error })
        }
      },
    })

    let release = await this._addSyncStackTrace(acquire)

    return async () => {
      try {
        await this._addSyncStackTrace(release)
      } catch (error) {
        warn('lock could not be released', { error })
      }
    }
  }

  _mkdir(dir, { mode }) {
    return this._addSyncStackTrace(fs.mkdir, this._getFilePath(dir), { mode })
  }

  async _openFile(path, flags) {
    return this._addSyncStackTrace(fs.open, this._getFilePath(path), flags)
  }

  async _read(file, buffer, position) {
    const needsClose = typeof file === 'string'
    file = needsClose ? await this._addSyncStackTrace(fs.open, this._getFilePath(file), 'r') : file.fd
    try {
      return await this._addSyncStackTrace(
        fs.read,
        file,
        buffer,
        0,
        buffer.length,
        position === undefined ? null : position
      )
    } finally {
      if (needsClose) {
        await this._addSyncStackTrace(fs.close, file)
      }
    }
  }

  async _readFile(file, options) {
    const filePath = this._getFilePath(file)
    return await this._addSyncStackTrace(retry, () => fs.readFile(filePath, options), this._retriesOnEagain)
  }

  async _rename(oldPath, newPath) {
    return this._addSyncStackTrace(fs.rename, this._getFilePath(oldPath), this._getFilePath(newPath))
  }

  async _rmdir(dir) {
    return this._addSyncStackTrace(fs.rmdir, this._getFilePath(dir))
  }

  async _sync() {
    const path = this._getRealPath('/')
    await this._addSyncStackTrace(fs.ensureDir, path)
    await this._addSyncStackTrace(fs.access, path, fs.R_OK | fs.W_OK)
  }

  _truncate(file, len) {
    return this._addSyncStackTrace(fs.truncate, this._getFilePath(file), len)
  }

  async _unlink(file) {
    const filePath = this._getFilePath(file)
    return await this._addSyncStackTrace(retry, () => fs.unlink(filePath), this._retriesOnEagain)
  }

  _writeFd(file, buffer, position) {
    return this._addSyncStackTrace(fs.write, file.fd, buffer, 0, buffer.length, position)
  }

  _writeFile(file, data, { flags }) {
    return this._addSyncStackTrace(fs.writeFile, this._getFilePath(file), data, { flag: flags })
  }
}
