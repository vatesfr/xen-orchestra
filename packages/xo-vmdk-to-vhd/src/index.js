import { createReadableSparseStream } from 'vhd-lib'
import { parseOVAFile, ParsableFile } from './ova'

import VMDKDirectParser from './vmdk-read'

export {
  default as readVmdkGrainTable,
  readCapacityAndGrainTable,
} from './vmdk-read-table'

async function vmdkToVhd(
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

export { ParsableFile, parseOVAFile, vmdkToVhd }
