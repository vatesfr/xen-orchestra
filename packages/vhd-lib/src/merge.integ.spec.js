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
  const randomFilePath = `${tempDir}/randomfile`
  const random2FilePath = `${tempDir}/randomfile2`
  const smallRandomFilePath = `${tempDir}/small_randomfile`
  const parentFilePath = `${tempDir}/parent.vhd`
  const child1FilePath = `${tempDir}/child1.vhd`
  const child2FilePath = `${tempDir}/child2.vhd`
  const recoveredFilePath = `${tempDir}/recovered`
  await createRandomFile(randomFilePath, mbOfRandom)
  await createRandomFile(smallRandomFilePath, Math.ceil(mbOfRandom / 2))
  await execa('qemu-img', ['create', '-fvpc', parentFilePath, mbOfRandom + 1 + 'M'])
  await checkFile(parentFilePath)
  await convertFromRawToVhd(randomFilePath, child1FilePath)
  const handler = getHandler({ url: `file://${tempDir}/` })
  await execa('vhd-util', ['snapshot', '-n', child2FilePath, '-p', child1FilePath])
  const vhd = new VhdFile(handler, 'child2.vhd')
  await vhd.readHeaderAndFooter()
  await vhd.readBlockAllocationTable()
  vhd.footer.creatorApplication = 'xoa'
  await vhd.writeFooter()

  const originalSize = await handler._getSize('randomfile')
  await checkFile(child1FilePath)
  await chainVhd(handler, 'parent.vhd', handler, 'child1.vhd', true)
  await checkFile(child1FilePath)
  await chainVhd(handler, 'child1.vhd', handler, 'child2.vhd', true)
  await checkFile(child2FilePath)
  const smallRandom = await fs.readFile(smallRandomFilePath)
  const newVhd = new VhdFile(handler, 'child2.vhd')
  await newVhd.readHeaderAndFooter()
  await newVhd.readBlockAllocationTable()
  await newVhd.writeData(5, smallRandom)
  await checkFile(child2FilePath)
  await checkFile(child1FilePath)
  await checkFile(parentFilePath)
  await vhdMerge(handler, 'parent.vhd', handler, 'child1.vhd')
  await checkFile(parentFilePath)
  await chainVhd(handler, 'parent.vhd', handler, 'child2.vhd', true)
  await checkFile(child2FilePath)
  await vhdMerge(handler, 'parent.vhd', handler, 'child2.vhd')
  await checkFile(parentFilePath)
  await recoverRawContent(parentFilePath, recoveredFilePath, originalSize)
  await execa('cp', [randomFilePath, random2FilePath])
  const fd = await fs.open(random2FilePath, 'r+')
  try {
    await fs.write(fd, smallRandom, 0, smallRandom.length, 5 * SECTOR_SIZE)
  } finally {
    await fs.close(fd)
  }
  expect(await fs.readFile(recoveredFilePath)).toEqual(await fs.readFile(random2FilePath))
})
