import { createReadableSparseStream } from 'vhd-lib'

import VMDKDirectParser from './vmdk-read'
export {
  default as readVmdkGrainTable,
  readCapacityAndGrainTable,
} from './vmdk-read-table'

async function convertFromVMDK(
  vmdkReadStream,
  grainLogicalAddressList,
  grainFileOffsetList
) {
  const parser = new VMDKDirectParser(
    vmdkReadStream,
    grainLogicalAddressList,
    grainFileOffsetList
  )
  const header = await parser.readHeader()
  return createReadableSparseStream(
    header.capacitySectors * 512,
    header.grainSizeSectors * 512,
    grainLogicalAddressList,
    parser.blockIterator()
  )
}
export { convertFromVMDK as default }
