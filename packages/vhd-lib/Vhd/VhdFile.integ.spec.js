'use strict'

/* eslint-env jest */

const execa = require('execa')
const fs = require('fs-extra')
const getStream = require('get-stream')
const rimraf = require('rimraf')
const tmp = require('tmp')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { Disposable, pFromCallback } = require('promise-toolbox')
const { randomBytes } = require('crypto')

const { VhdFile } = require('./VhdFile')
const { openVhd } = require('../openVhd')

const { SECTOR_SIZE } = require('../_constants')
const {
  checkFile,
  createRandomFile,
  convertFromRawToVhd,
  convertToVhdDirectory,
  recoverRawContent,
} = require('../tests/utils')

let tempDir = null
let handler
let disposeHandler

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))

  const d = await getSyncedHandler({ url: `file://${tempDir}` })
  handler = d.value
  disposeHandler = d.dispose
})

afterEach(async () => {
  await rimraf(tempDir)
  disposeHandler()
})

test('respect the checkSecondFooter flag', async () => {
  const initalSize = 0
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSize)
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)

  const size = await handler.getSize('randomfile.vhd')
  const fd = await handler.openFile('randomfile.vhd', 'r+')
  const buffer = Buffer.alloc(512, 0)
  // add a fake footer at the end
  handler.write(fd, buffer, size)
  await handler.closeFile(fd)
  // not using openVhd to be able to call readHeaderAndFooter separatly
  const vhd = new VhdFile(handler, 'randomfile.vhd')

  await expect(async () => await vhd.readHeaderAndFooter()).rejects.toThrow()
  await expect(async () => await vhd.readHeaderAndFooter(true)).rejects.toThrow()
  await expect(await vhd.readHeaderAndFooter(false)).toEqual(undefined)
})

test('blocks can be moved', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSize)
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new VhdFile(handler, 'randomfile.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd._freeFirstBlockSpace(8000000)
  const recoveredFileName = `${tempDir}/recovered`
  await recoverRawContent(vhdFileName, recoveredFileName, originalSize)
  expect((await fs.readFile(recoveredFileName)).equals(await fs.readFile(rawFileName))).toEqual(true)
})

