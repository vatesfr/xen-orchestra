/* eslint-env jest */

import asyncIteratorToStream from 'async-iterator-to-stream'
import execa from 'execa'
import fs from 'fs-extra'
import getStream from 'get-stream'
import rimraf from 'rimraf'
import tmp from 'tmp'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { pipeline } from 'readable-stream'
import { randomBytes } from 'crypto'

import Vhd, { chainVhd, createSyntheticStream, mergeVhd as vhdMerge } from './'

import { SECTOR_SIZE } from './src/_constants'

let tempDir = null

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

async function createRandomFile(name, sizeMB) {
  const createRandomStream = asyncIteratorToStream(function*(size) {
    while (size-- > 0) {
      yield Buffer.from([Math.floor(Math.random() * 256)])
    }
  })
  const input = createRandomStream(sizeMB * 1024 * 1024)
  await pFromCallback(cb => pipeline(input, fs.createWriteStream(name), cb))
}

async function checkFile(vhdName) {
  await execa('vhd-util', ['check', '-p', '-b', '-t', '-n', vhdName])
}

async function recoverRawContent(vhdName, rawName, originalSize) {
  await checkFile(vhdName)
  await execa('qemu-img', ['convert', '-fvpc', '-Oraw', vhdName, rawName])
  if (originalSize !== undefined) {
    await execa('truncate', ['-s', originalSize, rawName])
  }
}

async function convertFromRawToVhd(rawName, vhdName) {
  await execa('qemu-img', ['convert', '-f', 'raw', '-Ovpc', rawName, vhdName])
}

test('blocks can be moved', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSize)
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  const handler = getHandler({ url: 'file://' })
  const originalSize = await handler.getSize(rawFileName)
  const newVhd = new Vhd(handler, vhdFileName)
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd._freeFirstBlockSpace(8000000)
  const recoveredFileName = `${tempDir}/recovered`
  await recoverRawContent(vhdFileName, recoveredFileName, originalSize)
  expect(await fs.readFile(recoveredFileName)).toEqual(
    await fs.readFile(rawFileName)
  )
})

test('the BAT MSB is not used for sign', async () => {
  const randomBuffer = await pFromCallback(cb => randomBytes(SECTOR_SIZE, cb))
  const emptyFileName = `${tempDir}/empty.vhd`
  await execa('qemu-img', ['create', '-fvpc', emptyFileName, '1.8T'])
  const handler = getHandler({ url: 'file://' })
  const vhd = new Vhd(handler, emptyFileName)
  await vhd.readHeaderAndFooter()
  await vhd.readBlockAllocationTable()
  // we want the bit 31 to be on, to prove it's not been used for sign
  const hugeWritePositionSectors = Math.pow(2, 31) + 200
  await vhd.writeData(hugeWritePositionSectors, randomBuffer)
  await checkFile(emptyFileName)
  // here we are moving the first sector very far in the VHD to prove the BAT doesn't use signed int32
  const hugePositionBytes = hugeWritePositionSectors * SECTOR_SIZE
  await vhd._freeFirstBlockSpace(hugePositionBytes)

  // we recover the data manually for speed reasons.
  // fs.write() with offset is way faster than qemu-img when there is a 1.5To
  // hole before the block of data
  const recoveredFileName = `${tempDir}/recovered`
  const recoveredFile = await fs.open(recoveredFileName, 'w')
  try {
    const vhd2 = new Vhd(handler, emptyFileName)
    await vhd2.readHeaderAndFooter()
    await vhd2.readBlockAllocationTable()
    for (let i = 0; i < vhd.header.maxTableEntries; i++) {
      const entry = vhd._getBatEntry(i)
      if (entry !== 0xffffffff) {
        const block = (await vhd2._readBlock(i)).data
        await fs.write(
          recoveredFile,
          block,
          0,
          block.length,
          vhd2.header.blockSize * i
        )
      }
    }
  } finally {
    fs.close(recoveredFile)
  }
  const recovered = await getStream.buffer(
    await fs.createReadStream(recoveredFileName, {
      start: hugePositionBytes,
      end: hugePositionBytes + randomBuffer.length - 1,
    })
  )
  expect(recovered).toEqual(randomBuffer)
})

