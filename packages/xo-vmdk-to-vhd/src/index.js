import { createReadableSparseStream } from 'vhd-lib'

import VMDKDirectParser from './vmdk-read'
import readVmdkGrainTable from './vmdk-read-table'

async function convertFromVMDK(vmdkReadStream, table) {
  const parser = new VMDKDirectParser(vmdkReadStream)
  const header = await parser.readHeader()
  return createReadableSparseStream(
    header.capacitySectors * 512,
    header.grainSizeSectors * 512,
    table,
    parser.blockIterator()
  )
}

export { convertFromVMDK as default, readVmdkGrainTable }
