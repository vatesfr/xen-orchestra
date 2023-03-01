'use strict'

/* eslint-env jest */

const fs = require('fs-extra')
const rimraf = require('rimraf')
const tmp = require('tmp')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { pFromCallback, Disposable } = require('promise-toolbox')

const { VhdFile, chainVhd, openVhd, VhdAbstract } = require('./index')
const { mergeVhdChain } = require('./merge')

const { checkFile, createRandomFile, convertFromRawToVhd } = require('./tests/utils')

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

test('merge works in normal cases', async () => {
  const mbOfFather = 8
  const mbOfChildren = 4
  const parentRandomFileName = `randomfile`
  const childRandomFileName = `small_randomfile`
  const parentFileName = `parent.vhd`
  const child1FileName = `child1.vhd`

  await createRandomFile(`${tempDir}/${parentRandomFileName}`, mbOfFather)
  await convertFromRawToVhd(`${tempDir}/${parentRandomFileName}`, `${tempDir}/${parentFileName}`)
  await createRandomFile(`${tempDir}/${childRandomFileName}`, mbOfChildren)
  await convertFromRawToVhd(`${tempDir}/${childRandomFileName}`, `${tempDir}/${child1FileName}`)
  await chainVhd(handler, parentFileName, handler, child1FileName, true)
  await checkFile(`${tempDir}/${parentFileName}`)

  // merge
  await mergeVhdChain(handler, [parentFileName, child1FileName])

  // check that the merged vhd is still valid
  await checkFile(`${tempDir}/${child1FileName}`)

  const parentVhd = new VhdFile(handler, child1FileName)
  await parentVhd.readHeaderAndFooter()
  await parentVhd.readBlockAllocationTable()

  let offset = 0
  // check that the data are the same as source
  for await (const block of parentVhd.blocks()) {
    const blockContent = block.data
    const file = offset < mbOfChildren * 1024 * 1024 ? childRandomFileName : parentRandomFileName
    const buffer = Buffer.alloc(blockContent.length)
    const fd = await fs.open(`${tempDir}/${file}`, 'r')
    await fs.read(fd, buffer, 0, buffer.length, offset)

    expect(buffer.equals(blockContent)).toEqual(true)
    offset += parentVhd.header.blockSize
  }
})

test('it can resume a simple merge ', async () => {
  const mbOfFather = 8
  const mbOfChildren = 4
  const parentRandomFileName = `${tempDir}/randomfile`
  const childRandomFileName = `${tempDir}/small_randomfile`

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
  await expect(async () => await mergeVhdChain(handler, ['parent.vhd', 'child1.vhd'])).rejects.toThrow()

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
  await expect(async () => await mergeVhdChain(handler, ['parent.vhd', 'child1.vhd'])).rejects.toThrow()

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
  await mergeVhdChain(handler, ['parent.vhd', 'child1.vhd'])

  // reload header footer and block allocation table , they should succed
  await childVhd.readHeaderAndFooter()
  await childVhd.readBlockAllocationTable()
  let offset = 0
  // check that the data are the same as source
  for await (const block of childVhd.blocks()) {
    const blockContent = block.data
    // first block is marked as already merged, should not be modified
    // second block should come from children
    // then two block only in parent
    const file = block.id === 1 ? childRandomFileName : parentRandomFileName
    const buffer = Buffer.alloc(blockContent.length)
    const fd = await fs.open(file, 'r')
    await fs.read(fd, buffer, 0, buffer.length, offset)

    expect(buffer.equals(blockContent)).toEqual(true)
    offset += childVhd.header.blockSize
  }
})

