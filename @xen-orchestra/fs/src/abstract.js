import asyncMapSettled from '@xen-orchestra/async-map/legacy'
import getStream from 'get-stream'
import { coalesceCalls } from '@vates/coalesce-calls'
import { createLogger } from '@xen-orchestra/log'
import { fromCallback, fromEvent, ignoreErrors, timeout } from 'promise-toolbox'
import { limitConcurrency } from 'limit-concurrency-decorator'
import { parse } from 'xo-remote-parser'
import { pipeline } from 'stream'
import { randomBytes } from 'crypto'
import { serializeError } from 'serialize-error'
import { synchronized } from 'decorator-synchronized'

import { basename, dirname, normalize as normalizePath } from './_path'
import { createChecksumStream, validChecksumOfReadStream } from './checksum'

const { warn } = createLogger('@xen-orchestra:fs')

const checksumFile = file => file + '.checksum'
const computeRate = (hrtime, size) => {
  const seconds = hrtime[0] + hrtime[1] / 1e9
  return size / seconds
}

const DEFAULT_TIMEOUT = 6e5 // 10 min
const DEFAULT_MAX_PARALLEL_OPERATIONS = 10

const ignoreEnoent = error => {
  if (error == null || error.code !== 'ENOENT') {
    throw error
  }
}

const noop = Function.prototype

class PrefixWrapper {
  constructor(handler, prefix) {
    this._prefix = prefix
    this._handler = handler
  }

  get type() {
    return this._handler.type
  }

  // necessary to remove the prefix from the path with `prependDir` option
  async list(dir, opts) {
    const entries = await this._handler.list(this._resolve(dir), opts)
    if (opts != null && opts.prependDir) {
      const n = this._prefix.length
      entries.forEach((entry, i, entries) => {
        entries[i] = entry.slice(n)
      })
    }
    return entries
  }

  rename(oldPath, newPath) {
    return this._handler.rename(this._resolve(oldPath), this._resolve(newPath))
  }

  _resolve(path) {
    return this._prefix + normalizePath(path)
  }
}

export default class RemoteHandlerAbstract {
  constructor(remote, options = {}) {
    if (remote.url === 'test://') {
      this._remote = remote
    } else {
      this._remote = { ...remote, ...parse(remote.url) }
      if (this._remote.type !== this.type) {
        throw new Error('Incorrect remote type')
      }
    }
    ;({ highWaterMark: this._highWaterMark, timeout: this._timeout = DEFAULT_TIMEOUT } = options)

    const sharedLimit = limitConcurrency(options.maxParallelOperations ?? DEFAULT_MAX_PARALLEL_OPERATIONS)
    this.closeFile = sharedLimit(this.closeFile)
    this.copy = sharedLimit(this.copy)
    this.getInfo = sharedLimit(this.getInfo)
    this.getSize = sharedLimit(this.getSize)
    this.list = sharedLimit(this.list)
    this.mkdir = sharedLimit(this.mkdir)
    this.openFile = sharedLimit(this.openFile)
    this.outputFile = sharedLimit(this.outputFile)
    this.read = sharedLimit(this.read)
    this.readFile = sharedLimit(this.readFile)
    this.rename = sharedLimit(this.rename)
    this.rmdir = sharedLimit(this.rmdir)
    this.truncate = sharedLimit(this.truncate)
    this.unlink = sharedLimit(this.unlink)
    this.write = sharedLimit(this.write)
    this.writeFile = sharedLimit(this.writeFile)

    this._forget = coalesceCalls(this._forget)
    this._sync = coalesceCalls(this._sync)
  }

  // Public members

  get type() {
    throw new Error('Not implemented')
  }

  addPrefix(prefix) {
    prefix = normalizePath(prefix)
    return prefix === '/' ? this : new PrefixWrapper(this, prefix)
  }

  async closeFile(fd) {
    await this.__closeFile(fd)
  }

  // TODO: remove method
  async createOutputStream(file, { checksum = false, dirMode, ...options } = {}) {
    if (typeof file === 'string') {
      file = normalizePath(file)
    }
    const path = typeof file === 'string' ? file : file.path
    const streamP = timeout.call(
      this._createOutputStream(file, {
        dirMode,
        flags: 'wx',
        ...options,
      }),
      this._timeout
    )

    if (!checksum) {
      return streamP
    }

    const checksumStream = createChecksumStream()
    const forwardError = error => {
      checksumStream.emit('error', error)
    }

    const stream = await streamP
    stream.on('error', forwardError)
    checksumStream.pipe(stream)

    checksumStream.checksumWritten = checksumStream.checksum
      .then(value => this._outputFile(checksumFile(path), value, { flags: 'wx' }))
      .catch(forwardError)

    return checksumStream
  }

