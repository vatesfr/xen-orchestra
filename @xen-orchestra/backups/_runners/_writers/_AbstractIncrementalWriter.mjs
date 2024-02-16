import { AbstractWriter } from './_AbstractWriter.mjs'

export class AbstractIncrementalWriter extends AbstractWriter {
  checkBaseVdis(baseUuidToSrcVdi, baseVm) {
    throw new Error('Not implemented')
  }

  updateUuidAndChain() {
    throw new Error('Not implemented')
  }

  cleanup() {
    throw new Error('Not implemented')
  }

  prepare({ isFull }) {
    throw new Error('Not implemented')
  }

  async transfer({ deltaExport, ...other }) {
    try {
      return await this._transfer({ deltaExport, ...other })
    } finally {
      // ensure all streams are properly closed
      for (const stream of Object.values(deltaExport.streams)) {
        stream.destroy()
      }
    }
  }
}
