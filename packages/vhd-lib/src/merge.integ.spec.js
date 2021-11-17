/* eslint-env jest */

import fs from 'fs-extra'
import rimraf from 'rimraf'
import tmp from 'tmp'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'

import { VhdFile, chainVhd, mergeVhd as vhdMerge } from './index'

import { checkFile, createRandomFile, convertFromRawToVhd } from './tests/utils'

let tempDir = null

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

test('merge works in normal cases', async () => {
  const mbOfFather = 8
  const mbOfChildren = 4
  const parentRandomFileName = `${tempDir}/randomfile`
  const childRandomFileName = `${tempDir}/small_randomfile`
  const parentFileName = `${tempDir}/parent.vhd`
  const child1FileName = `${tempDir}/child1.vhd`
  const handler = getHandler({ url: 'file://' })

  await createRandomFile(parentRandomFileName, mbOfFather)
  await convertFromRawToVhd(parentRandomFileName, parentFileName)

  await createRandomFile(childRandomFileName, mbOfChildren)
  await convertFromRawToVhd(childRandomFileName, child1FileName)
  await chainVhd(handler, parentFileName, handler, child1FileName, true)

  // merge
  await vhdMerge(handler, parentFileName, handler, child1FileName)

  // check that vhd is still valid
  await checkFile(parentFileName)

  const parentVhd = new VhdFile(handler, parentFileName)
  await parentVhd.readHeaderAndFooter()
  await parentVhd.readBlockAllocationTable()

  let offset = 0
  // check that the data are the same as source
  for await (const block of parentVhd.blocks()) {
    const blockContent = block.data
    const file = offset < mbOfChildren * 1024 * 1024 ? childRandomFileName : parentRandomFileName
    const buffer = Buffer.alloc(blockContent.length)
    const fd = await fs.open(file, 'r')
    await fs.read(fd, buffer, 0, buffer.length, offset)

    expect(buffer.equals(blockContent)).toEqual(true)
    offset += parentVhd.header.blockSize
  }
})
