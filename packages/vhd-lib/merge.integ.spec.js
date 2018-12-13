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

const initialDir = process.cwd()

jest.setTimeout(60000)

beforeEach(async () => {
  const dir = await pFromCallback(cb => tmp.dir(cb))
  process.chdir(dir)
})

afterEach(async () => {
  const tmpDir = process.cwd()
  process.chdir(initialDir)
  await pFromCallback(cb => rimraf(tmpDir, cb))
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
  await createRandomFile('randomfile', initalSize)
  await convertFromRawToVhd('randomfile', 'randomfile.vhd')
  const handler = getHandler({ url: 'file://' + process.cwd() + '/' })
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new Vhd(handler, 'randomfile.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd._freeFirstBlockSpace(8000000)
  await recoverRawContent('randomfile.vhd', 'recovered', originalSize)
  expect(await fs.readFile('recovered')).toEqual(
    await fs.readFile('randomfile')
  )
})

test('the BAT MSB is not used for sign', async () => {
  const randomBuffer = await pFromCallback(cb => randomBytes(SECTOR_SIZE, cb))
  await execa('qemu-img', ['create', '-fvpc', 'empty.vhd', '1.8T'])
  const handler = getHandler({ url: 'file://' + process.cwd() + '/' })
  const vhd = new Vhd(handler, 'empty.vhd')
  await vhd.readHeaderAndFooter()
  await vhd.readBlockAllocationTable()
  // we want the bit 31 to be on, to prove it's not been used for sign
  const hugeWritePositionSectors = Math.pow(2, 31) + 200
  await vhd.writeData(hugeWritePositionSectors, randomBuffer)
  await checkFile('empty.vhd')
  // here we are moving the first sector very far in the VHD to prove the BAT doesn't use signed int32
  const hugePositionBytes = hugeWritePositionSectors * SECTOR_SIZE
  await vhd._freeFirstBlockSpace(hugePositionBytes)

  // we recover the data manually for speed reasons.
  // fs.write() with offset is way faster than qemu-img when there is a 1.5To
  // hole before the block of data
  const recoveredFile = await fs.open('recovered', 'w')
  try {
    const vhd2 = new Vhd(handler, 'empty.vhd')
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
    await fs.createReadStream('recovered', {
      start: hugePositionBytes,
      end: hugePositionBytes + randomBuffer.length - 1,
    })
  )
  expect(recovered).toEqual(randomBuffer)
})

test('writeData on empty file', async () => {
  const mbOfRandom = 3
  await createRandomFile('randomfile', mbOfRandom)
  await execa('qemu-img', ['create', '-fvpc', 'empty.vhd', mbOfRandom + 'M'])
  const randomData = await fs.readFile('randomfile')
  const handler = getHandler({ url: 'file://' + process.cwd() + '/' })
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new Vhd(handler, 'empty.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd.writeData(0, randomData)
  await recoverRawContent('empty.vhd', 'recovered', originalSize)
  expect(await fs.readFile('recovered')).toEqual(randomData)
})

test('writeData in 2 non-overlaping operations', async () => {
  const mbOfRandom = 3
  await createRandomFile('randomfile', mbOfRandom)
  await execa('qemu-img', ['create', '-fvpc', 'empty.vhd', mbOfRandom + 'M'])
  const randomData = await fs.readFile('randomfile')
  const handler = getHandler({ url: 'file://' + process.cwd() + '/' })
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new Vhd(handler, 'empty.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  const splitPointSectors = 2
  await newVhd.writeData(0, randomData.slice(0, splitPointSectors * 512))
  await newVhd.writeData(
    splitPointSectors,
    randomData.slice(splitPointSectors * 512)
  )
  await recoverRawContent('empty.vhd', 'recovered', originalSize)
  expect(await fs.readFile('recovered')).toEqual(randomData)
})

test('writeData in 2 overlaping operations', async () => {
  const mbOfRandom = 3
  await createRandomFile('randomfile', mbOfRandom)
  await execa('qemu-img', ['create', '-fvpc', 'empty.vhd', mbOfRandom + 'M'])
  const randomData = await fs.readFile('randomfile')
  const handler = getHandler({ url: 'file://' + process.cwd() + '/' })
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new Vhd(handler, 'empty.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  const endFirstWrite = 3
  const startSecondWrite = 2
  await newVhd.writeData(0, randomData.slice(0, endFirstWrite * 512))
  await newVhd.writeData(
    startSecondWrite,
    randomData.slice(startSecondWrite * 512)
  )
  await recoverRawContent('empty.vhd', 'recovered', originalSize)
  expect(await fs.readFile('recovered')).toEqual(randomData)
})

test('BAT can be extended and blocks moved', async () => {
  const initalSize = 4
  await createRandomFile('randomfile', initalSize)
  await convertFromRawToVhd('randomfile', 'randomfile.vhd')
  const handler = getHandler({ url: 'file://' + process.cwd() + '/' })
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new Vhd(handler, 'randomfile.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd.ensureBatSize(2000)
  await recoverRawContent('randomfile.vhd', 'recovered', originalSize)
  expect(await fs.readFile('recovered')).toEqual(
    await fs.readFile('randomfile')
  )
})

test('coalesce works with empty parent files', async () => {
  const mbOfRandom = 2
  await createRandomFile('randomfile', mbOfRandom)
  await convertFromRawToVhd('randomfile', 'randomfile.vhd')
  await execa('qemu-img', [
    'create',
    '-fvpc',
    'empty.vhd',
    mbOfRandom + 1 + 'M',
  ])
  await checkFile('randomfile.vhd')
  await checkFile('empty.vhd')
  const handler = getHandler({ url: 'file://' + process.cwd() + '/' })
  const originalSize = await handler._getSize('randomfile')
  await chainVhd(handler, 'empty.vhd', handler, 'randomfile.vhd', true)
  await checkFile('randomfile.vhd')
  await checkFile('empty.vhd')
  await vhdMerge(handler, 'empty.vhd', handler, 'randomfile.vhd')
  await recoverRawContent('empty.vhd', 'recovered', originalSize)
  expect(await fs.readFile('recovered')).toEqual(
    await fs.readFile('randomfile')
  )
})

test('coalesce works in normal cases', async () => {
  const mbOfRandom = 5
  await createRandomFile('randomfile', mbOfRandom)
  await createRandomFile('small_randomfile', Math.ceil(mbOfRandom / 2))
  await execa('qemu-img', [
    'create',
    '-fvpc',
    'parent.vhd',
    mbOfRandom + 1 + 'M',
  ])
  await convertFromRawToVhd('randomfile', 'child1.vhd')
  const handler = getHandler({ url: 'file://' + process.cwd() + '/' })
  await execa('vhd-util', ['snapshot', '-n', 'child2.vhd', '-p', 'child1.vhd'])
  const vhd = new Vhd(handler, 'child2.vhd')
  await vhd.readHeaderAndFooter()
  await vhd.readBlockAllocationTable()
  vhd.footer.creatorApplication = 'xoa'
  await vhd.writeFooter()

  const originalSize = await handler._getSize('randomfile')
  await chainVhd(handler, 'parent.vhd', handler, 'child1.vhd', true)
  await execa('vhd-util', ['check', '-t', '-n', 'child1.vhd'])
  await chainVhd(handler, 'child1.vhd', handler, 'child2.vhd', true)
  await execa('vhd-util', ['check', '-t', '-n', 'child2.vhd'])
  const smallRandom = await fs.readFile('small_randomfile')
  const newVhd = new Vhd(handler, 'child2.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd.writeData(5, smallRandom)
  await checkFile('child2.vhd')
  await checkFile('child1.vhd')
  await checkFile('parent.vhd')
  await vhdMerge(handler, 'parent.vhd', handler, 'child1.vhd')
  await checkFile('parent.vhd')
  await chainVhd(handler, 'parent.vhd', handler, 'child2.vhd', true)
  await checkFile('child2.vhd')
  await vhdMerge(handler, 'parent.vhd', handler, 'child2.vhd')
  await checkFile('parent.vhd')
  await recoverRawContent(
    'parent.vhd',
    'recovered_from_coalescing',
    originalSize
  )
  await execa('cp', ['randomfile', 'randomfile2'])
  const fd = await fs.open('randomfile2', 'r+')
  try {
    await fs.write(fd, smallRandom, 0, smallRandom.length, 5 * SECTOR_SIZE)
  } finally {
    await fs.close(fd)
  }
  expect(await fs.readFile('recovered_from_coalescing')).toEqual(
    await fs.readFile('randomfile2')
  )
})

test('createSyntheticStream passes vhd-util check', async () => {
  const initalSize = 4
  await createRandomFile('randomfile', initalSize)
  await convertFromRawToVhd('randomfile', 'randomfile.vhd')
  await checkFile('randomfile.vhd')
  const handler = getHandler({ url: 'file://' + process.cwd() + '/' })
  const stream = await createSyntheticStream(handler, 'randomfile.vhd')
  const expectedVhdSize = (await fs.stat('randomfile.vhd')).size
  expect(stream.length).toEqual((await fs.stat('randomfile.vhd')).size)
  await pFromCallback(cb =>
    pipeline(stream, fs.createWriteStream('recovered.vhd'), cb)
  )
  await checkFile('recovered.vhd')
  const stats = await fs.stat('recovered.vhd')
  expect(stats.size).toEqual(expectedVhdSize)
  await execa('qemu-img', ['compare', 'recovered.vhd', 'randomfile'])
})
