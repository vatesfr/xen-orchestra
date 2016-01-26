import eventToPromise from 'event-to-promise'
import getStream from 'get-stream'

export default class RemoteHandlerAbstract {
  constructor (remote) {
    this._remote = this._getInfo({...remote})
  }

  _getInfo (remote) {
    throw new Error('Not implemented')
  }

  async sync () {
    return this._sync()
  }

  async _sync () {
    throw new Error('Not implemented')
  }

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
    const stream = await this.createReadStream(file, options)
    return getStream(stream)
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
    if (!('length' in stream) || stream.length === null) {
      try {
        const length = await this.getSize(file)
        stream.length = length
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
