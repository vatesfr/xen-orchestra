import { AbstractWriter } from './_AbstractWriter.mjs'

export class AbstractFullWriter extends AbstractWriter {
  async run({ checksum, maxStreamLength, timestamp, sizeContainer, stream, streamLength, vm, vmSnapshot }) {
    try {
      return await this._run({
        checksum,
        maxStreamLength,
        timestamp,
        sizeContainer,
        stream,
        streamLength,
        vm,
        vmSnapshot,
      })
    } finally {
      // ensure stream is properly closed
      stream.destroy()
    }
  }
}
