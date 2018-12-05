// @flow

// $FlowFixMe
import asyncMap from '@xen-orchestra/async-map'
import getStream from 'get-stream'
import { finished } from 'readable-stream'
import { fromCallback, fromEvent, ignoreErrors, timeout } from 'promise-toolbox'
import { parse } from 'xo-remote-parser'
import { randomBytes } from 'crypto'
import { resolve } from 'path'
import { type Readable, type Writable } from 'stream'

import { createChecksumStream, validChecksumOfReadStream } from './checksum'

type Data = Buffer | Readable | string
type FileDescriptor = {| fd: mixed, path: string |}
type LaxReadable = Readable & Object
type LaxWritable = Writable & Object

type File = FileDescriptor | string

const checksumFile = file => file + '.checksum'

// normalize the path:
// - does not contains `.` or `..`  (cannot escape root dir)
// - always starts with `/`
const normalizePath = path => resolve('/', path)

// use symbols for private members to avoid any conflicts with inheriting
// classes
const kPrefix = Symbol('prefix')
const kResolve = Symbol('resolve')

const DEFAULT_TIMEOUT = 6e5 // 10 min

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

    this[kPrefix] = ''
  }

  // Public members

  get prefix(): string {
    return this[kPrefix]
  }

  set prefix(prefix: string) {
    prefix = normalizePath(prefix)
    this[kPrefix] = prefix === '/' ? '' : prefix
  }

  get type(): string {
    throw new Error('Not implemented')
  }

  async closeFile(fd: FileDescriptor): Promise<void> {
    await timeout.call(this._closeFile(fd.fd), this._timeout)
  }

  async createOutputStream(
    file: File,
    { checksum = false, ...options }: Object = {}
  ): Promise<LaxWritable> {
    if (typeof file === 'string') {
      file = this[kResolve](file)
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
      file = this[kResolve](file)
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

  // Free the resources possibly dedicated to put the remote at work, when it
  // is no more needed
  async forget(): Promise<void> {
    await this._forget()
  }

  async getSize(file: File): Promise<number> {
    return timeout.call(
      this._getSize(typeof file === 'string' ? this[kResolve](file) : file),
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
    dir = this[kResolve](dir)

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

  async openFile(path: string, flags?: string): Promise<FileDescriptor> {
    path = this[kResolve](path)

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
    return this._outputFile(this[kResolve](file), data, { flags })
  }

  async read(
    file: File,
    buffer: Buffer,
    position?: number
  ): Promise<{| bytesRead: number, buffer: Buffer |}> {
    return this._read(
      typeof file === 'string' ? this[kResolve](file) : file,
      buffer,
      position
    )
  }

  async readFile(
    file: string,
    { flags = 'r' }: { flags?: string } = {}
  ): Promise<Buffer> {
    return this._readFile(this[kResolve](file), { flags })
  }

  async refreshChecksum(path: string): Promise<void> {
    path = this[kResolve](path)

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
    oldPath = this[kResolve](oldPath)
    newPath = this[kResolve](newPath)

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
    await timeout.call(this._rmdir(this[kResolve](dir)), this._timeout)
  }

  async rmtree(dir: string): Promise<void> {
    await this._rmtree(this[kResolve](dir))
  }

  // Asks the handler to sync the state of the effective remote with its'
  // metadata
  async sync(): Promise<void> {
    await this._sync()
  }

  async test(): Promise<Object> {
    const testFileName = this[kResolve](`${Date.now()}.test`)
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
    file = this[kResolve](file)

    if (checksum) {
      ignoreErrors.call(this._unlink(checksumFile(file)))
    }

    await timeout.call(this._unlink(file), this._timeout)
  }

  // Methods that can be implemented by inheriting classes

  async _closeFile(fd: mixed): Promise<void> {
    throw new Error('Not implemented')
  }

  async _createOutputStream(
    file: File,
    options?: Object
  ): Promise<LaxWritable> {
    throw new Error('Not implemented')
  }

  async _createReadStream(file: File, options?: Object): Promise<LaxReadable> {
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

  async _openFile(path: string, flags?: string): Promise<mixed> {
    throw new Error('Not implemented')
  }

  async _outputFile(file: string, data: Data, options?: Object): Promise<void> {
    const stream = await this._createOutputStream(file, options)
    const promise = fromCallback(cb => finished(stream, cb))
    stream.end(data)
    return promise
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

  // Private members

  [kResolve](path: string): string {
    path = normalizePath(path)
    const prefix = this[kPrefix]
    return path === '/' ? prefix : prefix + path
  }
}
