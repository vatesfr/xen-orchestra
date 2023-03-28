import LocalHandler from './local'

export default class NullHandler extends LocalHandler {
  get type() {
    return 'null'
  }
  _outputStream() {}
  _writeFile(file, data, options) {
    if (file.indexOf('xo-vm-backups') === -1) {
      // metadata, remote tests
      return super._writeFile(file, data, options)
    }
  }
}
