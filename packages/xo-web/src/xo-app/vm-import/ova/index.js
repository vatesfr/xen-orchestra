import fromEvent from 'promise-toolbox/fromEvent'
import { parseOVAFile, ParsableFile } from 'xo-vmdk-to-vhd'

/* global FileReader */

class BrowserParsableFile extends ParsableFile {
  constructor(file) {
    super()
    this._file = file
  }

  slice(start, end) {
    return new BrowserParsableFile(this._file.slice(start, end))
  }

  async read() {
    const reader = new FileReader()
    reader.readAsArrayBuffer(this._file)
    return (await fromEvent(reader, 'loadend')).target.result
  }
}

async function parseTarFile(file) {
  return await parseOVAFile(new BrowserParsableFile(file), (buffer, encoding) =>
    new TextDecoder(encoding).decode(buffer)
  )
}

export { parseTarFile as default }
