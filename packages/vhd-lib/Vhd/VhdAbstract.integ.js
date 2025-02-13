'use strict'

const { beforeEach, afterEach, describe, it } = require('node:test')
const { strict: assert } = require('assert')

const { rimraf } = require('rimraf')
const tmp = require('tmp')
const fs = require('fs-extra')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { Disposable, pFromCallback } = require('promise-toolbox')

const { openVhd } = require('../index')
const { checkFile, createRandomFile, convertFromRawToVhd, createRandomVhdDirectory } = require('../tests/utils')
const { VhdAbstract } = require('./VhdAbstract')
const { BLOCK_UNUSED, FOOTER_SIZE, HEADER_SIZE, PLATFORMS, SECTOR_SIZE } = require('../_constants')
const { unpackHeader, unpackFooter } = require('./_utils')

const streamToBuffer = stream => {
  let buffer = Buffer.alloc(0)

  return new Promise((resolve, reject) => {
    stream.on('data', data => (buffer = Buffer.concat([buffer, data])))
    stream.on('end', () => resolve(buffer))
  })
}

let tempDir

describe('VhdAbstract', { concurrency: 1 }, async () => {
  beforeEach(async () => {
    tempDir = await pFromCallback(cb => tmp.dir(cb))
  })

  afterEach(async () => {
    await rimraf(tempDir)
  })

  it('Creates an alias', async () => {
    await Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: 'file://' + tempDir })
      const aliasPath = `alias/alias.alias.vhd`
      const aliasFsPath = `${tempDir}/${aliasPath}`
      await fs.mkdirp(`${tempDir}/alias`)

      const testOneCombination = async ({ targetPath, targetContent }) => {
        await VhdAbstract.createAlias(handler, aliasPath, targetPath)
        // alias file is created
        assert.equal(await fs.exists(aliasFsPath), true)
        // content is the target path relative to the alias location
        const content = await fs.readFile(aliasFsPath, 'utf-8')
        assert.equal(content, targetContent)
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

  it('has *.alias.vhd extension', async () => {
    await Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: 'file:///' })
      const aliasPath = `${tempDir}/invalidalias.vhd`
      const targetPath = `${tempDir}/targets.vhd`
      await assert.rejects(async () => await VhdAbstract.createAlias(handler, aliasPath, targetPath))

      assert.equal(await fs.exists(aliasPath), false)
    })
  })

  it('must not be chained', async () => {
    await Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: 'file:///' })
      const aliasPath = `${tempDir}/valid.alias.vhd`
      const targetPath = `${tempDir}/an.other.valid.alias.vhd`
      await assert.rejects(async () => await VhdAbstract.createAlias(handler, aliasPath, targetPath))
      assert.equal(await fs.exists(aliasPath), false)
    })
  })

  it('renames and unlink a VHDFile', async () => {
    const initalSize = 4
    const rawFileName = `${tempDir}/randomfile`
    await createRandomFile(rawFileName, initalSize)
    const vhdFileName = `${tempDir}/randomfile.vhd`
    await convertFromRawToVhd(rawFileName, vhdFileName)
    await Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: 'file:///' })

      await VhdAbstract.unlink(handler, vhdFileName)
      assert.equal(await fs.exists(vhdFileName), false)
    })
  })

  it('renames and unlink a VhdDirectory', async () => {
    const initalSize = 4
    const vhdDirectory = `${tempDir}/randomfile.dir`
    await createRandomVhdDirectory(vhdDirectory, initalSize)

    await Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: 'file:///' })
      const vhd = yield openVhd(handler, vhdDirectory)
      assert.equal(vhd.header.cookie, 'cxsparse')
      assert.equal(vhd.footer.cookie, 'conectix')

      const targetFileName = `${tempDir}/renamed.vhd`
      // it should clean an existing directory
      await fs.mkdir(targetFileName)
      await fs.writeFile(`${targetFileName}/dummy`, 'I exists')
      await VhdAbstract.unlink(handler, `${targetFileName}/dummy`)
      assert.equal(await fs.exists(`${targetFileName}/dummy`), false)
    })
  })

  it('Creates, renames and unlink alias', async () => {
    const initalSize = 4
    const rawFileName = `${tempDir}/randomfile`
    await createRandomFile(rawFileName, initalSize)
    const vhdFileName = `${tempDir}/randomfile.vhd`
    await convertFromRawToVhd(rawFileName, vhdFileName)
    const aliasFileName = `${tempDir}/aliasFileName.alias.vhd`

    await Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: 'file:///' })
      await VhdAbstract.createAlias(handler, aliasFileName, vhdFileName)
      assert.equal(await fs.exists(aliasFileName), true)
      assert.equal(await fs.exists(vhdFileName), true)

      await VhdAbstract.unlink(handler, aliasFileName)
      assert.equal(await fs.exists(aliasFileName), false)
      assert.equal(await fs.exists(vhdFileName), false)
    })
  })

  it('creates a vhd stream', async () => {
    const initialNbBlocks = 3
    const initalSize = initialNbBlocks * 2
    const rawFileName = `${tempDir}/randomfile`
    await createRandomFile(rawFileName, initalSize)
    const vhdFileName = `${tempDir}/vhd.vhd`
    await convertFromRawToVhd(rawFileName, vhdFileName)

    await Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: 'file://' + tempDir })

      const vhd = yield openVhd(handler, 'vhd.vhd')
      await vhd.readBlockAllocationTable()

      const parentLocatorBase = Buffer.from('a file path, not aligned', 'utf16le')
      const aligned = Buffer.alloc(SECTOR_SIZE, 0)
      parentLocatorBase.copy(aligned)
      await vhd.writeParentLocator({
        id: 0,
        platformCode: PLATFORMS.W2KU,
        data: parentLocatorBase,
      })
      await vhd.writeFooter()
      const stream = vhd.stream()

      // size and stream must have the same result
      assert.equal(stream.length, vhd.streamSize())

      assert.equal(
        stream.length,
        512 /* footer */ +
          1024 /* header */ +
          512 /* BAT */ +
          512 /* parentlocator */ +
          3 * (2 * 1024 * 1024 + 512) /* blocs */ +
          512 /* end footer */
      )
      // read all the stream into a buffer

      const buffer = await streamToBuffer(stream)
      const length = buffer.length
      const bufFooter = buffer.slice(0, FOOTER_SIZE)

      // footer is still valid
      assert.doesNotThrow(() => unpackFooter(bufFooter))
      const footer = unpackFooter(bufFooter)

      // header is still valid
      const bufHeader = buffer.slice(FOOTER_SIZE, HEADER_SIZE + FOOTER_SIZE)
      assert.doesNotThrow(() => unpackHeader(bufHeader, footer))

      // 1 deleted block should be in ouput
      let start = FOOTER_SIZE + HEADER_SIZE + vhd.batSize

      const parentLocatorData = buffer.slice(start, start + SECTOR_SIZE)
      assert.equal(parentLocatorData.equals(aligned), true)
      start += SECTOR_SIZE // parent locator
      assert.equal(length, start + initialNbBlocks * vhd.fullBlockSize + FOOTER_SIZE)
      assert.equal(stream.length, buffer.length)
      // blocks
      const blockBuf = Buffer.alloc(vhd.sectorsPerBlock * SECTOR_SIZE, 0)
      for (let i = 0; i < initialNbBlocks; i++) {
        const blockDataStart = start + i * vhd.fullBlockSize + 512 /* block bitmap */
        const blockDataEnd = blockDataStart + vhd.sectorsPerBlock * SECTOR_SIZE
        const content = buffer.slice(blockDataStart, blockDataEnd)
        await handler.read('randomfile', blockBuf, i * vhd.sectorsPerBlock * SECTOR_SIZE)
        assert.equal(content.equals(blockBuf), true)
      }
      // footer
      const endFooter = buffer.slice(length - FOOTER_SIZE)
      assert.deepEqual(bufFooter, endFooter)

      await handler.writeFile('out.vhd', buffer)
      // check that the vhd is still valid
      await checkFile(`${tempDir}/out.vhd`)
    })
  })

  it('can stream content', async () => {
    const initalSizeMb = 5 // 2 block and an half
    const initialNbBlocks = Math.ceil(initalSizeMb / 2)
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
      assert.equal(firstBlock.equals(EMPTY), true)

      let remainingLength = initialByteSize - blockDataLength // already checked the first block
      for (let i = 1; i < initialNbBlocks; i++) {
        // last block will be truncated
        const blockSize = Math.min(blockDataLength, remainingLength - blockDataLength)
        const blockDataStart = i * blockDataLength // first block have been deleted
        const blockDataEnd = blockDataStart + blockSize
        const content = buffer.slice(blockDataStart, blockDataEnd)

        const blockBuf = Buffer.alloc(blockSize, 0)

        await handler.read('randomfile', blockBuf, i * blockDataLength)
        assert.equal(content.equals(blockBuf), true)
        remainingLength -= blockSize
      }
    })
  })
})