test('writeData on empty file', async () => {
  const mbOfRandom = 3
  const rawFileName = `${tempDir}/randomfile`
  const emptyFileName = `${tempDir}/empty.vhd`
  await createRandomFile(rawFileName, mbOfRandom)
  await execa('qemu-img', ['create', '-fvpc', emptyFileName, mbOfRandom + 'M'])
  const randomData = await fs.readFile(rawFileName)
  const handler = getHandler({ url: 'file://' })
  const originalSize = await handler.getSize(rawFileName)
  const newVhd = new Vhd(handler, emptyFileName)
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd.writeData(0, randomData)
  const recoveredFileName = `${tempDir}/recovered`
  await recoverRawContent(emptyFileName, recoveredFileName, originalSize)
  expect(await fs.readFile(recoveredFileName)).toEqual(randomData)
})

test('writeData in 2 non-overlaping operations', async () => {
  const mbOfRandom = 3
  const rawFileName = `${tempDir}/randomfile`
  const emptyFileName = `${tempDir}/empty.vhd`
  const recoveredFileName = `${tempDir}/recovered`
  await createRandomFile(rawFileName, mbOfRandom)
  await execa('qemu-img', ['create', '-fvpc', emptyFileName, mbOfRandom + 'M'])
  const randomData = await fs.readFile(rawFileName)
  const handler = getHandler({ url: 'file://' })
  const originalSize = await handler.getSize(rawFileName)
  const newVhd = new Vhd(handler, emptyFileName)
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  const splitPointSectors = 2
  await newVhd.writeData(0, randomData.slice(0, splitPointSectors * 512))
  await newVhd.writeData(
    splitPointSectors,
    randomData.slice(splitPointSectors * 512)
  )
  await recoverRawContent(emptyFileName, recoveredFileName, originalSize)
  expect(await fs.readFile(recoveredFileName)).toEqual(randomData)
})

test('writeData in 2 overlaping operations', async () => {
  const mbOfRandom = 3
  const rawFileName = `${tempDir}/randomfile`
  const emptyFileName = `${tempDir}/empty.vhd`
  const recoveredFileName = `${tempDir}/recovered`
  await createRandomFile(rawFileName, mbOfRandom)
  await execa('qemu-img', ['create', '-fvpc', emptyFileName, mbOfRandom + 'M'])
  const randomData = await fs.readFile(rawFileName)
  const handler = getHandler({ url: 'file://' })
  const originalSize = await handler.getSize(rawFileName)
  const newVhd = new Vhd(handler, emptyFileName)
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  const endFirstWrite = 3
  const startSecondWrite = 2
  await newVhd.writeData(0, randomData.slice(0, endFirstWrite * 512))
  await newVhd.writeData(
    startSecondWrite,
    randomData.slice(startSecondWrite * 512)
  )
  await recoverRawContent(emptyFileName, recoveredFileName, originalSize)
  expect(await fs.readFile(recoveredFileName)).toEqual(randomData)
})

test('BAT can be extended and blocks moved', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  const recoveredFileName = `${tempDir}/recovered`
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await createRandomFile(rawFileName, initalSize)
  await convertFromRawToVhd(rawFileName, vhdFileName)
  const handler = getHandler({ url: 'file://' })
  const originalSize = await handler.getSize(rawFileName)
  const newVhd = new Vhd(handler, vhdFileName)
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd.ensureBatSize(2000)
  await recoverRawContent(vhdFileName, recoveredFileName, originalSize)
  expect(await fs.readFile(recoveredFileName)).toEqual(
    await fs.readFile(rawFileName)
  )
})

test('coalesce works with empty parent files', async () => {
  const mbOfRandom = 2
  const rawFileName = `${tempDir}/randomfile`
  const emptyFileName = `${tempDir}/empty.vhd`
  const vhdFileName = `${tempDir}/randomfile.vhd`
  const recoveredFileName = `${tempDir}/recovered`
  await createRandomFile(rawFileName, mbOfRandom)
  await convertFromRawToVhd(rawFileName, vhdFileName)
  await execa('qemu-img', [
    'create',
    '-fvpc',
    emptyFileName,
    mbOfRandom + 1 + 'M',
  ])
  await checkFile(vhdFileName)
  await checkFile(emptyFileName)
  const handler = getHandler({ url: 'file://' })
  const originalSize = await handler._getSize(rawFileName)
  await chainVhd(handler, emptyFileName, handler, vhdFileName, true)
  await checkFile(vhdFileName)
  await checkFile(emptyFileName)
  await vhdMerge(handler, emptyFileName, handler, vhdFileName)
  await recoverRawContent(emptyFileName, recoveredFileName, originalSize)
  expect(await fs.readFile(recoveredFileName)).toEqual(
    await fs.readFile(rawFileName)
  )
})

