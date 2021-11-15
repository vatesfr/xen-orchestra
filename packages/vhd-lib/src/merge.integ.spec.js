/* eslint-env jest */

import execa from 'execa'
import fs from 'fs-extra'
import rimraf from 'rimraf'
import tmp from 'tmp'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'

import { VhdFile, chainVhd, mergeVhd as vhdMerge } from './index'

import { SECTOR_SIZE } from './_constants'
import { checkFile, createRandomFile, convertFromRawToVhd, recoverRawContent } from './tests/utils'

let tempDir = null

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

test('coalesce works in normal cases', async () => {
  const mbOfRandom = 5
  const randomFileName = `${tempDir}/randomfile`
  const random2FileName = `${tempDir}/randomfile2`
  const smallRandomFileName = `${tempDir}/small_randomfile`
  const parentFileName = `${tempDir}/parent.vhd`
  const child1FileName = `${tempDir}/child1.vhd`
  const child2FileName = `${tempDir}/child2.vhd`
  const recoveredFileName = `${tempDir}/recovered`
  await createRandomFile(randomFileName, mbOfRandom)
  await createRandomFile(smallRandomFileName, Math.ceil(mbOfRandom / 2))
  await execa('qemu-img', ['create', '-fvpc', parentFileName, mbOfRandom + 1 + 'M'])
  await checkFile(parentFileName)
  await convertFromRawToVhd(randomFileName, child1FileName)
  const handler = getHandler({ url: 'file://' })
  await execa('vhd-util', ['snapshot', '-n', child2FileName, '-p', child1FileName])
  const vhd = new VhdFile(handler, child2FileName)
  await vhd.readHeaderAndFooter()
  await vhd.readBlockAllocationTable()
  vhd.footer.creatorApplication = 'xoa'
  await vhd.writeFooter()

  const originalSize = await handler._getSize(randomFileName)
  await checkFile(child1FileName)
  await chainVhd(handler, parentFileName, handler, child1FileName, true)
  await checkFile(child1FileName)
  await chainVhd(handler, child1FileName, handler, child2FileName, true)
  await checkFile(child2FileName)
  const smallRandom = await fs.readFile(smallRandomFileName)
  const newVhd = new VhdFile(handler, child2FileName)
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd.writeData(5, smallRandom)
  await checkFile(child2FileName)
  await checkFile(child1FileName)
  await checkFile(parentFileName)
  await vhdMerge(handler, parentFileName, handler, child1FileName)
  await checkFile(parentFileName)
  await chainVhd(handler, parentFileName, handler, child2FileName, true)
  await checkFile(child2FileName)
  await vhdMerge(handler, parentFileName, handler, child2FileName)
  await checkFile(parentFileName)
  await recoverRawContent(parentFileName, recoveredFileName, originalSize)
  await execa('cp', [randomFileName, random2FileName])
  const fd = await fs.open(random2FileName, 'r+')
  try {
    await fs.write(fd, smallRandom, 0, smallRandom.length, 5 * SECTOR_SIZE)
  } finally {
    await fs.close(fd)
  }
  expect(await fs.readFile(recoveredFileName)).toEqual(await fs.readFile(random2FileName))
})
