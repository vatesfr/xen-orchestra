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
 * @param diskName
 * @param vhdReadStreamGetter an async function whose call brings a fresh VHD readStream.
 * We need to read the VHD twice when generating OVA files to get the VMDK file length.
 * @param withLength if true, the returned VMDK stream will have its `length` field set. The VHD stream will be entirely read to compute it.
 * @returns a readable stream representing a VMDK file
 */
async function vhdToVMDK(diskName, vhdReadStreamGetter, withLength = false) {
  let length
  if (withLength) {
    length = 0
    const i = await vhdToVMDKIterator(diskName, await vhdReadStreamGetter())
    for await (const b of i) {
      length += b.length
    }
  }
  const stream = await asyncIteratorToStream(vhdToVMDKIterator(diskName,await vhdReadStreamGetter()))
  if (withLength) {
    stream.length = length
  }
  return stream
}

/**
 * the returned stream will have its length set IIF compress === false
 * @param diskName
 * @param vhdReadStream
 * @returns a readable stream representing a VMDK file
 */
async function vhdToVMDKIterator(diskName, vhdReadStream) {
  const {
    blockSizeBytes,
    blockGenerator,
    capacityBytes,
    geometry,
    blockCount
  } = await parseVhdToBlocks(vhdReadStream)
  return generateVmdkData(diskName, capacityBytes, blockSizeBytes, blockCount, blockGenerator, geometry)
}

export { ParsableFile, parseOVAFile, vmdkToVhd, vhdToVMDK, createOvaStream }
