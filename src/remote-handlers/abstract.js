import eventToPromise from 'event-to-promise'
import through2 from 'through2'

import {
  parse
} from 'xo-remote-parser'

import {
  addChecksumToReadStream,
  getPseudoRandomBytes,
  noop,
  pCatch,
  streamToBuffer,
  validChecksumOfReadStream
} from '../utils'

export default class RemoteHandlerAbstract {
  constructor (remote) {
    this._remote = {...remote, ...parse(remote.url)}
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
        success: true
      }
    } catch (error) {
      return {
        success: false,
        step,
        file: testFileName,
        error: error.message || String(error)
      }
    } finally {
      this.unlink(testFileName).catch(noop)
    }
  }

  async outputFile (file, data, options) {
    return this._outputFile(file, data, {
      flags: 'wx',
      ...options
    })
  }

  async _outputFile (file, data, options) {
    const stream = await this.createOutputStream(file, options)
    const promise = eventToPromise(stream, 'finish')
    stream.end(data)
    return promise
  }

  async readFile (file, options) {
    return this._readFile(file, options)
  }

  _readFile (file, options) {
    return this.createReadStream(file, options).then(streamToBuffer)
  }

  async rename (oldPath, newPath) {
    return this._rename(oldPath, newPath)
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

  async createReadStream (file, {
    checksum = false,
    ignoreMissingChecksum = false,
    ...options
  } = {}) {
    const streamP = this._createReadStream(file, options).then(async stream => {
      await eventToPromise(stream, 'readable')

      if (stream.length === undefined) {
        stream.length = await this.getSize(file)::pCatch(noop)
      }

      return stream
    })

    if (!checksum) {
      return streamP
    }

    try {
      checksum = await this.readFile(`${file}.checksum`)
    } catch (error) {
      if (error.code === 'ENOENT' && ignoreMissingChecksum) {
        return streamP
      }

      throw error
    }

    let stream = await streamP

    const { length } = stream
    stream = validChecksumOfReadStream(stream, checksum.toString())
    stream.length = length

    return stream
  }

  async _createReadStream (file, options) {
    throw new Error('Not implemented')
  }

  async refreshChecksum (path) {
    const stream = addChecksumToReadStream(await this.createReadStream(path))
    stream.resume() // start reading the whole file
    const checksum = await stream.checksum
    await this.outputFile(`${path}.checksum`, checksum)
  }

  async createOutputStream (file, {
    checksum = false,
    ...options
  } = {}) {
    const streamP = this._createOutputStream(file, {
      flags: 'wx',
      ...options
    })

    if (!checksum) {
      return streamP
    }

    const connectorStream = through2()
    const forwardError = error => {
      connectorStream.emit('error', error)
    }

    const streamWithChecksum = addChecksumToReadStream(connectorStream)
    streamWithChecksum.pipe(await streamP)

    streamWithChecksum.checksum
      .then(value => this.outputFile(`${file}.checksum`, value))
      .catch(forwardError)

    return connectorStream
  }

  async _createOutputStream (file, options) {
    throw new Error('Not implemented')
  }

  async unlink (file, {
    checksum = false
  } = {}) {
    if (checksum) {
      this._unlink(`${file}.checksum`)::pCatch(noop)
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
