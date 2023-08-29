import { AbstractWriter } from './_AbstractWriter.mjs'

export class AbstractFullWriter extends AbstractWriter {
  async run({ timestamp, sizeContainer, stream, vm, vmSnapshot }) {
    try {
      return await this._run({ timestamp, sizeContainer, stream, vm, vmSnapshot })
    } finally {
      // ensure stream is properly closed
      stream.destroy()
    }
  }
}
