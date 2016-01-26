import eventToPromise from 'event-to-promise'
import getStream from 'get-stream'

import {
  parse
} from 'xo-remote-parse'

export default class RemoteHandlerAbstract {
  constructor (remote) {
    this._remote = parse({...remote})
    if (!this._remote.type === this.type) {
      throw new Error('Incorrect remote type')
    }
  }

  _getInfo (remote) {
    throw new Error('Not implemented')
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

  async outputFile (file, data, options) {
    return this._outputFile(file, data, options)
  }

  async _outputFile (file, data, options) {
    const stream = await this.createOutputStream(file)
    const promise = eventToPromise(stream, 'finish')
    stream.end(data)
    return promise
  }

  async readFile (file, options) {
    return this._readFile(file, options)
  }

  async _readFile (file, options) {
    return getStream(await this.createReadStream(file, options))
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

  async createReadStream (file, options) {
    const stream = await this._createReadStream(file)
    if (stream.length === undefined) {
      try {
        stream.length = await this.getSize(file)
      } catch (_) {}
    }
    return stream
  }

  async _createReadStream (file, options) {
    throw new Error('Not implemented')
  }

  async createOutputStream (file, options) {
    return this._createOutputStream(file, options)
  }

  async _createOutputStream (file, options) {
    throw new Error('Not implemented')
  }

  async unlink (file) {
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
