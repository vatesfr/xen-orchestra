/* eslint-env jest */

import execa from 'execa'
import fromEvent from 'promise-toolbox/fromEvent'
import getStream from 'get-stream'
import rimraf from 'rimraf'
import tmp from 'tmp'

import { createReadStream, createWriteStream, stat } from 'fs-extra'
import { pFromCallback } from 'promise-toolbox'
import { vmdkToVhd, readVmdkGrainTable } from '.'
import VMDKDirectParser from './vmdk-read'
import { generateVmdkData } from './vmdk-generate'
import asyncIteratorToStream from 'async-iterator-to-stream'

const initialDir = process.cwd()
jest.setTimeout(100000)

beforeEach(async () => {
  const dir = await pFromCallback(cb => tmp.dir(cb))
  process.chdir(dir)
})

afterEach(async () => {
  const tmpDir = process.cwd()
  process.chdir(initialDir)
  await pFromCallback(cb => rimraf(tmpDir, cb))
})

function bufferToArray(buffer) {
  const view = new DataView(buffer)
  const res = []
  for (let i = 0; i < buffer.byteLength; i += 4) {
    res.push(view.getUint32(i, true))
  }
  return res
}

function createFileAccessor(file) {
  return async (start, end) => {
    if (start < 0 || end < 0) {
      const fileLength = (await stat(file)).size
      start = start < 0 ? fileLength + start : start
      end = end < 0 ? fileLength + end : end
    }
    const result = await getStream.buffer(createReadStream(file, { start, end: end - 1 }))
    // crazy stuff to get a browser-compatible ArrayBuffer from a node buffer
    // https://stackoverflow.com/a/31394257/72637
    return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength)
  }
}

test('VMDK to VHD can convert a random data file with VMDKDirectParser', async () => {
  const inputRawFileName = 'random-data.raw'
  const vmdkFileName = 'random-data.vmdk'
  const vhdFileName = 'from-vmdk-VMDKDirectParser.vhd'
  const reconvertedFromVhd = 'from-vhd.raw'
  const reconvertedFromVmdk = 'from-vhd-by-vbox.raw'
  const dataSize = 100 * 1024 * 1024 // this number is an integer head/cylinder/count equation solution
  try {
    await execa('base64 /dev/urandom | head -c ' + dataSize + ' > ' + inputRawFileName, [], { shell: true })
    await execa('python /usr/share/pyshared/VMDKstream.py ' + inputRawFileName + ' ' + vmdkFileName, [], {
      shell: true,
    })
    const result = await readVmdkGrainTable(createFileAccessor(vmdkFileName))
    const pipe = (
      await vmdkToVhd(
        createReadStream(vmdkFileName),
        bufferToArray(result.grainLogicalAddressList),
        bufferToArray(result.grainFileOffsetList)
      )
    ).pipe(createWriteStream(vhdFileName))
    await fromEvent(pipe, 'finish')
    await execa('vhd-util', ['check', '-p', '-b', '-t', '-n', vhdFileName])
    await execa('qemu-img', ['convert', '-fvmdk', '-Oraw', vmdkFileName, reconvertedFromVmdk])
    await execa('qemu-img', ['convert', '-fvpc', '-Oraw', vhdFileName, reconvertedFromVhd])
    await execa('qemu-img', ['compare', inputRawFileName, vhdFileName])
    await execa('qemu-img', ['compare', vmdkFileName, vhdFileName])
  } catch (error) {
    console.error(error.stdout)
    console.error(error.stderr)
    console.error(error.message)
    throw error
  }
})

test('Can generate an empty VMDK file', async () => {
  const readStream = asyncIteratorToStream(await generateVmdkData('result.vmdk', 1024 * 1024 * 1024, 1024 * 1024, []))
  const pipe = readStream.pipe(createWriteStream('result.vmdk'))
  await fromEvent(pipe, 'finish')
  await execa('qemu-img', ['check', 'result.vmdk'])
})

test('Can generate a small VMDK file', async () => {
  const defaultVhdToVmdkRatio = 16
  const blockSize = 1024 * 1024
  const b1 = Buffer.allocUnsafe(blockSize)
  const b2 = Buffer.allocUnsafe(blockSize)
  const blockGenerator = [
    { lba: 0, block: b1 },
    { lba: blockSize, block: b2 },
  ]
  const fileName = 'result.vmdk'
  const geometry = { sectorsPerTrackCylinder: 63, heads: 16, cylinders: 10402 }
  const readStream = asyncIteratorToStream(
    await generateVmdkData(fileName, 2 * blockSize, blockSize, blockGenerator, geometry)
  )
  const pipe = readStream.pipe(createWriteStream(fileName))
  await fromEvent(pipe, 'finish')

  const expectedLBAs = []
  for (let i = 0; i < blockGenerator.length; i++) {
    for (let j = 0; j < defaultVhdToVmdkRatio; j++) {
      expectedLBAs.push(expectedLBAs.length)
    }
  }
  const data = await readVmdkGrainTable(createFileAccessor(fileName))
  expect(bufferToArray(data.grainLogicalAddressList)).toEqual(expectedLBAs)
  const grainFileOffsetList = bufferToArray(data.grainFileOffsetList)
  const parser = new VMDKDirectParser(
    createReadStream(fileName),
    bufferToArray(data.grainLogicalAddressList),
    grainFileOffsetList,
    false
  )
  await parser.readHeader()
  const resLbas = []
  const resBuffers = []
  const DEFAULT_GRAIN_SIZE = 65536
  for await (const b of parser.blockIterator()) {
    resLbas.push(b.logicalAddressBytes / DEFAULT_GRAIN_SIZE)
    resBuffers.push(b.data)
  }
  const resultBuffer = Buffer.concat(resBuffers)
  const startingBuffer = Buffer.concat([b1, b2])
  expect(resultBuffer).toEqual(startingBuffer)
  expect(resLbas).toEqual(expectedLBAs)

  await execa('qemu-img', ['check', 'result.vmdk'])
})
