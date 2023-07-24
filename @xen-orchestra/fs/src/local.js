import assert from 'node:assert/strict'
import fs from 'fs-extra'
// import fsx from 'fs-extended-attributes'
import lockfile from 'proper-lockfile'
import { createLogger } from '@xen-orchestra/log'
import { execFile } from 'node:child_process'
import { asyncEach } from '@vates/async-each'
import { fromEvent, fromCallback, ignoreErrors, retry } from 'promise-toolbox'
import { synchronized } from 'decorator-synchronized'
 
import RemoteHandlerAbstract from './abstract'
import { normalize as normalizePath } from './path'

import { createHash, randomBytes } from 'node:crypto'

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

  #supportDedup
  #dedupDirectory = '/xo-block-store'
  #hashMethod = 'sha256'
  #attributeKey = `user.hash.${this.#hashMethod}`
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

  async #localUnlink(filePath) {
    return await this.#addSyncStackTrace(retry, () => fs.unlink(filePath), this.#retriesOnEagain)
  }
  async _unlink(file, { dedup } = {}) {
    const filePath = this.getFilePath(file)
    let hash
    // only try to read dedup source if we try to delete something deduplicated
    if (dedup === true) {
      try {
        // get hash before deleting the file
        hash = await this.#getExtendedAttribute(file, this.#attributeKey)
      } catch (err) {
        // whatever : fall back to normal delete
      }
    }

    // delete file in place
    await this.#localUnlink(filePath)

    // implies we are on a deduplicated file
    if (hash !== undefined) {
      const dedupPath = this.getFilePath(this.#computeDeduplicationPath(hash))
      await this.#removeExtendedAttribute(file, this.#attributeKey)
      try {
        const { nlink } = await fs.stat(dedupPath)
        // get the number of copy still using these data
        // delete source if it's alone
        if (nlink === 1) {
          await this.#localUnlink(dedupPath)
        }
      } catch (error) {
        // no problem if another process deleted the source or if we unlink directly the source file
        if (error.code !== 'ENOENT') {
          throw error
        }
      }
    }
  }

  _writeFd(file, buffer, position) {
    return this.#addSyncStackTrace(fs.write, file.fd, buffer, 0, buffer.length, position)
  }

  #localWriteFile(file, data, { flags }) {
    return this.#addSyncStackTrace(fs.writeFile, this.getFilePath(file), data, { flag: flags })
  }

  async _writeFile(file, data, { flags, dedup }) {
    if (dedup === true) {
      // only compute support once , and only if needed
      if (this.#supportDedup === undefined) {
        const supported = await this.checkSupport()
        this.#supportDedup = supported.hardLink === true && supported.extendedAttributes === true
      }
      if (this.#supportDedup) {
        const hash = this.#hash(data)
        // create the file (if not already present) in the store
        const dedupPath = await this.#writeDeduplicationSource(hash, data)
        // hard link to the target place
        // this linked file will have the same extended attributes
        // (used for unlink)
        return this.#link(dedupPath, file)
      }
    }
    // fallback
    return this.#localWriteFile(file, data, { flags })
  }

  #hash(data) {
    return createHash(this.#hashMethod).update(data).digest('hex')
  }
  async #getExtendedAttribute(file, attributeName) {
    try{
      return this._readFile(file+attributeName)
    }catch(err){
      if(err.code === 'ENOENT'){
        return 
      }
      throw err
    }
  }
  async #setExtendedAttribute(file, attributeName, value) {
    return  this._writeFile(file+attributeName, value)
  }

  async #removeExtendedAttribute(file, attributeName){
    return  this._unlink(file+attributeName)
  }