  createReadStream(file, { checksum = false, ignoreMissingChecksum = false, ...options } = {}) {
    if (typeof file === 'string') {
      file = normalizePath(file)
    }
    const path = typeof file === 'string' ? file : file.path
    const streamP = timeout
      .call(this._createReadStream(file, { ...options, highWaterMark: this._highWaterMark }), this._timeout)
      .then(stream => {
        // detect early errors
        let promise = fromEvent(stream, 'readable')

        // try to add the length prop if missing and not a range stream
        if (stream.length === undefined && options.end === undefined && options.start === undefined) {
          promise = Promise.all([
            promise,
            ignoreErrors.call(
              this._getSize(file).then(size => {
                stream.length = size
              })
            ),
          ])
        }

        return promise.then(() => stream)
      })

    if (!checksum) {
      return streamP
    }

    // avoid a unhandled rejection warning
    ignoreErrors.call(streamP)

    return this._readFile(checksumFile(path), { flags: 'r' }).then(
      checksum =>
        streamP.then(stream => {
          const { length } = stream
          stream = validChecksumOfReadStream(stream, String(checksum).trim())
          stream.length = length

          return stream
        }),
      error => {
        if (ignoreMissingChecksum && error && error.code === 'ENOENT') {
          return streamP
        }
        throw error
      }
    )
  }

  /**
   * write a stream to a file using a temporary file
   *
   * @param {string} path
   * @param {ReadableStream} input
   * @param {object} [options]
   * @param {boolean} [options.checksum]
   * @param {number} [options.dirMode]
   * @param {(this: RemoteHandlerAbstract, path: string) => Promise<undefined>} [options.validator] Function that will be called before the data is commited to the remote, if it fails, file should not exist
   */
  async outputStream(path, input, { checksum = true, dirMode, validator } = {}) {
    path = normalizePath(path)
    let checksumStream
    if (checksum) {
      checksumStream = createChecksumStream()
      pipeline(input, checksumStream, noop)
      input = checksumStream
    }
    await this._outputStream(path, input, {
      dirMode,
      validator,
    })
    if (checksum) {
      await this._outputFile(checksumFile(path), await checksumStream.checksum, { dirMode, flags: 'wx' })
    }
  }

  // Free the resources possibly dedicated to put the remote at work, when it
  // is no more needed
  //
  // FIXME: Some handlers are implemented based on system-wide mecanisms (such
  // as mount), forgetting them might breaking other processes using the same
  // remote.
  @synchronized()
  async forget() {
    await this._forget()
  }

  async getInfo() {
    return timeout.call(this._getInfo(), this._timeout)
  }

  async getSize(file) {
    return timeout.call(this._getSize(typeof file === 'string' ? normalizePath(file) : file), this._timeout)
  }

  async list(dir, { filter, ignoreMissing = false, prependDir = false } = {}) {
    try {
      const virtualDir = normalizePath(dir)
      dir = normalizePath(dir)

      let entries = await timeout.call(this._list(dir), this._timeout)
      if (filter !== undefined) {
        entries = entries.filter(filter)
      }

      if (prependDir) {
        entries.forEach((entry, i) => {
          entries[i] = virtualDir + '/' + entry
        })
      }

      return entries
    } catch (error) {
      if (ignoreMissing && error?.code === 'ENOENT') {
        return []
      }
      throw error
    }
  }

  async lock(path) {
    path = normalizePath(path)
    return { dispose: await this._lock(path) }
  }

  async mkdir(dir, { mode } = {}) {
    await this.__mkdir(normalizePath(dir), { mode })
  }

  async mktree(dir, { mode } = {}) {
    await this._mktree(normalizePath(dir), { mode })
  }

  openFile(path, flags) {
    return this.__openFile(path, flags)
  }

  async outputFile(file, data, { dirMode, flags = 'wx' } = {}) {
    await this._outputFile(normalizePath(file), data, { dirMode, flags })
  }

