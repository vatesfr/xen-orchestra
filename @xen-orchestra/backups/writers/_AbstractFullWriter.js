const { AbstractWriter } = require('./_AbstractWriter.js')

exports.AbstractFullWriter = class AbstractFullWriter extends AbstractWriter {
  run({ timestamp, sizeContainer, stream }) {
    throw new Error('Not implemented')
  }
}
