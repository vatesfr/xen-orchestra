/* eslint-env jest */

import { pFromCallback } from 'promise-toolbox'
import tmp from 'tmp'
import rimraf from 'rimraf'
import { createRandomFile, convertFromRawToVhd } from './tests/utils'
import fs from 'fs-extra'
import parseVhdToBlocks from './parseVhdToBlocks'

jest.setTimeout(60000)

let tempDir = null

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

test('vhd parser can spit blocks', async () => {
  const initalSize = 10
  const rawFileName = `${tempDir}/randomfile.raw`
  await createRandomFile(rawFileName, initalSize)
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  const res = await parseVhdToBlocks(fs.createReadStream(vhdFileName))
  expect(res.blockSize).toEqual(2 * 1024 * 1024)
  const fileBuffer = await fs.readFile(rawFileName)
  for await (const b of res.blockGenerator()) {
    expect(b.block).toEqual(fileBuffer.slice(b.lba, b.lba + res.blockSize))
  }
})
