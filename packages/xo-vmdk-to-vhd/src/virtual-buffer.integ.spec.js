/* eslint-env jest */

import { createReadStream, readFile } from 'fs-extra'
import { exec } from 'child-process-promise'
import { pFromCallback } from 'promise-toolbox'
import rimraf from 'rimraf'
import tmp from 'tmp'

import { VirtualBuffer } from './virtual-buffer'

const initialDir = process.cwd()

beforeEach(async () => {
  const dir = await pFromCallback(cb => tmp.dir(cb))
  process.chdir(dir)
})

afterEach(async () => {
  const tmpDir = process.cwd()
  process.chdir(initialDir)
  await pFromCallback(cb => rimraf(tmpDir, cb))
})

test('Virtual Buffer can read a file correctly', async () => {
  const rawFileName = 'random-data'
  await exec('base64 /dev/urandom | head -c 1048 > ' + rawFileName)
  const buffer = new VirtualBuffer(createReadStream(rawFileName))
  const part1 = await buffer.readChunk(10)
  const part2 = await buffer.readChunk(1038)
  const original = await readFile(rawFileName)
  expect(buffer.isDepleted).toBeTruthy()
  expect(Buffer.concat([part1, part2]).toString('ascii')).toEqual(
    original.toString('ascii')
  )
})
