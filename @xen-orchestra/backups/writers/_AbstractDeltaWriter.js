exports.AbstractDeltaWriter = class AbstractDeltaWriter {
  checkBaseVdis() {
    throw new Error('Not implemented')
  }

  cleanup() {
    throw new Error('Not implemented')
  }

  prepare() {
    throw new Error('Not implemented')
  }

  transfer() {
    throw new Error('Not implemented')
  }
}
