'use strict'

/* eslint-env jest */

const fs = require('fs-extra')
const rimraf = require('rimraf')
const tmp = require('tmp')
const { getHandler } = require('@xen-orchestra/fs')
const { pFromCallback } = require('promise-toolbox')

const { VhdFile, chainVhd, mergeVhd: vhdMerge } = require('./index')

const { checkFile, createRandomFile, convertFromRawToVhd } = require('./tests/utils')

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

test('it can resume a merge ', async () => {
  const mbOfFather = 8
  const mbOfChildren = 4
  const parentRandomFileName = `${tempDir}/randomfile`
  const childRandomFileName = `${tempDir}/small_randomfile`
  const handler = getHandler({ url: `file://${tempDir}` })

  await createRandomFile(`${tempDir}/randomfile`, mbOfFather)
  await convertFromRawToVhd(`${tempDir}/randomfile`, `${tempDir}/parent.vhd`)
  const parentVhd = new VhdFile(handler, 'parent.vhd')
  await parentVhd.readHeaderAndFooter()

  await createRandomFile(`${tempDir}/small_randomfile`, mbOfChildren)
  await convertFromRawToVhd(`${tempDir}/small_randomfile`, `${tempDir}/child1.vhd`)
  await chainVhd(handler, 'parent.vhd', handler, 'child1.vhd', true)
  const childVhd = new VhdFile(handler, 'child1.vhd')
  await childVhd.readHeaderAndFooter()

  await handler.writeFile(
    '.parent.vhd.merge.json',
    JSON.stringify({
      parent: {
        header: parentVhd.header.checksum,
      },
      child: {
        header: 'NOT CHILD HEADER ',
      },
    })
  )
  // expect merge to fail since child header is not ok
  await expect(async () => await vhdMerge(handler, 'parent.vhd', handler, 'child1.vhd')).rejects.toThrow()

  await handler.unlink('.parent.vhd.merge.json')
  await handler.writeFile(
    '.parent.vhd.merge.json',
    JSON.stringify({
      parent: {
        header: 'NOT PARENT HEADER',
      },
      child: {
        header: childVhd.header.checksum,
      },
    })
  )
  // expect merge to fail since parent header is not ok
  await expect(async () => await vhdMerge(handler, 'parent.vhd', handler, 'child1.vhd')).rejects.toThrow()

  // break the end footer of parent
  const size = await handler.getSize('parent.vhd')
  const fd = await handler.openFile('parent.vhd', 'r+')
  const buffer = Buffer.alloc(512, 0)
  // add a fake footer at the end
  handler.write(fd, buffer, size)
  await handler.closeFile(fd)
  // check vhd should fail
  await expect(async () => await parentVhd.readHeaderAndFooter()).rejects.toThrow()

  await handler.unlink('.parent.vhd.merge.json')
  await handler.writeFile(
    '.parent.vhd.merge.json',
    JSON.stringify({
      parent: {
        header: parentVhd.header.checksum,
      },
      child: {
        header: childVhd.header.checksum,
      },
      currentBlock: 1,
    })
  )

  // really merge
  await vhdMerge(handler, 'parent.vhd', handler, 'child1.vhd')

  // reload header footer and block allocation table , they should succed
  await parentVhd.readHeaderAndFooter()
  await parentVhd.readBlockAllocationTable()
  let offset = 0
  // check that the data are the same as source
  for await (const block of parentVhd.blocks()) {
    const blockContent = block.data
    // first block is marked as already merged, should not be modified
    // second block should come from children
    // then two block only in parent
    const file = block.id === 1 ? childRandomFileName : parentRandomFileName
    const buffer = Buffer.alloc(blockContent.length)
    const fd = await fs.open(file, 'r')
    await fs.read(fd, buffer, 0, buffer.length, offset)

    expect(buffer.equals(blockContent)).toEqual(true)
    offset += parentVhd.header.blockSize
  }
})

test('it merge multiple child in one passe ', async () => {
  const mbOfFather = 8
  const mbOfChildren = 4
  const parentRandomFileName = `${tempDir}/randomfile`
  const childRandomFileName = `${tempDir}/small_randomfile`
  const grandChildRandomFileName = `${tempDir}/another_small_randomfile`
  const parentFileName = `${tempDir}/parent.vhd`
  const childFileName = `${tempDir}/child1.vhd`
  const grandChildFileName = `${tempDir}/child2.vhd`
  const handler = getHandler({ url: 'file://' })

  await createRandomFile(parentRandomFileName, mbOfFather)
  await convertFromRawToVhd(parentRandomFileName, parentFileName)

  await createRandomFile(childRandomFileName, mbOfChildren)
  await convertFromRawToVhd(childRandomFileName, childFileName)
  await chainVhd(handler, parentFileName, handler, childFileName, true)

  await createRandomFile(grandChildRandomFileName, mbOfChildren)
  await convertFromRawToVhd(grandChildRandomFileName, grandChildFileName)
  await chainVhd(handler, childFileName, handler, grandChildFileName, true)

  // merge
  await vhdMerge(handler, parentFileName, [childFileName, grandChildFileName])

  // check that vhd is still valid
  await checkFile(parentFileName)

  const parentVhd = new VhdFile(handler, parentFileName)
  await parentVhd.readHeaderAndFooter()
  await parentVhd.readBlockAllocationTable()

  let offset = 0
  // check that the data are the same as source
  for await (const block of parentVhd.blocks()) {
    const blockContent = block.data
    const file = offset < mbOfChildren * 1024 * 1024 ? grandChildFileName : parentRandomFileName
    const buffer = Buffer.alloc(blockContent.length)
    const fd = await fs.open(file, 'r')
    await fs.read(fd, buffer, 0, buffer.length, offset)

    expect(buffer.equals(blockContent)).toEqual(true)
    offset += parentVhd.header.blockSize
  }
})
