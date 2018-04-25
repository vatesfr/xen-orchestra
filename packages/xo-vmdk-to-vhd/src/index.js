import { createReadableRawStream } from 'vhd-lib'

import { VMDKDirectParser } from './vmdk-read'

async function convertFromVMDK (vmdkReadStream) {
  const parser = new VMDKDirectParser(vmdkReadStream)
  const header = await parser.readHeader()
  return createReadableRawStream(header.capacitySectors * 512, parser)
}

export { convertFromVMDK as default }
