/* eslint-env jest */

import rimraf from 'rimraf'
import tmp from 'tmp'
import fs from 'fs-extra'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { Disposable, pFromCallback } from 'promise-toolbox'

import { openVhd } from '../index'
import { checkFile, createRandomFile, convertFromRawToVhd, createRandomVhdDirectory } from '../tests/utils'
import { VhdAbstract } from './VhdAbstract'
import { SECTOR_SIZE } from '../../dist/_constants'
import { BLOCK_UNUSED, FOOTER_SIZE, HEADER_SIZE } from '../_constants'

let tempDir

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

const streamToBuffer = stream => {
  let buffer = Buffer.alloc(0)

  return new Promise((resolve, reject) => {
    stream.on('data', data => (buffer = Buffer.concat([buffer, data])))
    stream.on('end', () => resolve(buffer))
  })
}

test('It creates an alias', async () => {
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file://' + tempDir })
    const aliasPath = `alias/alias.alias.vhd`
    const aliasFsPath = `${tempDir}/${aliasPath}`
    await fs.mkdirp(`${tempDir}/alias`)

    const testOneCombination = async ({ targetPath, targetContent }) => {
      await VhdAbstract.createAlias(handler, aliasPath, targetPath)
      // alias file is created
      expect(await fs.exists(aliasFsPath)).toEqual(true)
      // content is the target path relative to the alias location
      const content = await fs.readFile(aliasFsPath, 'utf-8')
      expect(content).toEqual(targetContent)
      // create alias fails if alias already exists, remove it before next loop step
      await fs.unlink(aliasFsPath)
    }

    const combinations = [
      { targetPath: `targets.vhd`, targetContent: `../targets.vhd` },
      { targetPath: `alias/targets.vhd`, targetContent: `targets.vhd` },
      { targetPath: `alias/sub/targets.vhd`, targetContent: `sub/targets.vhd` },
      { targetPath: `sibling/targets.vhd`, targetContent: `../sibling/targets.vhd` },
    ]

    for (const { targetPath, targetContent } of combinations) {
      await testOneCombination({ targetPath, targetContent })
    }
  })
})

test('alias must have *.alias.vhd extension', async () => {
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file:///' })
    const aliasPath = `${tempDir}/invalidalias.vhd`
    const targetPath = `${tempDir}/targets.vhd`
    expect(async () => await VhdAbstract.createAlias(handler, aliasPath, targetPath)).rejects.toThrow()

    expect(await fs.exists(aliasPath)).toEqual(false)
  })
})

test('alias must not be chained', async () => {
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file:///' })
    const aliasPath = `${tempDir}/valid.alias.vhd`
    const targetPath = `${tempDir}/an.other.valid.alias.vhd`
    expect(async () => await VhdAbstract.createAlias(handler, aliasPath, targetPath)).rejects.toThrow()
    expect(await fs.exists(aliasPath)).toEqual(false)
  })
})

test('It rename and unlink a VHDFile', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSize)
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file:///' })
    const { size } = await fs.stat(vhdFileName)
    const targetFileName = `${tempDir}/renamed.vhd`

    await VhdAbstract.rename(handler, vhdFileName, targetFileName)
    expect(await fs.exists(vhdFileName)).toEqual(false)
    const { size: renamedSize } = await fs.stat(targetFileName)
    expect(size).toEqual(renamedSize)
    await VhdAbstract.unlink(handler, targetFileName)
    expect(await fs.exists(targetFileName)).toEqual(false)
  })
})

test('It rename and unlink a VhdDirectory', async () => {
  const initalSize = 4
  const vhdDirectory = `${tempDir}/randomfile.dir`
  await createRandomVhdDirectory(vhdDirectory, initalSize)

  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file:///' })
    const vhd = yield openVhd(handler, vhdDirectory)
    expect(vhd.header.cookie).toEqual('cxsparse')
    expect(vhd.footer.cookie).toEqual('conectix')

    const targetFileName = `${tempDir}/renamed.vhd`
    await VhdAbstract.rename(handler, vhdDirectory, targetFileName)
    expect(await fs.exists(vhdDirectory)).toEqual(false)
    await VhdAbstract.unlink(handler, targetFileName)
    expect(await fs.exists(targetFileName)).toEqual(false)
  })
})

