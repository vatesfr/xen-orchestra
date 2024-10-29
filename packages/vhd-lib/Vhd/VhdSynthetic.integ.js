'use strict'

const { beforeEach, afterEach, describe, it } = require('node:test')
const { strict: assert } = require('assert')

const { rimraf } = require('rimraf')
const tmp = require('tmp')
const { Disposable, pFromCallback } = require('promise-toolbox')
const { getSyncedHandler } = require('@xen-orchestra/fs')

const { SECTOR_SIZE, PLATFORMS } = require('../_constants')
const { createRandomFile, convertFromRawToVhd } = require('../tests/utils')
const { openVhd, chainVhd, VhdSynthetic } = require('..')

let tempDir = null

describe('VhdSynthetic', async () => {
  beforeEach(async () => {
    tempDir = await pFromCallback(cb => tmp.dir(cb))
  })

  afterEach(async () => {
    await rimraf(tempDir)
  })

  it('can read block and parent locator from a synthetic vhd', async () => {
    const bigRawFileName = `/bigrandomfile`
    await createRandomFile(`${tempDir}/${bigRawFileName}`, 8)
    const bigVhdFileName = `/bigrandomfile.vhd`
    await convertFromRawToVhd(`${tempDir}/${bigRawFileName}`, `${tempDir}/${bigVhdFileName}`)

    const smallRawFileName = `/smallrandomfile`
    await createRandomFile(`${tempDir}/${smallRawFileName}`, 4)
    const smallVhdFileName = `/smallrandomfile.vhd`
    await convertFromRawToVhd(`${tempDir}/${smallRawFileName}`, `${tempDir}/${smallVhdFileName}`)

    await Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
      // ensure the two VHD are linked, with the child of type DISK_TYPES.DIFFERENCING
      await chainVhd(handler, bigVhdFileName, handler, smallVhdFileName, true)

      const bigVhd = yield openVhd(handler, bigVhdFileName)
      await bigVhd.readBlockAllocationTable()
      // add parent locato
      // this will also scramble the block inside the vhd files
      await bigVhd.writeParentLocator({
        id: 0,
        platformCode: PLATFORMS.W2KU,
        data: Buffer.from('I am in the big one'),
      })
      // header changed since thre is a new parent locator
      await bigVhd.writeHeader()
      // the footer at the end changed since the block have been moved
      await bigVhd.writeFooter()

      await bigVhd.readHeaderAndFooter()

      const syntheticVhd = yield VhdSynthetic.open(handler, [bigVhdFileName, smallVhdFileName])
      await syntheticVhd.readBlockAllocationTable()

      assert.deepEqual(syntheticVhd.header.diskType, bigVhd.header.diskType)
      assert.deepEqual(syntheticVhd.header.parentTimestamp, bigVhd.header.parentTimestamp)

      // first two block should be from small
      const buf = Buffer.alloc(syntheticVhd.sectorsPerBlock * SECTOR_SIZE, 0)
      let content = (await syntheticVhd.readBlock(0)).data
      await handler.read(smallRawFileName, buf, 0)
      assert.equal(content.equals(buf), true)

      content = (await syntheticVhd.readBlock(1)).data
      await handler.read(smallRawFileName, buf, buf.length)
      assert.equal(content.equals(buf), true)

      // the next one from big

      content = (await syntheticVhd.readBlock(2)).data
      await handler.read(bigRawFileName, buf, buf.length * 2)
      assert.equal(content.equals(buf), true)

      content = (await syntheticVhd.readBlock(3)).data
      await handler.read(bigRawFileName, buf, buf.length * 3)
      assert.equal(content.equals(buf), true)

      // the parent locator should the one of the root vhd
      const parentLocator = await syntheticVhd.readParentLocator(0)
      assert.equal(parentLocator.platformCode, PLATFORMS.W2KU)
    })
  })
})
