// @flow

// $FlowFixMe
import getStream from 'get-stream'

import asyncMap from '@xen-orchestra/async-map'
import path from 'path'
import { fromCallback, fromEvent, ignoreErrors, timeout } from 'promise-toolbox'
import { parse } from 'xo-remote-parser'
import { randomBytes } from 'crypto'
import { type Readable, type Writable } from 'stream'

import normalizePath from './_normalize-path'
import { createChecksumStream, validChecksumOfReadStream } from './checksum'

const { dirname } = path.posix

type Data = Buffer | Readable | string
type FileDescriptor = {| fd: mixed, path: string |}
type LaxReadable = Readable & Object
type LaxWritable = Writable & Object

type File = FileDescriptor | string

const checksumFile = file => file + '.checksum'

const DEFAULT_TIMEOUT = 6e5 // 10 min

const ignoreEnoent = error => {
  if (error == null || error.code !== 'ENOENT') {
    throw error
  }
}

class PrefixWrapper {
  constructor(remote, prefix) {
    this._prefix = prefix
    this._remote = remote
  }

  get type() {
    return this._remote.type
  }

  // necessary to remove the prefix from the path with `prependDir` option
  async list(dir, opts) {
    const entries = await this._remote.list(this._resolve(dir), opts)
    if (opts != null && opts.prependDir) {
      const n = this._prefix.length
      entries.forEach((entry, i, entries) => {
        entries[i] = entry.slice(n)
      })
    }
    return entries
  }

  rename(oldPath, newPath) {
    return this._remote.rename(this._resolve(oldPath), this._resolve(newPath))
  }

  _resolve(path) {
    return this._prefix + normalizePath(path)
  }
}

export default class RemoteHandlerAbstract {
  _remote: Object
  _timeout: number

  constructor(remote: any, options: Object = {}) {
    if (remote.url === 'test://') {
      this._remote = remote
    } else {
      this._remote = { ...remote, ...parse(remote.url) }
      if (this._remote.type !== this.type) {
        throw new Error('Incorrect remote type')
      }
    }
    ;({ timeout: this._timeout = DEFAULT_TIMEOUT } = options)
  }

  // Public members

  get type(): string {
    throw new Error('Not implemented')
  }

  addPrefix(prefix: string) {
    prefix = normalizePath(prefix)
    return prefix === '/' ? this : new PrefixWrapper(this, prefix)
  }

  async closeFile(fd: FileDescriptor): Promise<void> {
    await timeout.call(this._closeFile(fd.fd), this._timeout)
  }

