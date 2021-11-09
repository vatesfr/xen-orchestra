/* eslint-env jest */

import rimraf from 'rimraf'
import tmp from 'tmp'
import { getHandler } from '@xen-orchestra/fs'
import { Disposable, pFromCallback } from 'promise-toolbox'

import { openVhd } from '../openVhd'
import { createRandomFile, convertFromRawToVhd, convertToVhdDirectory } from '../tests/utils'

let tempDir = null

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

test('Can coalesce block', async () => {
  const initalSize = 4
  const parentrawFileName = `${tempDir}/randomfile`
  const parentFileName = `${tempDir}/parent.vhd`
  const parentDirectoryName = `${tempDir}/parent.dir.vhd`

  await createRandomFile(parentrawFileName, initalSize)
  await convertFromRawToVhd(parentrawFileName, parentFileName)
  await convertToVhdDirectory(parentrawFileName, parentFileName, parentDirectoryName)

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
    const handler = getHandler({ url: 'file://' })
    const parentVhd = yield openVhd(handler, parentDirectoryName, 'r+')
    await parentVhd.readBlockAllocationTable()
    const childFileVhd = yield openVhd(handler, childFileName)
    await childFileVhd.readBlockAllocationTable()
    const childDirectoryVhd = yield openVhd(handler, childDirectoryName)
    await childDirectoryVhd.readBlockAllocationTable()

    await parentVhd.coalesceBlock(childFileVhd, 0)
    await parentVhd.writeFooter()
    await parentVhd.writeBlockAllocationTable()
    let parentBlockData = await parentVhd.readBlock(0).data
    let childBlockData = await childFileVhd.readBlock(0).data
    expect(parentBlockData).toEqual(childBlockData)

    await parentVhd.coalesceBlock(childDirectoryVhd, 0)
    await parentVhd.writeFooter()
    await parentVhd.writeBlockAllocationTable()
    parentBlockData = await parentVhd.readBlock(0).data
    childBlockData = await childDirectoryVhd.readBlock(0).data
    expect(parentBlockData).toEqual(childBlockData)
  })
})
