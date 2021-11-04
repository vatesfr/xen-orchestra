/* eslint-env jest */

import execa from 'execa'
import fs from 'fs-extra'
import getStream from 'get-stream'
import rimraf from 'rimraf'
import tmp from 'tmp'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { randomBytes } from 'crypto'

import { VhdFile } from './VhdFile'

import { SECTOR_SIZE } from '../_constants'
import { checkFile, createRandomFile, convertFromRawToVhd, recoverRawContent } from '../tests/utils'

let tempDir = null

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

test('blocks can be moved', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSize)
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  const handler = getHandler({ url: 'file://' })
  const originalSize = await handler.getSize(rawFileName)
  const newVhd = new VhdFile(handler, vhdFileName)
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd._freeFirstBlockSpace(8000000)
  const recoveredFileName = `${tempDir}/recovered`
  await recoverRawContent(vhdFileName, recoveredFileName, originalSize)
  expect(await fs.readFile(recoveredFileName)).toEqual(await fs.readFile(rawFileName))
})

test('the BAT MSB is not used for sign', async () => {
  const randomBuffer = await pFromCallback(cb => randomBytes(SECTOR_SIZE, cb))
  const emptyFileName = `${tempDir}/empty.vhd`
  await execa('qemu-img', ['create', '-fvpc', emptyFileName, '1.8T'])
  const handler = getHandler({ url: 'file://' })
  const vhd = new VhdFile(handler, emptyFileName)
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
    const vhd2 = new VhdFile(handler, emptyFileName)
    await vhd2.readHeaderAndFooter()
    await vhd2.readBlockAllocationTable()
    for (let i = 0; i < vhd.header.maxTableEntries; i++) {
      if (vhd.containsBlock(i)) {
        const block = (await vhd2.readBlock(i)).data
        await fs.write(recoveredFile, block, 0, block.length, vhd2.header.blockSize * i)
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
  const newVhd = new VhdFile(handler, emptyFileName)
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
  const newVhd = new VhdFile(handler, emptyFileName)
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  const splitPointSectors = 2
  await newVhd.writeData(0, randomData.slice(0, splitPointSectors * 512))
  await newVhd.writeData(splitPointSectors, randomData.slice(splitPointSectors * 512))
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
  const newVhd = new VhdFile(handler, emptyFileName)
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  const endFirstWrite = 3
  const startSecondWrite = 2
  await newVhd.writeData(0, randomData.slice(0, endFirstWrite * 512))
  await newVhd.writeData(startSecondWrite, randomData.slice(startSecondWrite * 512))
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
  const newVhd = new VhdFile(handler, vhdFileName)
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd.ensureBatSize(2000)
  await newVhd.writeBlockAllocationTable()
  await recoverRawContent(vhdFileName, recoveredFileName, originalSize)
  expect(await fs.readFile(recoveredFileName)).toEqual(await fs.readFile(rawFileName))
})
