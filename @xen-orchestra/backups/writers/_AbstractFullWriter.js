'use strict'

const { AbstractWriter } = require('./_AbstractWriter.js')

exports.AbstractFullWriter = class AbstractFullWriter extends AbstractWriter {
  async run({ timestamp, sizeContainer, stream }) {
    try {
      return await this._run({ timestamp, sizeContainer, stream })
    } finally {
      // ensure stream is properly closed
      stream.destroy()
    }
  }
}