/*
  async #getExtendedAttribute(file, attributeName) {
    return new Promise((resolve, reject) => {
      fsx.get(this.getFilePath(file), attributeName, (err, res) => {
        if (err) {
          reject(err)
        } else {
          // res is a buffer
          // it is null if the file doesn't have this attribute
          if (res !== null) {
            resolve(res.toString('utf-8'))
          }
          resolve(undefined)
        }
      })
    })
  }
  async #setExtendedAttribute(file, attributeName, value) {
    return new Promise((resolve, reject) => {
      fsx.set(this.getFilePath(file), attributeName, value, (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  }

  async #removeExtendedAttribute(file, attributeName){
    
  }
  */

  // create a hard link between to files
  #link(source, dest) {
    return fs.link(this.getFilePath(source), this.getFilePath(dest))
  }

  // split path to keep a sane number of file per directory
  #computeDeduplicationPath(hash) {
    assert.equal(hash.length % 4, 0)
    let path = this.#dedupDirectory
    for (let i = 0; i < hash.length; i++) {
      if (i % 4 === 0) {
        path += '/'
      }
      path += hash[i]
    }
    path += '.source'
    return path
  }

  async #writeDeduplicationSource(hash, data) {
    const path = this.#computeDeduplicationPath(hash)
    try {
      // flags ensures it fails if it already exists
      // _outputfile will create the directory tree
      await this._outputFile(path, data, { flags: 'wx' })
    } catch (error) {
      // if it is alread present : not a problem
      if (error.code === 'EEXIST') {
        // it should already have the extended attributes, nothing more to do
        return path
      }
      throw error
    }

    try {
      await this.#setExtendedAttribute(path, this.#attributeKey, hash)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
      // if a concurrent process deleted the dedup : recreate it
      return this.#writeDeduplicationSource(path, hash)
    }
    return path
  }

  /**
   * delete empty dirs
   * delete file source thath don't have any more links
   *
   * @returns Promise
   */

  async deduplicationGarbageCollector(dir = this.#dedupDirectory, alreadyVisited = false) {
    try {
      await this._rmdir(dir)
      return
    } catch (error) {
      if (error.code !== 'ENOTEMPTY') {
        throw error
      }
    }
    // the directory may not be empty after a first visit
    if (alreadyVisited) {
      return
    }

    const files = await this._list(dir)
    await asyncEach(
      files,
      async file => {
        const stat = await fs.stat(this.getFilePath(`${dir}/${file}`))
        // have to check the stat to ensure we don't try to delete
        // the directories : they don't have links
        if (stat.isDirectory()) {
          return this.deduplicationGarbageCollector(`${dir}/${file}`)
        }
        if (stat.nlink === 1) {
          return fs.unlink(this.getFilePath(`${dir}/${file}`))
        }
      },
      { concurrency: 2 }
    ) // since we do a recursive traveral with a deep tree)
    return this.deduplicationGarbageCollector(dir, true)
  }

  async deduplicationStats(dir = this.#dedupDirectory) {
    let nbSourceBlocks = 0
    let nbBlocks = 0
    try {
      const files = await this._list(dir)
      await asyncEach(
        files,
        async file => {
          const stat = await fs.stat(this.getFilePath(`${dir}/${file}`))
          if (stat.isDirectory()) {
            const { nbSourceBlocks: nbSourceInChild, nbBlocks: nbBlockInChild } = await this.deduplicationStats(
              `${dir}/${file}`
            )
            nbSourceBlocks += nbSourceInChild
            nbBlocks += nbBlockInChild
          } else {
            nbSourceBlocks++
            nbBlocks += stat.nlink - 1 // ignore current
          }
        },
        { concurrency: 2 }
      )
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
    return { nbSourceBlocks, nbBlocks }
  }

  @synchronized()
  async checkSupport() {
    const supported = await super.checkSupport()
    const sourceFileName = normalizePath(`${Date.now()}.sourcededup`)
    const destFileName = normalizePath(`${Date.now()}.destdedup`)
    try {
      const SIZE = 1024 * 1024
      const data = await fromCallback(randomBytes, SIZE)
      const hash = this.#hash(data)
      await this._outputFile(sourceFileName, data, { flags: 'wx', dedup: false })
      await this.#setExtendedAttribute(sourceFileName, this.#attributeKey, hash)
      await this.#link(sourceFileName, destFileName)
      const linkedData = await this._readFile(destFileName)
      const { nlink } = await fs.stat(this.getFilePath(destFileName))
      // contains the right data and the link counter
      supported.hardLink = nlink === 2 && linkedData.equals(data)
      supported.extendedAttributes = hash === (await this.#getExtendedAttribute(sourceFileName, this.#attributeKey))
    } catch (error) {
      warn(`error while testing the dedup`, { error })
    } finally {
      ignoreErrors.call(this._unlink(sourceFileName))
      ignoreErrors.call(this._unlink(destFileName))
    }
    return supported
  }
}
