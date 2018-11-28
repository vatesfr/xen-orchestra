// @flow

// $FlowFixMe
import asyncMap from '@xen-orchestra/async-map'
import getStream from 'get-stream'
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
  }

  get type(): string {
    throw new Error('Not implemented')
  }

  /**
   * Asks the handler to sync the state of the effective remote with its' metadata
   */
  async sync(): Promise<mixed> {
    return this._sync()
  }

  async _sync(): Promise<mixed> {
    throw new Error('Not implemented')
  }

  /**
   * Free the resources possibly dedicated to put the remote at work, when it is no more needed
   */
  async forget(): Promise<void> {
    await this._forget()
  }

  async _forget(): Promise<void> {
    throw new Error('Not implemented')
  }

  async test(): Promise<Object> {
    const testFileName = `/${Date.now()}.test`
    const data = await fromCallback(cb => randomBytes(1024 * 1024, cb))
    let step = 'write'
    try {
      await this.outputFile(testFileName, data)
      step = 'read'
      const read = await this.readFile(testFileName)
      if (data.compare(read) !== 0) {
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
      ignoreErrors.call(this.unlink(testFileName))
    }
  }

  async outputFile(file: string, data: Data, options?: Object): Promise<void> {
    return this._outputFile(normalizePath(file), data, {
      flags: 'wx',
      ...options,
    })
  }

  async _outputFile(file: string, data: Data, options?: Object): Promise<void> {
    const stream = await this.createOutputStream(normalizePath(file), options)
    const promise = fromEvent(stream, 'finish')
    stream.end(data)
    await promise
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

  _read(
    file: File,
    buffer: Buffer,
    position?: number
  ): Promise<{| bytesRead: number, buffer: Buffer |}> {
    throw new Error('Not implemented')
  }

  async readFile(file: string, options?: Object): Promise<Buffer> {
    return this._readFile(normalizePath(file), options)
  }

  _readFile(file: string, options?: Object): Promise<Buffer> {
    return this.createReadStream(file, options).then(getStream.buffer)
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

  async _rename(oldPath: string, newPath: string) {
    throw new Error('Not implemented')
  }

  async rmdir(
    dir: string,
    { recursive = false }: { recursive?: boolean } = {}
  ) {
    dir = normalizePath(dir)
    await (recursive ? this._rmtree(dir) : this._rmdir(dir))
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

  async list(
    dir: string = '.',
    {
      filter,
      prependDir = false,
    }: { filter?: (name: string) => boolean, prependDir?: boolean } = {}
  ): Promise<string[]> {
    dir = normalizePath(dir)

    let entries = await timeout.call(this._list(dir), this._timeout)
    if (filter !== undefined) {
      entries = entries.filter(filter)
    }

    if (prependDir) {
      entries.forEach((entry, i) => {
        entries[i] = dir + '/' + entry
      })
    }

    return entries
  }

  async _list(dir: string): Promise<string[]> {
    throw new Error('Not implemented')
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
              this.getSize(file).then(size => {
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

    return this.readFile(checksumFile(path)).then(
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

  async _createReadStream(file: File, options?: Object): Promise<LaxReadable> {
    throw new Error('Not implemented')
  }

  async openFile(path: string, flags?: string): Promise<FileDescriptor> {
    path = normalizePath(path)

    return {
      fd: await timeout.call(this._openFile(path, flags), this._timeout),
      path,
    }
  }

  async _openFile(path: string, flags?: string): Promise<mixed> {
    throw new Error('Not implemented')
  }

  async closeFile(fd: FileDescriptor): Promise<void> {
    await timeout.call(this._closeFile(fd.fd), this._timeout)
  }

  async _closeFile(fd: mixed): Promise<void> {
    throw new Error('Not implemented')
  }

  async refreshChecksum(path: string): Promise<void> {
    path = normalizePath(path)

    const stream = (await this.createReadStream(path)).pipe(
      createChecksumStream()
    )
    stream.resume() // start reading the whole file
    await this.outputFile(checksumFile(path), await stream.checksum)
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
      .then(value => this.outputFile(checksumFile(path), value))
      .catch(forwardError)

    return checksumStream
  }

  async _createOutputStream(
    file: File,
    options?: Object
  ): Promise<LaxWritable> {
    throw new Error('Not implemented')
  }

  async unlink(file: string, { checksum = true }: Object = {}): Promise<void> {
    file = normalizePath(file)

    if (checksum) {
      ignoreErrors.call(this._unlink(checksumFile(file)))
    }

    await timeout.call(this._unlink(file), this._timeout)
  }

  async _unlink(file: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async getSize(file: File): Promise<number> {
    return timeout.call(
      this._getSize(typeof file === 'string' ? normalizePath(file) : file),
      this._timeout
    )
  }

  async _getSize(file: File): Promise<number> {
    throw new Error('Not implemented')
  }
}
