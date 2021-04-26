const { AbstractWriter } = require('./_AbstractWriter.js')

exports.AbstractDeltaWriter = class AbstractDeltaWriter extends AbstractWriter {
  checkBaseVdis(baseUuidToSrcVdi, baseVm) {
    throw new Error('Not implemented')
  }

  cleanup() {
    throw new Error('Not implemented')
  }

  prepare({ isFull }) {
    throw new Error('Not implemented')
  }

  transfer({ timestamp, deltaExport, sizeContainers }) {
    throw new Error('Not implemented')
  }
}