test('coalesce works in normal cases', async () => {
  const mbOfRandom = 5
  const randomFileName = `${tempDir}/randomfile`
  const random2FileName = `${tempDir}/randomfile2`
  const smallRandomFileName = `${tempDir}/small_randomfile`
  const parentFileName = `${tempDir}/parent.vhd`
  const child1FileName = `${tempDir}/child1.vhd`
  const child2FileName = `${tempDir}/child2.vhd`
  const recoveredFileName = `${tempDir}/recovered`
  await createRandomFile(randomFileName, mbOfRandom)
  await createRandomFile(smallRandomFileName, Math.ceil(mbOfRandom / 2))
  await execa('qemu-img', [
    'create',
    '-fvpc',
    parentFileName,
    mbOfRandom + 1 + 'M',
  ])
  await convertFromRawToVhd(randomFileName, child1FileName)
  const handler = getHandler({ url: 'file://' })
  await execa('vhd-util', [
    'snapshot',
    '-n',
    child2FileName,
    '-p',
    child1FileName,
  ])
  const vhd = new Vhd(handler, child2FileName)
  await vhd.readHeaderAndFooter()
  await vhd.readBlockAllocationTable()
  vhd.footer.creatorApplication = 'xoa'
  await vhd.writeFooter()

  const originalSize = await handler._getSize(randomFileName)
  await chainVhd(handler, parentFileName, handler, child1FileName, true)
  await execa('vhd-util', ['check', '-t', '-n', child1FileName])
  await chainVhd(handler, child1FileName, handler, child2FileName, true)
  await execa('vhd-util', ['check', '-t', '-n', child2FileName])
  const smallRandom = await fs.readFile(smallRandomFileName)
  const newVhd = new Vhd(handler, child2FileName)
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd.writeData(5, smallRandom)
  await checkFile(child2FileName)
  await checkFile(child1FileName)
  await checkFile(parentFileName)
  await vhdMerge(handler, parentFileName, handler, child1FileName)
  await checkFile(parentFileName)
  await chainVhd(handler, parentFileName, handler, child2FileName, true)
  await checkFile(child2FileName)
  await vhdMerge(handler, parentFileName, handler, child2FileName)
  await checkFile(parentFileName)
  await recoverRawContent(parentFileName, recoveredFileName, originalSize)
  await execa('cp', [randomFileName, random2FileName])
  const fd = await fs.open(random2FileName, 'r+')
  try {
    await fs.write(fd, smallRandom, 0, smallRandom.length, 5 * SECTOR_SIZE)
  } finally {
    await fs.close(fd)
  }
  expect(await fs.readFile(recoveredFileName)).toEqual(
    await fs.readFile(random2FileName)
  )
})

test.only('createSyntheticStream passes vhd-util check', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  const vhdFileName = `${tempDir}/randomfile.vhd`
  const recoveredVhdFileName = `${tempDir}/recovered.vhd`
  await createRandomFile(rawFileName, initalSize)
  await convertFromRawToVhd(rawFileName, vhdFileName)
  await checkFile(vhdFileName)
  const handler = getHandler({ url: 'file://' })
  const stream = await createSyntheticStream(handler, vhdFileName)
  const expectedVhdSize = (await fs.stat(vhdFileName)).size
  expect(stream.length).toEqual((await fs.stat(vhdFileName)).size)
  await pFromCallback(cb =>
    pipeline(stream, fs.createWriteStream(recoveredVhdFileName), cb)
  )
  await checkFile(recoveredVhdFileName)
  const stats = await fs.stat(recoveredVhdFileName)
  expect(stats.size).toEqual(expectedVhdSize)
  await execa('qemu-img', ['compare', recoveredVhdFileName, rawFileName])
})
