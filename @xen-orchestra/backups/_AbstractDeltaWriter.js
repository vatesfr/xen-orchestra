const { AbstractWriter } = require('./_AbstractWriter')

exports.AbstractDeltaWriter = class AbstractDeltaWriter extends AbstractWriter {
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