test('It create , rename and unlink alias', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSize)
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  const aliasFileName = `${tempDir}/aliasFileName.alias.vhd`
  const aliasFileNameRenamed = `${tempDir}/aliasFileNameRenamed.alias.vhd`

  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file:///' })
    await VhdAbstract.createAlias(handler, aliasFileName, vhdFileName)
    expect(await fs.exists(aliasFileName)).toEqual(true)
    expect(await fs.exists(vhdFileName)).toEqual(true)

    await VhdAbstract.rename(handler, aliasFileName, aliasFileNameRenamed)
    expect(await fs.exists(aliasFileName)).toEqual(false)
    expect(await fs.exists(vhdFileName)).toEqual(true)
    expect(await fs.exists(aliasFileNameRenamed)).toEqual(true)

    await VhdAbstract.unlink(handler, aliasFileNameRenamed)
    expect(await fs.exists(aliasFileName)).toEqual(false)
    expect(await fs.exists(vhdFileName)).toEqual(false)
    expect(await fs.exists(aliasFileNameRenamed)).toEqual(false)
  })
})

test('it can create a vhd stream', async () => {
  const initialNbBlocks = 3
  const initalSize = initialNbBlocks * 2
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSize)
  const vhdFileName = `${tempDir}/vhd.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  const bat = Buffer.alloc(512)

  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file://' + tempDir })

    const vhd = yield openVhd(handler, 'vhd.vhd')

    // mark first block as unused
    await handler.read('vhd.vhd', bat, vhd.header.tableOffset)
    bat.writeUInt32BE(BLOCK_UNUSED, 0)
    await handler.write('vhd.vhd', bat, vhd.header.tableOffset)

    // read our modified bat
    await vhd.readBlockAllocationTable()
    const stream = vhd.stream()

    // read all the stream into a buffer

    const buffer = await streamToBuffer(stream)
    const length = buffer.length
    const start = FOOTER_SIZE + HEADER_SIZE + vhd.batSize
    const footer = buffer.slice(0, 512)
    // 1 deleted block should be in ouput
    expect(length).toEqual(start + (initialNbBlocks - 1) * vhd.fullBlockSize + FOOTER_SIZE)
    // blocks
    const blockBuf = Buffer.alloc(vhd.sectorsPerBlock * SECTOR_SIZE, 0)
    for (let i = 1; i < 3; i++) {
      const blockDataStart = start + (i - 1) * vhd.fullBlockSize + 512 /* block bitmap */
      const blockDataEnd = blockDataStart + vhd.sectorsPerBlock * SECTOR_SIZE
      const content = buffer.slice(blockDataStart, blockDataEnd)
      await handler.read('randomfile', blockBuf, i * vhd.sectorsPerBlock * SECTOR_SIZE)
      expect(content).toEqual(blockBuf)
    }
    // footer
    const endFooter = buffer.slice(length - 512)
    expect(footer).toEqual(endFooter)

    await handler.writeFile('out.vhd', buffer)
    // check that the vhd is still valid
    await checkFile(`${tempDir}/out.vhd`)
  })
})

it('can stream content', async () => {
  const initalSizeMb = 5 // 2 block and an half
  const initialByteSize = initalSizeMb * 1024 * 1024
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSizeMb)
  const vhdFileName = `${tempDir}/vhd.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  const bat = Buffer.alloc(512)

  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file://' + tempDir })

    const vhd = yield openVhd(handler, 'vhd.vhd')
    // mark first block as unused
    await handler.read('vhd.vhd', bat, vhd.header.tableOffset)
    bat.writeUInt32BE(BLOCK_UNUSED, 0)
    await handler.write('vhd.vhd', bat, vhd.header.tableOffset)

    // read our modified block allocation table
    await vhd.readBlockAllocationTable()
    const stream = vhd.rawContent()
    const buffer = await streamToBuffer(stream)

    // qemu can modify size, to align it to geometry

    // check that data didn't change
    const blockDataLength = vhd.sectorsPerBlock * SECTOR_SIZE

    // first block should be empty
    const EMPTY = Buffer.alloc(blockDataLength, 0)
    const firstBlock = buffer.slice(0, blockDataLength)
    // using buffer1 toEquals buffer2 make jest crash trying to stringify it on failure
    expect(firstBlock.equals(EMPTY)).toEqual(true)

    let remainingLength = initialByteSize - blockDataLength // already checked the first block
    for (let i = 1; i < 3; i++) {
      // last block will be truncated
      const blockSize = Math.min(blockDataLength, remainingLength - blockDataLength)
      const blockDataStart = i * blockDataLength // first block have been deleted
      const blockDataEnd = blockDataStart + blockSize
      const content = buffer.slice(blockDataStart, blockDataEnd)

      const blockBuf = Buffer.alloc(blockSize, 0)

      await handler.read('randomfile', blockBuf, i * blockDataLength)
      expect(content.equals(blockBuf)).toEqual(true)
      remainingLength -= blockSize
    }
  })
})
