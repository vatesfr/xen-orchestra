/* eslint-env jest */

import execa from 'execa'
import fs from 'fs-extra'
import { randomBytes } from 'crypto'
import rimraf from 'rimraf'

import LocalHandler from './remote-handlers/local'
import vhdMerge, { chainVhd, Vhd, VHD_SECTOR_SIZE } from './vhd-merge'
import { tmpDir, pFromCallback, streamToBuffer } from './utils'

const initialDir = process.cwd()

jest.setTimeout(10000)

beforeEach(async () => {
  const dir = await tmpDir()
  process.chdir(dir)
})

afterEach(async () => {
  const tmpDir = process.cwd()
  process.chdir(initialDir)
  await pFromCallback(cb => rimraf(tmpDir, cb))
})

async function createRandomFile (name, sizeMb) {
  await execa('bash', [
    '-c',
    `< /dev/urandom tr -dc "\\t\\n [:alnum:]" | head -c ${sizeMb}M >${name}`,
  ])
}

async function checkFile (vhdName) {
  await execa('vhd-util', ['check', '-p', '-b', '-t', '-n', vhdName])
}

async function recoverRawContent (vhdName, rawName, originalSize) {
  await checkFile(vhdName)
  await execa('qemu-img', ['convert', '-fvpc', '-Oraw', vhdName, rawName])
  if (originalSize !== undefined) {
    await execa('truncate', ['-s', originalSize, rawName])
  }
}

async function convertFromRawToVhd (rawName, vhdName) {
  await execa('qemu-img', ['convert', '-f', 'raw', '-Ovpc', rawName, vhdName])
}

