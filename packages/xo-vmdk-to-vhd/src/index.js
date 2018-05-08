import { createReadableSparseStream } from 'vhd-lib'

import { VMDKDirectParser, readVmdkGrainTable } from './vmdk-read'

async function convertFromVMDK (vmdkReadStream, table) {
  const parser = new VMDKDirectParser(vmdkReadStream)
  const header = await parser.readHeader()
  return createReadableSparseStream(
    header.capacitySectors * 512,
    header.grainSizeSectors * 512,
    table,
    parser
  )
}

export { convertFromVMDK as default, readVmdkGrainTable }
