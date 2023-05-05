'use strict'

const { AbstractWriter } = require('./_AbstractWriter.js')

exports.AbstractIncrementalWriter = class AbstractIncrementalWriter extends AbstractWriter {
  checkBaseVdis(baseUuidToSrcVdi, baseVm) {
    throw new Error('Not implemented')
  }

  cleanup() {
    throw new Error('Not implemented')
  }

  prepare({ isBase }) {
    throw new Error('Not implemented')
  }

  async transfer({ timestamp, deltaExport, sizeContainers }) {
    try {
      return await this._transfer({ timestamp, deltaExport, sizeContainers })
    } finally {
      // ensure all streams are properly closed
      for (const stream of Object.values(deltaExport.streams)) {
        stream.destroy()
      }
    }
  }
}
