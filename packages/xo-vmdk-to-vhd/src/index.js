import asyncIteratorToStream from 'async-iterator-to-stream'
import createReadableSparseStream from 'vhd-lib/createReadableSparseStream.js'
import { parseOVAFile, ParsableFile } from './ova-read'
import VMDKDirectParser from './vmdk-read'
import { generateVmdkData } from './vmdk-generate'
import { writeOvaOn } from './ova-generate'
import { parseVhdToBlocks } from './parseVhdToBlocks'

export { default as readVmdkGrainTable, readCapacityAndGrainTable } from './vmdk-read-table'

/**
 *
 * @param vmdkReadStream
 * @param grainLogicalAddressList iterable of LBAs in VMDK grain size
 * @param grainFileOffsetList iterable of offsets in sectors (512 bytes)
 * @param gzipped
 * @returns a stream whose bytes represent a VHD file containing the VMDK data
 */
async function vmdkToVhd(vmdkReadStream, grainLogicalAddressList, grainFileOffsetList, gzipped = false, length) {
  const parser = new VMDKDirectParser(vmdkReadStream, grainLogicalAddressList, grainFileOffsetList, gzipped, length)
  const header = await parser.readHeader()
  return createReadableSparseStream(
    header.capacitySectors * 512,
    header.grainSizeSectors * 512,
    grainLogicalAddressList,
    parser.blockIterator()
  )
}

export async function computeVmdkLength(diskName, vhdReadStream) {
  let length = 0
  for await (const b of await vhdToVMDKIterator(diskName, vhdReadStream)) {
    length += b.length
  }
  return length
}

/**
 * @param diskName
 * @param vhdReadStreamGetter an async function whose call brings a fresh VHD readStream.
 * We need to read the VHD twice when generating OVA files to get the VMDK file length.
 * @param withLength if true, the returned VMDK stream will have its `length` field set. The VHD stream will be entirely read to compute it.
 * @returns a readable stream representing a VMDK file
 */
export async function vhdToVMDK(diskName, vhdReadStreamGetter, withLength = false) {
  let length
  if (withLength) {
    length = await computeVmdkLength(diskName, await vhdReadStreamGetter())
  }
  const iterable = await vhdToVMDKIterator(diskName, await vhdReadStreamGetter())
  const stream = await asyncIteratorToStream(iterable)
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
export async function vhdToVMDKIterator(diskName, vhdReadStream) {
  const { blockSize, blocks, diskSize, geometry } = await parseVhdToBlocks(vhdReadStream)
  return generateVmdkData(diskName, diskSize, blockSize, blocks, geometry)
}

export { ParsableFile, parseOVAFile, vmdkToVhd, writeOvaOn }
