/* eslint-env jest */
import rimraf from 'rimraf'
import tmp from 'tmp'
import { createWriteStream } from 'fs'
import { fromCallback as pFromCallback, fromEvent } from 'promise-toolbox'

import { createFooter, ReadableRawVHDStream } from './vhd'

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

test('createFooter() does not crash', () => {
  createFooter(104448, Math.floor(Date.now() / 1000), {
    cylinders: 3,
    heads: 4,
    sectorsPerTrack: 17,
  })
})

test('ReadableRawVHDStream does not crash', async () => {
  const data = [
    {
      offsetBytes: 100,
      data: Buffer.from('azerzaerazeraze', 'ascii'),
    },
    {
      offsetBytes: 700,
      data: Buffer.from('gdfslkdfguer', 'ascii'),
    },
  ]
  let index = 0
  const mockParser = {
    next: () => {
      if (index < data.length) {
        const result = data[index]
        index++
        return result
      } else {
        return null
      }
    },
  }
  const stream = new ReadableRawVHDStream(100000, mockParser)
  const pipe = stream.pipe(createWriteStream('outputStream'))
  await fromEvent(pipe, 'finish')
})

test('ReadableRawVHDStream detects when blocks are out of order', async () => {
  const data = [
    {
      offsetBytes: 700,
      data: Buffer.from('azerzaerazeraze', 'ascii'),
    },
    {
      offsetBytes: 100,
      data: Buffer.from('gdfslkdfguer', 'ascii'),
    },
  ]
  let index = 0
  const mockParser = {
    next: () => {
      if (index < data.length) {
        const result = data[index]
        index++
        return result
      } else {
        return null
      }
    },
  }
  return expect(
    new Promise((resolve, reject) => {
      const stream = new ReadableRawVHDStream(100000, mockParser)
      stream.on('error', reject)
      const pipe = stream.pipe(createWriteStream('outputStream'))
      pipe.on('finish', resolve)
      pipe.on('error', reject)
    })
  ).rejects.toThrow('Received out of order blocks')
})