  async read(file, buffer, position) {
    return this._read(typeof file === 'string' ? normalizePath(file) : file, buffer, position)
  }

  async readFile(file, { flags = 'r' } = {}) {
    return this._readFile(normalizePath(file), { flags })
  }

  async rename(oldPath, newPath, { checksum = false } = {}) {
    oldPath = normalizePath(oldPath)
    newPath = normalizePath(newPath)

    let p = timeout.call(this._rename(oldPath, newPath), this._timeout)
    if (checksum) {
      p = Promise.all([p, this._rename(checksumFile(oldPath), checksumFile(newPath))])
    }
    return p
  }

  async copy(oldPath, newPath, { checksum = false } = {}) {
    oldPath = normalizePath(oldPath)
    newPath = normalizePath(newPath)

    let p = timeout.call(this._copy(oldPath, newPath), this._timeout)
    if (checksum) {
      p = Promise.all([p, this._copy(checksumFile(oldPath), checksumFile(newPath))])
    }
    return p
  }

  async rmdir(dir) {
    await timeout.call(this._rmdir(normalizePath(dir)).catch(ignoreEnoent), this._timeout)
  }

  async rmtree(dir) {
    await this._rmtree(normalizePath(dir))
  }

  // Asks the handler to sync the state of the effective remote with its'
  // metadata
  //
  // This method MUST ALWAYS be called before using the handler.
  @synchronized()
  async sync() {
    await this._sync()
  }

  async test() {
    const SIZE = 1024 * 1024 * 10
    const testFileName = normalizePath(`${Date.now()}.test`)
    const data = await fromCallback(randomBytes, SIZE)
    let step = 'write'
    try {
      const writeStart = process.hrtime()
      await this._outputFile(testFileName, data, { flags: 'wx' })
      const writeDuration = process.hrtime(writeStart)

      step = 'read'
      const readStart = process.hrtime()
      const read = await this._readFile(testFileName, { flags: 'r' })
      const readDuration = process.hrtime(readStart)

      if (!data.equals(read)) {
        throw new Error('output and input did not match')
      }
      return {
        success: true,
        writeRate: computeRate(writeDuration, SIZE),
        readRate: computeRate(readDuration, SIZE),
      }
    } catch (error) {
      warn(`error while testing the remote at step ${step}`, { error })
      return {
        success: false,
        step,
        file: testFileName,
        // ensure even non serializeable errors are displayed
        error: error.message || JSON.stringify(serializeError(error)),
      }
    } finally {
      ignoreErrors.call(this._unlink(testFileName))
    }
  }

  async truncate(file, len) {
    await this._truncate(file, len)
  }

  async unlink(file, { checksum = true } = {}) {
    file = normalizePath(file)

    if (checksum) {
      ignoreErrors.call(this._unlink(checksumFile(file)))
    }

    await this._unlink(file).catch(ignoreEnoent)
  }

  async write(file, buffer, position) {
    await this._write(typeof file === 'string' ? normalizePath(file) : file, buffer, position)
  }

  async writeFile(file, data, { flags = 'wx' } = {}) {
    await this._writeFile(normalizePath(file), data, { flags })
  }

  // Methods that can be called by private methods to avoid parallel limit on public methods

  async __closeFile(fd) {
    await timeout.call(this._closeFile(fd.fd), this._timeout)
  }

  async __mkdir(dir, { mode } = {}) {
    try {
      await this._mkdir(dir, { mode })
    } catch (error) {
      if (error == null || error.code !== 'EEXIST') {
        throw error
      }

      // this operation will throw if it's not already a directory
      await this._list(dir)
    }
  }

  async __openFile(path, flags) {
    path = normalizePath(path)

    return {
      fd: await timeout.call(this._openFile(path, flags), this._timeout),
      path,
    }
  }

  // Methods that can be implemented by inheriting classes

  async _closeFile(fd) {
    throw new Error('Not implemented')
  }

  async _createOutputStream(file, { dirMode, ...options } = {}) {
    try {
      return await this._createWriteStream(file, { ...options, highWaterMark: this._highWaterMark })
    } catch (error) {
      if (typeof file !== 'string' || error.code !== 'ENOENT') {
        throw error
      }
    }

    await this._mktree(dirname(file), { mode: dirMode })
    return this._createOutputStream(file, options)
  }

