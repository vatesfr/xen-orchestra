import eventToPromise from 'event-to-promise'

export default class RemoteHandlerAbstract {
  constructor (remote) {
    this._remote = this._getInfo({...remote})
  }

  _getInfo (remote) {
    throw new Error('Not implemented')
  }

  async sync () {
    return await this._sync()
  }

  async _sync () {
    throw new Error('Not implemented')
  }

  async forget () {
    return await this._forget()
  }

  async _forget () {
    throw new Error('Not implemented')
  }

  async outputFile (file, data, options) {
    return await this._outputFile(file, data, options)
  }

  async _outputFile (file, data, options) {
    const stream = this.createOutputStream(file)
    const promise = eventToPromise(stream, 'finish')
    stream.end(data)
    return promise
  }

  async readFile (file, options) {
    return await this._readFile(file, options)
  }

  async _readFile (file, options) {
    const stream = this.createReadStream(file, options)
    let data = ''
    stream.on('data', d => data += d)
    await eventToPromise(stream, 'end')
    return data
  }

  async rename (oldPath, newPath) {
    return await this._rename(oldPath, newPath)
  }

  async _rename (oldPath, newPath) {
    throw new Error('Not implemented')
  }

  async list (dir = '.') {
    return await this._list(dir)
  }

  async _list (dir = '.') {
    throw new Error('Not implemented')
  }

  async createReadStream (file, options) {
    const length = await this.getSize(file)
    const stream = await this._createReadStream(file)
    stream.length = length
    return stream
  }

  async _createReadStream (file, options) {
    throw new Error('Not implemented')
  }

  async createOutputStream (file, options) {
    return await this._createOutputStream(file, options)
  }

  async _createOutputStream (file, options) {
    throw new Error('Not implemented')
  }

  async unlink (file) {
    return await this._unlink(file)
  }

  async _unlink (file) {
    throw new Error('Not implemented')
  }

  async getSize (file) {
    return await this._getSize(file)
  }

  async _getSize (file) {
    throw new Error('Not implement')
  }
}