test('it can resume a failed renaming', async () => {
  const mbOfFather = 8
  const mbOfChildren = 4
  const parentRandomFileName = `${tempDir}/randomfile`

  const parentName = 'parentvhd.alias.vhd'
  const childName = 'childvhd.alias.vhd'

  await createRandomFile(`${tempDir}/randomfile`, mbOfFather)
  await convertFromRawToVhd(`${tempDir}/randomfile`, `${tempDir}/parentdata.vhd`)
  VhdAbstract.createAlias(handler, parentName, 'parentdata.vhd')
  const parentVhd = new VhdFile(handler, 'parentdata.vhd')
  await parentVhd.readHeaderAndFooter()

  await createRandomFile(`${tempDir}/small_randomfile`, mbOfChildren)
  await convertFromRawToVhd(`${tempDir}/small_randomfile`, `${tempDir}/childdata.vhd`)
  await chainVhd(handler, 'parentdata.vhd', handler, 'childdata.vhd', true)
  VhdAbstract.createAlias(handler, childName, 'childdata.vhd')
  const childVhd = new VhdFile(handler, 'childdata.vhd')
  await childVhd.readHeaderAndFooter()

  await handler.writeFile(
    `.${parentName}.merge.json`,
    JSON.stringify({
      parent: {
        header: parentVhd.header.checksum,
      },
      child: {
        header: childVhd.header.checksum,
      },
      step: 'cleanupVhds',
    })
  )
  // expect merge to succeed
  await mergeVhdChain(handler, [parentName, childName])

  // parent have been renamed
  expect(await fs.exists(`${tempDir}/${parentName}`)).toBeFalsy()
  expect(await fs.exists(`${tempDir}/${childName}`)).toBeTruthy()
  expect(await fs.exists(`${tempDir}/.${parentName}.merge.json`)).toBeFalsy()
  // we shouldn't have moved the data, but the child data should have been merged into parent
  expect(await fs.exists(`${tempDir}/parentdata.vhd`)).toBeTruthy()
  expect(await fs.exists(`${tempDir}/childdata.vhd`)).toBeFalsy()

  Disposable.use(openVhd(handler, childName), async mergedVhd => {
    await mergedVhd.readBlockAllocationTable()
    // the resume is at the step 'cleanupVhds' it should not have merged blocks and should still contains parent data

    let offset = 0
    const fd = await fs.open(parentRandomFileName, 'r')
    for await (const block of mergedVhd.blocks()) {
      const blockContent = block.data
      const buffer = Buffer.alloc(blockContent.length)
      await fs.read(fd, buffer, 0, buffer.length, offset)
      expect(buffer.equals(blockContent)).toEqual(true)
      offset += childVhd.header.blockSize
    }
  })

  // merge succeed if renaming was already done
  await handler.writeFile(
    `.${parentName}.merge.json`,
    JSON.stringify({
      parent: {
        header: parentVhd.header.checksum,
      },
      child: {
        header: childVhd.header.checksum,
      },
      step: 'cleanupVhds',
    })
  )
  await mergeVhdChain(handler, [parentName, childName])
  expect(await fs.exists(`${tempDir}/${parentName}`)).toBeFalsy()
  expect(await fs.exists(`${tempDir}/${childName}`)).toBeTruthy()
  // we shouldn't have moved the data, but the child data should have been merged into parent
  expect(await fs.exists(`${tempDir}/parentdata.vhd`)).toBeTruthy()
  expect(await fs.exists(`${tempDir}/childdata.vhd`)).toBeFalsy()
  expect(await fs.exists(`${tempDir}/.${parentName}.merge.json`)).toBeFalsy()
})