  async _createReadStream(file, options) {
    throw new Error('Not implemented')
  }

  // createWriteStream takes highWaterMark as option even if it's not documented.
  // Source: https://stackoverflow.com/questions/55026306/how-to-set-writeable-highwatermark
  async _createWriteStream(file, options) {
    throw new Error('Not implemented')
  }

  // called to finalize the remote
  async _forget() {}

  async _getInfo() {
    return {}
  }

  async _lock(path) {
    return () => Promise.resolve()
  }

  async _getSize(file) {
    throw new Error('Not implemented')
  }

  async _list(dir) {
    throw new Error('Not implemented')
  }

  async _mkdir(dir) {
    throw new Error('Not implemented')
  }

  async _mktree(dir, { mode } = {}) {
    try {
      return await this.__mkdir(dir, { mode })
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    await this._mktree(dirname(dir), { mode })
    return this._mktree(dir, { mode })
  }

  async _openFile(path, flags) {
    throw new Error('Not implemented')
  }

  async _outputFile(file, data, { dirMode, flags }) {
    try {
      return await this._writeFile(file, data, { flags })
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    await this._mktree(dirname(file), { mode: dirMode })
    return this._outputFile(file, data, { flags })
  }

  async _outputStream(path, input, { dirMode, validator }) {
    const tmpPath = `${dirname(path)}/.${basename(path)}`
    const output = await this.createOutputStream(tmpPath, {
      dirMode,
    })
    try {
      await fromCallback(pipeline, input, output)
      if (validator !== undefined) {
        await validator.call(this, tmpPath)
      }
      await this.rename(tmpPath, path)
    } catch (error) {
      await this.unlink(tmpPath)
      throw error
    }
  }

  _read(file, buffer, position) {
    throw new Error('Not implemented')
  }

  _readFile(file, options) {
    return this._createReadStream(file, { ...options, highWaterMark: this._highWaterMark }).then(getStream.buffer)
  }

  async _rename(oldPath, newPath) {
    throw new Error('Not implemented')
  }
  async _copy(oldPath, newPath) {
    throw new Error('Not implemented')
  }

  async _rmdir(dir) {
    throw new Error('Not implemented')
  }

  async _rmtree(dir) {
    try {
      return await this._rmdir(dir)
    } catch (error) {
      if (error.code !== 'ENOTEMPTY') {
        throw error
      }
    }

    const files = await this._list(dir)
    await asyncMapSettled(files, file =>
      this._unlink(`${dir}/${file}`).catch(error => {
        // Unlink dir behavior is not consistent across platforms
        // https://github.com/nodejs/node-v0.x-archive/issues/5791
        if (error.code === 'EISDIR' || error.code === 'EPERM') {
          return this._rmtree(`${dir}/${file}`)
        }
        throw error
      })
    )
    return this._rmtree(dir)
  }

  // called to initialize the remote
  async _sync() {}

  async _unlink(file) {
    throw new Error('Not implemented')
  }

  async _write(file, buffer, position) {
    const isPath = typeof file === 'string'
    if (isPath) {
      file = await this.__openFile(file, 'r+')
    }
    try {
      return await this._writeFd(file, buffer, position)
    } finally {
      if (isPath) {
        await this.__closeFile(file)
      }
    }
  }

  async _writeFd(fd, buffer, position) {
    throw new Error('Not implemented')
  }

  async _writeFile(file, data, options) {
    throw new Error('Not implemented')
  }
}

function createPrefixWrapperMethods() {
  const pPw = PrefixWrapper.prototype
  const pRha = RemoteHandlerAbstract.prototype

  const {
    defineProperty,
    getOwnPropertyDescriptor,
    prototype: { hasOwnProperty },
  } = Object

  Object.getOwnPropertyNames(pRha).forEach(name => {
    let descriptor, value
    if (
      hasOwnProperty.call(pPw, name) ||
      name[0] === '_' ||
      typeof (value = (descriptor = getOwnPropertyDescriptor(pRha, name)).value) !== 'function'
    ) {
      return
    }

    descriptor.value = function () {
      let path
      if (arguments.length !== 0 && typeof (path = arguments[0]) === 'string') {
        arguments[0] = this._resolve(path)
      }
      return value.apply(this._handler, arguments)
    }

    defineProperty(pPw, name, descriptor)
  })
}
createPrefixWrapperMethods()
