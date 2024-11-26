import assert from 'node:assert/strict'
import fromCallback from 'promise-toolbox/fromCallback'
import fs from 'fs-extra'
import lockfile from 'proper-lockfile'
import { createLogger } from '@xen-orchestra/log'
import { execFile } from 'node:child_process'
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

// $filesystem $size $used $available_bytes $capacity $mountpoint
const DF_RE = /^(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d{1,3})%\s+(.+)$/

async function df(path) {
  const stdout = await fromCallback(execFile, 'df', ['-kP', path])
  const lines = stdout.trim().split('\n')
  assert.equal(lines.length, 2) // headers + first line
  const matches = DF_RE.exec(lines[1])
  assert.notEqual(matches, null)
  return {
    size: Number(matches[2]) * 1024,
    used: Number(matches[3]) * 1024,
    available: Number(matches[4]) * 1024,
  }
}

function dontAddSyncStackTrace(fn, ...args) {
  return fn.apply(this, args)
}

export default class LocalHandler extends RemoteHandlerAbstract {
  #addSyncStackTrace
  #retriesOnEagain

  constructor(remote, opts = {}) {
    super(remote)

    this.#addSyncStackTrace = (opts.syncStackTraces ?? true) ? addSyncStackTrace : dontAddSyncStackTrace
    this.#retriesOnEagain = {
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

  getRealPath() {
    return this._remote.path
  }

  getFilePath(file) {
    return this.getRealPath() + file
  }

  async _closeFile(fd) {
    return this.#addSyncStackTrace(fs.close, fd)
  }

  async _copy(oldPath, newPath) {
    return this.#addSyncStackTrace(fs.copy, this.getFilePath(oldPath), this.getFilePath(newPath))
  }

  async _createReadStream(file, options) {
    if (typeof file === 'string') {
      const stream = fs.createReadStream(this.getFilePath(file), options)
      await this.#addSyncStackTrace(fromEvent, stream, 'open')
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
      const stream = fs.createWriteStream(this.getFilePath(file), options)
      await this.#addSyncStackTrace(fromEvent, stream, 'open')
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
    const info = await df(this.getFilePath('/'))
    Object.keys(info).forEach(key => {
      if (Number.isNaN(info[key])) {
        delete info[key]
      }
    })

    return info
  }

  async _getSize(file) {
    const stats = await this.#addSyncStackTrace(fs.stat, this.getFilePath(typeof file === 'string' ? file : file.path))
    return stats.size
  }

  async _list(dir) {
    return this.#addSyncStackTrace(fs.readdir, this.getFilePath(dir))
  }

  async _lock(path) {
    const acquire = lockfile.lock.bind(undefined, this.getFilePath(path), {
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

    let release = await this.#addSyncStackTrace(acquire)

    return async () => {
      try {
        await this.#addSyncStackTrace(release)
      } catch (error) {
        warn('lock could not be released', { error })
      }
    }
  }

  _mkdir(dir, { mode }) {
    return this.#addSyncStackTrace(fs.mkdir, this.getFilePath(dir), { mode })
  }

  async _openFile(path, flags) {
    return this.#addSyncStackTrace(fs.open, this.getFilePath(path), flags)
  }

  async _read(file, buffer, position) {
    const needsClose = typeof file === 'string'
    file = needsClose ? await this.#addSyncStackTrace(fs.open, this.getFilePath(file), 'r') : file.fd
    try {
      return await this.#addSyncStackTrace(
        fs.read,
        file,
        buffer,
        0,
        buffer.length,
        position === undefined ? null : position
      )
    } finally {
      if (needsClose) {
        await this.#addSyncStackTrace(fs.close, file)
      }
    }
  }

  async _readFile(file, { flags, ...options } = {}) {
    // contrary to createReadStream, readFile expect singular `flag`
    if (flags !== undefined) {
      options.flag = flags
    }

    const filePath = this.getFilePath(file)
    return await this.#addSyncStackTrace(retry, () => fs.readFile(filePath, options), this.#retriesOnEagain)
  }

  async _rename(oldPath, newPath) {
    return this.#addSyncStackTrace(fs.rename, this.getFilePath(oldPath), this.getFilePath(newPath))
  }

  async _rmdir(dir) {
    return this.#addSyncStackTrace(fs.rmdir, this.getFilePath(dir))
  }

  async _sync() {
    const path = this.getRealPath('/')
    await this.#addSyncStackTrace(fs.ensureDir, path)
    await this.#addSyncStackTrace(fs.access, path, fs.R_OK | fs.W_OK)
  }

  _truncate(file, len) {
    return this.#addSyncStackTrace(fs.truncate, this.getFilePath(file), len)
  }

  async _unlink(file) {
    const filePath = this.getFilePath(file)
    return await this.#addSyncStackTrace(retry, () => fs.unlink(filePath), this.#retriesOnEagain)
  }

  _writeFd(file, buffer, position) {
    return this.#addSyncStackTrace(fs.write, file.fd, buffer, 0, buffer.length, position)
  }

  _writeFile(file, data, { flags }) {
    return this.#addSyncStackTrace(fs.writeFile, this.getFilePath(file), data, { flag: flags })
  }
  _link(from,to){
    // Ensures that the link exists. If the directory structure does not exist, it is created.
    
    return this.#addSyncStackTrace(fs.ensureLink, this.getFilePath(from), this.getFilePath(to))
  }
  
  stat(file){
    return this.#addSyncStackTrace(fs.stat, this.getFilePath(file))
  }
}
