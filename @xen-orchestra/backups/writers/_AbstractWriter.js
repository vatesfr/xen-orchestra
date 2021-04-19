exports.AbstractWriter = class AbstractWriter {
  beforeBackup() {
    throw new Error('Not implemented')
  }
}