  async createOutputStream(
    file: File,
    { checksum = false, ...options }: Object = {}
  ): Promise<LaxWritable> {
    if (typeof file === 'string') {
      file = normalizePath(file)
    }
    const path = typeof file === 'string' ? file : file.path
    const streamP = timeout.call(
      this._createOutputStream(file, {
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

    // $FlowFixMe
    checksumStream.checksumWritten = checksumStream.checksum
      .then(value =>
        this._outputFile(checksumFile(path), value, { flags: 'wx' })
      )
      .catch(forwardError)

    return checksumStream
  }

  createReadStream(
    file: File,
    { checksum = false, ignoreMissingChecksum = false, ...options }: Object = {}
  ): Promise<LaxReadable> {
    if (typeof file === 'string') {
      file = normalizePath(file)
    }
    const path = typeof file === 'string' ? file : file.path
    const streamP = timeout
      .call(this._createReadStream(file, options), this._timeout)
      .then(stream => {
        // detect early errors
        let promise = fromEvent(stream, 'readable')

        // try to add the length prop if missing and not a range stream
        if (
          stream.length === undefined &&
          options.end === undefined &&
          options.start === undefined
        ) {
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
          stream = (validChecksumOfReadStream(
            stream,
            String(checksum).trim()
          ): LaxReadable)
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

  createWriteStream(
    file: File,
    options: { end?: number, flags?: string, start?: number } = {}
  ): Promise<LaxWritable> {
    return timeout.call(
      this._createWriteStream(
        typeof file === 'string' ? normalizePath(file) : file,
        {
          flags: 'wx',
          ...options,
        }
      )
    )
  }

  // Free the resources possibly dedicated to put the remote at work, when it
  // is no more needed
  //
  // FIXME: Some handlers are implemented based on system-wide mecanisms (such
  // as mount), forgetting them might breaking other processes using the same
  // remote.
  async forget(): Promise<void> {
    await this._forget()
  }

  async getSize(file: File): Promise<number> {
    return timeout.call(
      this._getSize(typeof file === 'string' ? normalizePath(file) : file),
      this._timeout
    )
  }

  async list(
    dir: string,
    {
      filter,
      prependDir = false,
    }: { filter?: (name: string) => boolean, prependDir?: boolean } = {}
  ): Promise<string[]> {
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
  }

  async mkdir(dir: string): Promise<void> {
    dir = normalizePath(dir)
    try {
      await this._mkdir(dir)
    } catch (error) {
      if (error == null || error.code !== 'EEXIST') {
        throw error
      }

      // this operation will throw if it's not already a directory
      await this._list(dir)
    }
  }

  async mktree(dir: string): Promise<void> {
    await this._mktree(normalizePath(dir))
  }

  async openFile(path: string, flags: string): Promise<FileDescriptor> {
    path = normalizePath(path)

    return {
      fd: await timeout.call(this._openFile(path, flags), this._timeout),
      path,
    }
  }

  async outputFile(
    file: string,
    data: Data,
    { flags = 'wx' }: { flags?: string } = {}
  ): Promise<void> {
    await this._outputFile(normalizePath(file), data, { flags })
  }

  async read(
    file: File,
    buffer: Buffer,
    position?: number
  ): Promise<{| bytesRead: number, buffer: Buffer |}> {
    return this._read(
      typeof file === 'string' ? normalizePath(file) : file,
      buffer,
      position
    )
  }

  async readFile(
    file: string,
    { flags = 'r' }: { flags?: string } = {}
  ): Promise<Buffer> {
    return this._readFile(normalizePath(file), { flags })
  }

  async refreshChecksum(path: string): Promise<void> {
    path = normalizePath(path)

    const stream = (await this._createReadStream(path, { flags: 'r' })).pipe(
      createChecksumStream()
    )
    stream.resume() // start reading the whole file
    await this._outputFile(checksumFile(path), await stream.checksum, {
      flags: 'wx',
    })
  }

  async rename(
    oldPath: string,
    newPath: string,
    { checksum = false }: Object = {}
  ) {
    oldPath = normalizePath(oldPath)
    newPath = normalizePath(newPath)

    let p = timeout.call(this._rename(oldPath, newPath), this._timeout)
    if (checksum) {
      p = Promise.all([
        p,
        this._rename(checksumFile(oldPath), checksumFile(newPath)),
      ])
    }
    return p
  }

  async rmdir(dir: string): Promise<void> {
    await timeout.call(
      this._rmdir(normalizePath(dir)).catch(ignoreEnoent),
      this._timeout
    )
  }

  async rmtree(dir: string): Promise<void> {
    await this._rmtree(normalizePath(dir))
  }

  // Asks the handler to sync the state of the effective remote with its'
  // metadata
  //
  // This method MUST ALWAYS be called before using the handler.
  async sync(): Promise<void> {
    await this._sync()
  }

  async test(): Promise<Object> {
    const testFileName = normalizePath(`${Date.now()}.test`)
    const data = await fromCallback(cb => randomBytes(1024 * 1024, cb))
    let step = 'write'
    try {
      await this._outputFile(testFileName, data, { flags: 'wx' })
      step = 'read'
      const read = await this._readFile(testFileName, { flags: 'r' })
      if (!data.equals(read)) {
        throw new Error('output and input did not match')
      }
      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        step,
        file: testFileName,
        error: error.message || String(error),
      }
    } finally {
      ignoreErrors.call(this._unlink(testFileName))
    }
  }

  async unlink(file: string, { checksum = true }: Object = {}): Promise<void> {
    file = normalizePath(file)

    if (checksum) {
      ignoreErrors.call(this._unlink(checksumFile(file)))
    }

    await this._unlink(file).catch(ignoreEnoent)
  }

  async writeFile(
    file: string,
    data: Data,
    { flags = 'wx' }: { flags?: string } = {}
  ): Promise<void> {
    await this._writeFile(normalizePath(file), data, { flags })
  }

  // Methods that can be implemented by inheriting classes

  async _closeFile(fd: mixed): Promise<void> {
    throw new Error('Not implemented')
  }

  async _createOutputStream(file: File, options: Object): Promise<LaxWritable> {
    try {
      return await this._createWriteStream(file, options)
    } catch (error) {
      if (typeof file !== 'string' || error.code !== 'ENOENT') {
        throw error
      }
    }

    await this._mktree(dirname(file))
    return this._createOutputStream(file, options)
  }

  async _createReadStream(file: File, options?: Object): Promise<LaxReadable> {
    throw new Error('Not implemented')
  }

  async _createWriteStream(file: File, options: Object): Promise<LaxWritable> {
    throw new Error('Not implemented')
  }

  // called to finalize the remote
  async _forget(): Promise<void> {}

  async _getSize(file: File): Promise<number> {
    throw new Error('Not implemented')
  }

  async _list(dir: string): Promise<string[]> {
    throw new Error('Not implemented')
  }

  async _mkdir(dir: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async _mktree(dir: string): Promise<void> {
    try {
      return await this.mkdir(dir)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    await this._mktree(dirname(dir))
    return this._mktree(dir)
  }

  async _openFile(path: string, flags: string): Promise<mixed> {
    throw new Error('Not implemented')
  }

  async _outputFile(
    file: string,
    data: Data,
    options: { flags?: string }
  ): Promise<void> {
    try {
      return await this._writeFile(file, data, options)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    await this._mktree(dirname(file))
    return this._outputFile(file, data, options)
  }

  _read(
    file: File,
    buffer: Buffer,
    position?: number
  ): Promise<{| bytesRead: number, buffer: Buffer |}> {
    throw new Error('Not implemented')
  }

  _readFile(file: string, options?: Object): Promise<Buffer> {
    return this._createReadStream(file, options).then(getStream.buffer)
  }

  async _rename(oldPath: string, newPath: string) {
    throw new Error('Not implemented')
  }

  async _rmdir(dir: string) {
    throw new Error('Not implemented')
  }

  async _rmtree(dir: string) {
    try {
      return await this._rmdir(dir)
    } catch (error) {
      if (error.code !== 'ENOTEMPTY') {
        throw error
      }
    }

    const files = await this._list(dir)
    await asyncMap(files, file =>
      this._unlink(`${dir}/${file}`).catch(error => {
        if (error.code === 'EISDIR') {
          return this._rmtree(`${dir}/${file}`)
        }
        throw error
      })
    )
    return this._rmtree(dir)
  }

  // called to initialize the remote
  async _sync(): Promise<void> {}

  async _unlink(file: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async _writeFile(
    file: string,
    data: Data,
    options: { flags?: string }
  ): Promise<void> {
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
      typeof (value = (descriptor = getOwnPropertyDescriptor(pRha, name))
        .value) !== 'function'
    ) {
      return
    }

    descriptor.value = function() {
      let path
      if (arguments.length !== 0 && typeof (path = arguments[0]) === 'string') {
        arguments[0] = this._resolve(path)
      }
      return value.apply(this._remote, arguments)
    }

    defineProperty(pPw, name, descriptor)
  })
}
createPrefixWrapperMethods()
