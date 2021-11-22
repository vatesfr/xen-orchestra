/* eslint-env jest */

import execa from 'execa'
import fs from 'fs-extra'
import rimraf from 'rimraf'
import tmp from 'tmp'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { pipeline } from 'readable-stream'

import { checkFile, createRandomFile, convertFromRawToVhd } from './tests/utils'
import { createSyntheticStream } from '.'

let tempDir = null

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})
test.only('createSyntheticStream passes vhd-util check', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  const vhdFileName = `${tempDir}/randomfile.vhd`
  const recoveredVhdFileName = `${tempDir}/recovered.vhd`
  await createRandomFile(rawFileName, initalSize)
  await convertFromRawToVhd(rawFileName, vhdFileName)
  await checkFile(vhdFileName)
  const handler = getHandler({ url: 'file://' })
  const stream = await createSyntheticStream(handler, vhdFileName)
  const expectedVhdSize = (await fs.stat(vhdFileName)).size
  expect(stream.length).toEqual((await fs.stat(vhdFileName)).size)
  await pFromCallback(cb => pipeline(stream, fs.createWriteStream(recoveredVhdFileName), cb))
  const stats = await fs.stat(recoveredVhdFileName)
  expect(stats.size).toEqual(expectedVhdSize)
  await checkFile(recoveredVhdFileName)
  await execa('qemu-img', ['compare', recoveredVhdFileName, rawFileName])
})
