import { createReadableSparseStream, parseVhdToBlocks } from 'vhd-lib'
import asyncIteratorToStream from 'async-iterator-to-stream'
import { parseOVAFile, ParsableFile } from './ova-read'
import VMDKDirectParser from './vmdk-read'
import { generateVmdkData } from './vmdk-generate'
import { createOvaStream } from './ova-generate'

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
 * the returned stream will have its length set IIF compress === false
 * @param diskName
 * @param vhdReadStream
 * @param compress
 * @returns a readable stream representing a VMDK file
 */
async function vhdToVMDK(diskName, vhdReadStream, compress = false) {
  const { blockSizeBytes, blockGenerator, capacityBytes, geometry, blockCount } = await parseVhdToBlocks(vhdReadStream)
  const iterable = generateVmdkData(diskName, capacityBytes, blockSizeBytes, blockCount, blockGenerator, geometry)
  const stream = asyncIteratorToStream(iterable)
  stream.length = iterable.length
  return stream
}

export { ParsableFile, parseOVAFile, vmdkToVhd, vhdToVMDK, createOvaStream }