test('the BAT MSB is not used for sign', async () => {
  expect.assertions(1)
  const randomBuffer = await pFromCallback(cb =>
    randomBytes(VHD_SECTOR_SIZE, cb)
  )
  await execa('qemu-img', ['create', '-fvpc', 'empty.vhd', '1.8T'])
  const handler = new LocalHandler({ url: 'file://' + process.cwd() })
  const vhd = new Vhd(handler, 'empty.vhd')
  await vhd.readHeaderAndFooter()
  await vhd.readBlockTable()
  // we want the bit 31 to be on, to prove it's not been used for sign
  const hugeWritePositionSectors = Math.pow(2, 31) + 200
  await vhd.writeData(hugeWritePositionSectors, randomBuffer)
  await checkFile('empty.vhd')
  // here we are moving the first sector very far in the VHD to prove the BAT doesn't use signed int32
  const hugePositionBytes = hugeWritePositionSectors * VHD_SECTOR_SIZE
  await vhd._freeFirstBlockSpace(hugePositionBytes)

  // we recover the data manually for speed reasons.
  // fs.write() with offset is way faster than qemu-img when there is a 1.5To
  // hole before the block of data
  const recoveredFile = await fs.open('recovered', 'w')
  try {
    const vhd2 = new Vhd(handler, 'empty.vhd')
    await vhd2.readHeaderAndFooter()
    await vhd2.readBlockTable()
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
  const recovered = await streamToBuffer(
    await fs.createReadStream('recovered', {
      start: hugePositionBytes,
      end: hugePositionBytes + randomBuffer.length - 1,
    })
  )
  expect(recovered).toEqual(randomBuffer)
})

test('writeData on empty file', async () => {
  expect.assertions(1)
  const mbOfRandom = 11
  await createRandomFile('randomfile', mbOfRandom)
  await execa('qemu-img', ['create', '-fvpc', 'empty.vhd', mbOfRandom + 'M'])
  const randomData = await fs.readFile('randomfile')
  const handler = new LocalHandler({ url: 'file://' + process.cwd() })
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new Vhd(handler, 'empty.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockTable()
  await newVhd.writeData(0, randomData)
  await recoverRawContent('empty.vhd', 'recovered', originalSize)
  expect(await fs.readFile('recovered')).toEqual(randomData)
})

test('writeData in 2 non-overlaping operations', async () => {
  expect.assertions(1)
  const mbOfRandom = 11
  await createRandomFile('randomfile', mbOfRandom)
  await execa('qemu-img', ['create', '-fvpc', 'empty.vhd', mbOfRandom + 'M'])
  const randomData = await fs.readFile('randomfile')
  const handler = new LocalHandler({ url: 'file://' + process.cwd() })
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new Vhd(handler, 'empty.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockTable()
  const splitPointSectors = 4
  await newVhd.writeData(0, randomData.slice(0, splitPointSectors * 512))
  await newVhd.writeData(
    splitPointSectors,
    randomData.slice(splitPointSectors * 512)
  )
  await recoverRawContent('empty.vhd', 'recovered', originalSize)
  expect(await fs.readFile('recovered')).toEqual(randomData)
})

test('writeData in 2 overlaping operations', async () => {
  expect.assertions(1)
  const mbOfRandom = 11
  await createRandomFile('randomfile', mbOfRandom)
  await execa('qemu-img', ['create', '-fvpc', 'empty.vhd', mbOfRandom + 'M'])
  const randomData = await fs.readFile('randomfile')
  const handler = new LocalHandler({ url: 'file://' + process.cwd() })
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new Vhd(handler, 'empty.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockTable()
  const endFirstWrite = 5
  const startSecondWrite = 3
  await newVhd.writeData(0, randomData.slice(0, endFirstWrite * 512))
  await newVhd.writeData(
    startSecondWrite,
    randomData.slice(startSecondWrite * 512)
  )
  await recoverRawContent('empty.vhd', 'recovered', originalSize)
  expect(await fs.readFile('recovered')).toEqual(randomData)
})

test('BAT can be extended and blocks moved', async () => {
  expect.assertions(1)
  const initalSize = 4
  await createRandomFile('randomfile', initalSize)
  await convertFromRawToVhd('randomfile', 'randomfile.vhd')
  const handler = new LocalHandler({ url: 'file://' + process.cwd() })
  const originalSize = await handler.getSize('randomfile')
  const newVhd = new Vhd(handler, 'randomfile.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockTable()
  await newVhd.ensureBatSize(2000)
  await newVhd._freeFirstBlockSpace(8000000)
  await recoverRawContent('randomfile.vhd', 'recovered', originalSize)
  expect(await fs.readFile('recovered')).toEqual(
    await fs.readFile('randomfile')
  )
})

test('coalesce works with empty parent files', async () => {
  expect.assertions(1)
  const mbOfRandom = 12
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
  const handler = new LocalHandler({ url: 'file://' + process.cwd() })
  const originalSize = await handler._getSize('randomfile')
  await chainVhd(handler, 'empty.vhd', handler, 'randomfile.vhd')
  await checkFile('randomfile.vhd')
  await checkFile('empty.vhd')
  await vhdMerge(handler, 'empty.vhd', handler, 'randomfile.vhd')
  await recoverRawContent('empty.vhd', 'recovered', originalSize)
  expect(await fs.readFile('recovered')).toEqual(
    await fs.readFile('randomfile')
  )
})

test('coalesce works in normal cases', async () => {
  expect.assertions(1)
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
  const handler = new LocalHandler({ url: 'file://' + process.cwd() })
  await execa('vhd-util', ['snapshot', '-n', 'child2.vhd', '-p', 'child1.vhd'])
  const vhd = new Vhd(handler, 'child2.vhd')
  await vhd.readHeaderAndFooter()
  await vhd.readBlockTable()
  vhd.footer.creatorApplication = 'xoa'
  await vhd.writeFooter()

  const originalSize = await handler._getSize('randomfile')
  await chainVhd(handler, 'parent.vhd', handler, 'child1.vhd')
  await execa('vhd-util', ['check', '-t', '-n', 'child1.vhd'])
  await chainVhd(handler, 'child1.vhd', handler, 'child2.vhd')
  await execa('vhd-util', ['check', '-t', '-n', 'child2.vhd'])
  const smallRandom = await fs.readFile('small_randomfile')
  const newVhd = new Vhd(handler, 'child2.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockTable()
  await newVhd.writeData(5, smallRandom)
  await checkFile('child2.vhd')
  await checkFile('child1.vhd')
  await checkFile('parent.vhd')
  await vhdMerge(handler, 'parent.vhd', handler, 'child1.vhd')
  await checkFile('parent.vhd')
  await chainVhd(handler, 'parent.vhd', handler, 'child2.vhd')
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
    await fs.write(fd, smallRandom, 0, smallRandom.length, 5 * VHD_SECTOR_SIZE)
  } finally {
    await fs.close(fd)
  }
  expect(await fs.readFile('recovered_from_coalescing')).toEqual(
    await fs.readFile('randomfile2')
  )
})
