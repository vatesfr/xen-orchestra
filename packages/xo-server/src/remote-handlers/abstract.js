import { fromEvent, ignoreErrors } from 'promise-toolbox'
import { parse } from 'xo-remote-parser'

import { getPseudoRandomBytes, streamToBuffer } from '../utils'

import { createChecksumStream, validChecksumOfReadStream } from './checksum'

const checksumFile = file => file + '.checksum'

export default class RemoteHandlerAbstract {
  constructor (remote) {
    this._remote = { ...remote, ...parse(remote.url) }
    if (this._remote.type !== this.type) {
      throw new Error('Incorrect remote type')
    }
  }

  get type () {
    throw new Error('Not implemented')
  }

  /**
   * Asks the handler to sync the state of the effective remote with its' metadata
   */
  async sync () {
    return this._sync()
  }

  async _sync () {
    throw new Error('Not implemented')
  }

  /**
   * Free the resources possibly dedicated to put the remote at work, when it is no more needed
   */
  async forget () {
    return this._forget()
  }

  async _forget () {
    throw new Error('Not implemented')
  }

  async test () {
    const testFileName = `${Date.now()}.test`
    const data = getPseudoRandomBytes(1024 * 1024)
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
      ;this.unlink(testFileName)::ignoreErrors()
    }
  }

  async outputFile (file, data, options) {
    return this._outputFile(file, data, {
      flags: 'wx',
      ...options,
    })
  }

  async _outputFile (file, data, options) {
    const stream = await this.createOutputStream(file, options)
    const promise = fromEvent(stream, 'finish')
    stream.end(data)
    return promise
  }

  async readFile (file, options) {
    return this._readFile(file, options)
  }

  _readFile (file, options) {
    return this.createReadStream(file, options).then(streamToBuffer)
  }

  async rename (oldPath, newPath, { checksum = false } = {}) {
    let p = this._rename(oldPath, newPath)
    if (checksum) {
      p = Promise.all([
        p,
        this._rename(checksumFile(oldPath), checksumFile(newPath)),
      ])
    }
    return p
  }

  async _rename (oldPath, newPath) {
    throw new Error('Not implemented')
  }

  async list (dir = '.') {
    return this._list(dir)
  }

  async _list (dir) {
    throw new Error('Not implemented')
  }

  createReadStream (
    file,
    { checksum = false, ignoreMissingChecksum = false, ...options } = {}
  ) {
    const path = typeof file === 'string' ? file : file.path
    const streamP = this._createReadStream(file, options).then(stream => {
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
          this.getSize(file)
            .then(size => {
              stream.length = size
            })
            ::ignoreErrors(),
        ])
      }

      return promise.then(() => stream)
    })

    if (!checksum) {
      return streamP
    }

    // avoid a unhandled rejection warning
    ;streamP::ignoreErrors()

    return this.readFile(checksumFile(path)).then(
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

  async _createReadStream (file, options) {
    throw new Error('Not implemented')
  }

  async openFile (path, flags) {
    return { fd: await this._openFile(path, flags), path }
  }

  async _openFile (path, flags) {
    throw new Error('Not implemented')
  }

  async closeFile (fd) {
    return this._closeFile(fd.fd)
  }

  async _closeFile (fd) {
    throw new Error('Not implemented')
  }

  async refreshChecksum (path) {
    const stream = (await this.createReadStream(path)).pipe(
      createChecksumStream()
    )
    stream.resume() // start reading the whole file
    await this.outputFile(checksumFile(path), await stream.checksum)
  }

  async createOutputStream (file, { checksum = false, ...options } = {}) {
    const path = typeof file === 'string' ? file : file.path
    const streamP = this._createOutputStream(file, {
      flags: 'wx',
      ...options,
    })

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
      .then(value => this.outputFile(checksumFile(path), value))
      .catch(forwardError)

    return checksumStream
  }

  async _createOutputStream (file, options) {
    throw new Error('Not implemented')
  }

  async unlink (file, { checksum = true } = {}) {
    if (checksum) {
      ;this._unlink(checksumFile(file))::ignoreErrors()
    }

    return this._unlink(file)
  }

  async _unlink (file) {
    throw new Error('Not implemented')
  }

  async getSize (file) {
    return this._getSize(file)
  }

  async _getSize (file) {
    throw new Error('Not implemented')
  }
}
