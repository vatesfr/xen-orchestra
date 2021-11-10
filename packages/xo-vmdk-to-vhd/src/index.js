import { createReadableSparseStream, parseVhdToBlocks } from 'vhd-lib'
import asyncIteratorToStream from 'async-iterator-to-stream'
import { parseOVAFile, ParsableFile } from './ova'
import VMDKDirectParser from './vmdk-read'
import { generateVmdkData } from './vmdk-generate'

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
  const { blockSizeBytes, blockGenerator, capacityBytes, geometry } = await parseVhdToBlocks(vhdReadStream)
  return asyncIteratorToStream(generateVmdkData(diskName, capacityBytes, blockSizeBytes, blockGenerator, geometry))
}

export { ParsableFile, parseOVAFile, vmdkToVhd, vhdToVMDK }
