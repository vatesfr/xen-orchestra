import { createReadableSparseStream } from 'vhd-lib'

import VMDKDirectParser from './vmdk-read'
export {
  default as readVmdkGrainTable,
  readCapacityAndGrainTable,
} from './vmdk-read-table'

async function convertFromVMDK(vmdkReadStream, blocksTable, grainTable) {
  const parser = new VMDKDirectParser(vmdkReadStream, blocksTable, grainTable)
  const header = await parser.readHeader()
  return createReadableSparseStream(
    header.capacitySectors * 512,
    header.grainSizeSectors * 512,
    blocksTable,
    parser.blockIterator()
  )
}
export { convertFromVMDK as default }
