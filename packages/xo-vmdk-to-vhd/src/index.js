import createReadableSparseStream from 'vhd-lib/createReadableSparseStream.js'
import { parseOVAFile, ParsableFile } from './ova'
import VMDKDirectParser from './vmdk-read'
import { generateVmdkStream } from './vmdk-generate-monolithic-sparse'

export { default as readVmdkGrainTable, readCapacityAndGrainTable } from './vmdk-read-table'

/**
 *
 * @param vmdkReadStream
 * @param grainLogicalAddressList iterable of LBAs in VMDK grain size
 * @param grainFileOffsetList iterable of offsets in sectors (512 bytes)
 * @param gzipped
 * @returns a stream whose bytes represent a VHD file containing the VMDK data
 */
async function vmdkToVhd(vmdkReadStream, grainLogicalAddressList, grainFileOffsetList, gzipped = false) {
  const parser = new VMDKDirectParser(vmdkReadStream, grainLogicalAddressList, grainFileOffsetList, gzipped)
  const header = await parser.readHeader()
  return createReadableSparseStream(
    header.capacitySectors * 512,
    header.grainSizeSectors * 512,
    grainLogicalAddressList,
    parser.blockIterator()
  )
}

/**
 *
 * @param diskName
 * @param vhdReadStream
 * @returns a readable stream representing a VMDK file
 */
async function vhdToVMDK(diskName, vhdReadStream) {
  const stream = await generateVmdkStream(vhdReadStream)
  return stream
}

export { ParsableFile, parseOVAFile, vmdkToVhd, vhdToVMDK }
