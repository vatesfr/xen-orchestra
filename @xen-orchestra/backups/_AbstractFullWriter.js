const { AbstractWriter } = require('./_AbstractWriter')

exports.AbstractFullWriter = class AbstractFullWriter extends AbstractWriter {
  run() {
    throw new Error('Not implemented')
  }
}
