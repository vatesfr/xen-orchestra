/* eslint-env jest */

import rimraf from 'rimraf'
import tmp from 'tmp'
import { Disposable, pFromCallback } from 'promise-toolbox'
import { getSyncedHandler } from '@xen-orchestra/fs'

import { SECTOR_SIZE } from '../_constants'
import { createRandomFile, convertFromRawToVhd } from '../tests/utils'
import { openVhd } from '../../dist'
import { VhdSynthetic } from './VhdSynthetic'

let tempDir = null

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

test('It can read block from a synthetic vhd', async () => {
  const bigRawFileName = `${tempDir}/bigrandomfile`
  await createRandomFile(bigRawFileName, 8)
  const bigVhdFileName = `${tempDir}/bigrandomfile.vhd`
  await convertFromRawToVhd(bigRawFileName, bigVhdFileName)

  const smallRawFileName = `${tempDir}/smallrandomfile`
  await createRandomFile(smallRawFileName, 4)
  const smallVhdFileName = `${tempDir}/smallrandomfile.vhd`
  await convertFromRawToVhd(smallRawFileName, smallVhdFileName)

  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file:///' })
    const smallVhd = yield openVhd(handler, smallVhdFileName)
    const bigVhd = yield openVhd(handler, bigVhdFileName)
    const syntheticVhd = new VhdSynthetic([smallVhd, bigVhd])

    await syntheticVhd.readBlockAllocationTable()

    // first two block should be from small
    const buf = Buffer.alloc(syntheticVhd.sectorsPerBlock * SECTOR_SIZE, 0)
    let content = (await syntheticVhd.readBlock(0)).data
    await handler.read(smallRawFileName, buf, 0)
    expect(content).toEqual(buf)

    content = (await syntheticVhd.readBlock(1)).data
    await handler.read(smallRawFileName, buf, buf.length)
    expect(content).toEqual(buf)

    // the next one from big

    content = (await syntheticVhd.readBlock(2)).data
    await handler.read(bigRawFileName, buf, buf.length * 2)
    expect(content).toEqual(buf)

    content = (await syntheticVhd.readBlock(3)).data
    await handler.read(bigRawFileName, buf, buf.length * 3)
    expect(content).toEqual(buf)
  })
})