test('it can resume a multiple merge ', async () => {
  const mbOfFather = 8
  const mbOfChildren = 6
  const mbOfGrandChildren = 4
  const parentRandomFileName = `${tempDir}/randomfile`
  const childRandomFileName = `${tempDir}/small_randomfile`
  const grandChildRandomFileName = `${tempDir}/another_small_randomfile`
  const parentFileName = `${tempDir}/parent.vhd`
  const childFileName = `${tempDir}/child.vhd`
  const grandChildFileName = `${tempDir}/grandchild.vhd`
  await createRandomFile(parentRandomFileName, mbOfFather)
  await convertFromRawToVhd(parentRandomFileName, parentFileName)

  await createRandomFile(childRandomFileName, mbOfChildren)
  await convertFromRawToVhd(childRandomFileName, childFileName)
  await chainVhd(handler, 'parent.vhd', handler, 'child.vhd', true)

  await createRandomFile(grandChildRandomFileName, mbOfGrandChildren)
  await convertFromRawToVhd(grandChildRandomFileName, grandChildFileName)
  await chainVhd(handler, 'child.vhd', handler, 'grandchild.vhd', true)

  const parentVhd = new VhdFile(handler, 'parent.vhd')
  await parentVhd.readHeaderAndFooter()

  const childVhd = new VhdFile(handler, 'child.vhd')
  await childVhd.readHeaderAndFooter()

  const grandChildVhd = new VhdFile(handler, 'grandchild.vhd')
  await grandChildVhd.readHeaderAndFooter()

  await handler.writeFile(
    `.parent.vhd.merge.json`,
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

  // should fail since the merge state file has only data of parent and child
  await expect(
    async () => await mergeVhdChain(handler, ['parent.vhd', 'child.vhd', 'grandchild.vhd'])
  ).rejects.toThrow()
  // merge
  await handler.unlink(`.parent.vhd.merge.json`)
  await handler.writeFile(
    `.parent.vhd.merge.json`,
    JSON.stringify({
      parent: {
        header: parentVhd.header.checksum,
      },
      child: {
        header: grandChildVhd.header.checksum,
      },
      currentBlock: 1,
      childPath: ['child.vhd', 'grandchild.vhd'],
    })
  )
  // it should succeed
  await mergeVhdChain(handler, ['parent.vhd', 'child.vhd', 'grandchild.vhd'], { removeUnused: true })
  expect(await fs.exists(`${tempDir}/parent.vhd`)).toBeFalsy()
  expect(await fs.exists(`${tempDir}/child.vhd`)).toBeFalsy()
  expect(await fs.exists(`${tempDir}/grandchild.vhd`)).toBeTruthy()
  expect(await fs.exists(`${tempDir}/.parent.vhd.merge.json`)).toBeFalsy()
})

test('it merge multiple child in one pass ', async () => {
  const mbOfFather = 8
  const mbOfChildren = 6
  const mbOfGrandChildren = 4
  const parentRandomFileName = `${tempDir}/randomfile`
  const childRandomFileName = `${tempDir}/small_randomfile`
  const grandChildRandomFileName = `${tempDir}/another_small_randomfile`
  const parentFileName = `${tempDir}/parent.vhd`
  const childFileName = `${tempDir}/child.vhd`
  const grandChildFileName = `${tempDir}/grandchild.vhd`

  await createRandomFile(parentRandomFileName, mbOfFather)
  await convertFromRawToVhd(parentRandomFileName, parentFileName)

  await createRandomFile(childRandomFileName, mbOfChildren)
  await convertFromRawToVhd(childRandomFileName, childFileName)
  await chainVhd(handler, 'parent.vhd', handler, 'child.vhd', true)

  await createRandomFile(grandChildRandomFileName, mbOfGrandChildren)
  await convertFromRawToVhd(grandChildRandomFileName, grandChildFileName)
  await chainVhd(handler, 'child.vhd', handler, 'grandchild.vhd', true)

  // merge
  await mergeVhdChain(handler, ['parent.vhd', 'child.vhd', 'grandchild.vhd'])

  // check that vhd is still valid
  await checkFile(grandChildFileName)

  const parentVhd = new VhdFile(handler, 'grandchild.vhd')
  await parentVhd.readHeaderAndFooter()
  await parentVhd.readBlockAllocationTable()

  let offset = 0
  // check that the data are the same as source
  for await (const block of parentVhd.blocks()) {
    const blockContent = block.data
    let file = parentRandomFileName
    if (offset < mbOfGrandChildren * 1024 * 1024) {
      file = grandChildRandomFileName
    } else if (offset < mbOfChildren * 1024 * 1024) {
      file = childRandomFileName
    }
    const buffer = Buffer.alloc(blockContent.length)
    const fd = await fs.open(file, 'r')
    await fs.read(fd, buffer, 0, buffer.length, offset)
    expect(buffer.equals(blockContent)).toEqual(true)
    offset += parentVhd.header.blockSize
  }
})