test('the BAT MSB is not used for sign', async () => {
  const randomBuffer = await pFromCallback(cb => randomBytes(SECTOR_SIZE, cb))
  const emptyFileName = `${tempDir}/empty.vhd`
  await execa('qemu-img', ['create', '-fvpc', emptyFileName, '1.8T'])
  const vhd = new VhdFile(handler, 'empty.vhd')
  await vhd.readHeaderAndFooter()
  await vhd.readBlockAllocationTable()
  // we want the bit 31 to be on, to prove it's not been used for sign
  const hugeWritePositionSectors = Math.pow(2, 31) + 200
  await vhd.writeData(hugeWritePositionSectors, randomBuffer)
  await checkFile(emptyFileName)
  // here we are moving the first sector very far in the VHD to prove the BAT doesn't use signed int32
  const hugePositionBytes = hugeWritePositionSectors * SECTOR_SIZE
  await vhd._freeFirstBlockSpace(hugePositionBytes)
  await vhd.writeFooter()

  // we recover the data manually for speed reasons.
  // fs.write() with offset is way faster than qemu-img when there is a 1.5To
  // hole before the block of data
  const recoveredFileName = `${tempDir}/recovered`
  const recoveredFile = await fs.open(recoveredFileName, 'w')
  try {
    const vhd2 = new VhdFile(handler, 'empty.vhd')
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
  expect(recovered.equals(randomBuffer)).toEqual(true)
})

test('writeData on empty file', async () => {
  const mbOfRandom = 3
  const rawFileName = `${tempDir}/randomfile`
  const emptyFileName = `${tempDir}/empty.vhd`
  await createRandomFile(rawFileName, mbOfRandom)
  await execa('qemu-img', ['create', '-fvpc', emptyFileName, mbOfRandom + 'M'])
  const randomData = await fs.readFile(rawFileName)
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new VhdFile(handler, 'empty.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd.writeData(0, randomData)
  const recoveredFileName = `${tempDir}/recovered`
  await recoverRawContent(emptyFileName, recoveredFileName, originalSize)
  expect((await fs.readFile(recoveredFileName)).equals(randomData)).toEqual(true)
})

test('writeData in 2 non-overlaping operations', async () => {
  const mbOfRandom = 3
  const rawFileName = `${tempDir}/randomfile`
  const emptyFileName = `${tempDir}/empty.vhd`
  const recoveredFileName = `${tempDir}/recovered`
  await createRandomFile(rawFileName, mbOfRandom)
  await execa('qemu-img', ['create', '-fvpc', emptyFileName, mbOfRandom + 'M'])
  const randomData = await fs.readFile(rawFileName)
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new VhdFile(handler, 'empty.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  const splitPointSectors = 2
  await newVhd.writeData(0, randomData.slice(0, splitPointSectors * 512))
  await newVhd.writeData(splitPointSectors, randomData.slice(splitPointSectors * 512))
  await recoverRawContent(emptyFileName, recoveredFileName, originalSize)
  expect((await fs.readFile(recoveredFileName)).equals(randomData)).toEqual(true)
})

test('writeData in 2 overlaping operations', async () => {
  const mbOfRandom = 3
  const rawFileName = `${tempDir}/randomfile`
  const emptyFileName = `${tempDir}/empty.vhd`
  const recoveredFileName = `${tempDir}/recovered`
  await createRandomFile(rawFileName, mbOfRandom)
  await execa('qemu-img', ['create', '-fvpc', emptyFileName, mbOfRandom + 'M'])
  const randomData = await fs.readFile(rawFileName)
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new VhdFile(handler, 'empty.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  const endFirstWrite = 3
  const startSecondWrite = 2
  await newVhd.writeData(0, randomData.slice(0, endFirstWrite * 512))
  await newVhd.writeData(startSecondWrite, randomData.slice(startSecondWrite * 512))
  await recoverRawContent(emptyFileName, recoveredFileName, originalSize)
  expect((await fs.readFile(recoveredFileName)).equals(randomData)).toEqual(true)
})

test('BAT can be extended and blocks moved', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  const recoveredFileName = `${tempDir}/recovered`
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await createRandomFile(rawFileName, initalSize)
  await convertFromRawToVhd(rawFileName, vhdFileName)
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new VhdFile(handler, 'randomfile.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd.ensureBatSize(2000)
  await newVhd.writeBlockAllocationTable()
  await recoverRawContent(vhdFileName, recoveredFileName, originalSize)
  expect((await fs.readFile(recoveredFileName)).equals(await fs.readFile(rawFileName))).toEqual(true)
})

test('Can coalesce block', async () => {
  const initalSize = 4
  const parentrawFileName = `${tempDir}/randomfile`
  const parentFileName = `${tempDir}/parent.vhd`
  await createRandomFile(parentrawFileName, initalSize)
  await convertFromRawToVhd(parentrawFileName, parentFileName)
  const childrawFileName = `${tempDir}/randomfile`
  const childFileName = `${tempDir}/childFile.vhd`
  await createRandomFile(childrawFileName, initalSize)
  await convertFromRawToVhd(childrawFileName, childFileName)
  const childRawDirectoryName = `${tempDir}/randomFile2.vhd`
  const childDirectoryFileName = `${tempDir}/childDirFile.vhd`
  const childDirectoryName = `${tempDir}/childDir.vhd`
  await createRandomFile(childRawDirectoryName, initalSize)
  await convertFromRawToVhd(childRawDirectoryName, childDirectoryFileName)
  await convertToVhdDirectory(childRawDirectoryName, childDirectoryFileName, childDirectoryName)

  await Disposable.use(async function* () {
    const parentVhd = yield openVhd(handler, 'parent.vhd', { flags: 'r+' })
    await parentVhd.readBlockAllocationTable()
    const childFileVhd = yield openVhd(handler, 'childFile.vhd')
    await childFileVhd.readBlockAllocationTable()
    const childDirectoryVhd = yield openVhd(handler, 'childDir.vhd')
    await childDirectoryVhd.readBlockAllocationTable()

    await parentVhd.mergeBlock(childFileVhd, 0)
    await parentVhd.writeFooter()
    await parentVhd.writeBlockAllocationTable()
    let parentBlockData = (await parentVhd.readBlock(0)).data
    let childBlockData = (await childFileVhd.readBlock(0)).data
    expect(parentBlockData.equals(childBlockData)).toEqual(true)

    await parentVhd.mergeBlock(childDirectoryVhd, 0)
    await parentVhd.writeFooter()
    await parentVhd.writeBlockAllocationTable()
    parentBlockData = (await parentVhd.readBlock(0)).data
    childBlockData = (await childDirectoryVhd.readBlock(0)).data
    expect(parentBlockData.equals(childBlockData)).toEqual(true)
  })
})
