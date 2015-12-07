export default class RemoteHandlerAbstract {
  constructor (remote) {
    this._remote = remote
  }

  set (remote) {
    this._remote = remote
  }

  async sync () {
    throw new Error('Not implemented')
  }

  async forget () {
    throw new Error('Not implemented')
  }

  async outputFile (file, data, options) {
    throw new Error('Not implemented')
  }

  async readFile (file, options) {
    throw new Error('Not implemented')
  }

  async rename (oldPath, newPath) {
    throw new Error('Not implemented')
  }

  async list (dir = undefined) {
    throw new Error('Not implemented')
  }

  async createReadStream (file) {
    throw new Error('Not implemented')
  }

  async createOutputStream (file) {
    throw new Error('Not implemented')
  }

  async unlink (file) {
    throw new Error('Not implemented')
  }

  async getSize (file) {
    throw new Error('Not implement')
  }
}
