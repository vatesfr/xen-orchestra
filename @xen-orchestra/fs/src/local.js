import assert from 'node:assert/strict'
import fromCallback from 'promise-toolbox/fromCallback'
import fs from 'fs-extra'
import lockfile from 'proper-lockfile'
import { createLogger } from '@xen-orchestra/log'
import { execFile } from 'node:child_process'
import { fromEvent, retry } from 'promise-toolbox'
import { normalize as normalizePath } from './path'

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
    super(remote, opts)

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

  async _tree(dir) {
    const dirPath = this.getFilePath(dir)
    
    const stdout = await fromCallback(
        execFile,
        'tree',
        ['-JifF', dirPath]
      )
    const result = JSON.parse(stdout)
    const entries = []
    const basePath = this.getFilePath('/')
    
    // Recursive function to traverse the tree structure
    const traverse = (items) => {
      for (const item of items) {
        if (!item.name) continue
        
        // Remove the base path prefix to get relative path
        let relativePath = normalizePath(item.name)
        if (relativePath.startsWith(dirPath)) {
          relativePath = relativePath.slice(dirPath.length)
        } else if (relativePath.startsWith(basePath)) {
          relativePath = relativePath.slice(basePath.length)
        }
        if (!relativePath.startsWith('/')) {
          relativePath = '/' + relativePath
        }
        entries.push(relativePath)

        if (item.contents && Array.isArray(item.contents)) {
          traverse(item.contents)
        }
      }
    }

    if (result && Array.isArray(result)) {
      traverse(result[0].contents ?? [])
    }
    
    return entries
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
    const fd = needsClose ? await this.#addSyncStackTrace(fs.open, this.getFilePath(file), 'r') : file.fd
    try {
      const { bytesRead } = await this.#addSyncStackTrace(
        fs.read,
        fd,
        buffer,
        0,
        buffer.length,
        position === undefined ? null : position
      )

      // sometimes it won't fail if it can't read the data
      // and will return a partial buffer
      // let's read the missing data to force it to really succeed or completely fail
      if (bytesRead < buffer.length) {
        warn(`read was incomplete at first, expecting ${buffer.length} from ${position} got ${bytesRead}`)
        // additionalBuffer is a view on the end of buffer
        const additionalBuffer = buffer.slice(bytesRead)
        // ensure we don't fall into an infinite loop
        assert(
          bytesRead > 0,
          `couldn't read any data from file ${JSON.stringify(file)} (asked for ${buffer.length} bytes}`
        )
        await this._read(file, additionalBuffer, position + bytesRead)
        // this code should not be used, since the real error should pop from the read, either a read after the end or a EIO
        // but if the error was transient, let's accept the result
        warn(`read was incomplete at first, need to read the last ${additionalBuffer.length} bytes from ${position}`)
      }
      return { buffer, bytesRead: buffer.length }
    } finally {
      if (needsClose) {
        await this.#addSyncStackTrace(fs.close, fd)
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
}
