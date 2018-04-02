/* eslint-env jest */

import { createReadStream, readFile } from 'fs-promise'
import { exec } from 'child-process-promise'

import { VirtualBuffer } from './virtual-buffer'

test('Virtual Buffer can read a file correctly', async () => {
  const rawFileName = 'random-data'
  await exec('base64 /dev/urandom | head -c 104448 > ' + rawFileName)
  const buffer = new VirtualBuffer(createReadStream(rawFileName))
  const part1 = await buffer.readChunk(10)
  const part2 = await buffer.readChunk(-1)
  const original = await readFile(rawFileName)
  expect(buffer.isDepleted).toBeTruthy()
  expect(Buffer.concat([part1, part2]).toString('ascii')).toEqual(
    original.toString('ascii')
  )
})
