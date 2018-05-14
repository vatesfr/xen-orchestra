/* eslint-env jest */
import execa from 'execa'
import rimraf from 'rimraf'
import tmp from 'tmp'
import { createWriteStream, readFile } from 'fs-promise'
import { fromCallback as pFromCallback, fromEvent } from 'promise-toolbox'

import { createFooter } from './_createFooterHeader'
import createReadableRawVHDStream from './createReadableRawStream'
import createReadableSparseVHDStream from './createReadableSparseStream'

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
  const fileSize = 1000
  const stream = createReadableRawVHDStream(fileSize, mockParser)
  const pipe = stream.pipe(createWriteStream('output.vhd'))
  await fromEvent(pipe, 'finish')
  await execa('vhd-util', ['check', '-t', '-i', '-n', 'output.vhd'])
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
      const stream = createReadableRawVHDStream(100000, mockParser)
      stream.on('error', reject)
      const pipe = stream.pipe(createWriteStream('outputStream'))
      pipe.on('finish', resolve)
      pipe.on('error', reject)
    })
  ).rejects.toThrow('Received out of order blocks')
})

test('ReadableSparseVHDStream can handle a sparse file', async () => {
  const blockSize = Math.pow(2, 16)
  const blocks = [
    {
      offsetBytes: blockSize * 3,
      data: Buffer.alloc(blockSize, 'azerzaerazeraze', 'ascii'),
    },
    {
      offsetBytes: blockSize * 5,
      data: Buffer.alloc(blockSize, 'gdfslkdfguer', 'ascii'),
    },
  ]
  const fileSize = blockSize * 10
  const stream = createReadableSparseVHDStream(
    fileSize,
    blockSize,
    [100, 700],
    blocks
  )
  const pipe = stream.pipe(createWriteStream('output.vhd'))
  await fromEvent(pipe, 'finish')
  await execa('vhd-util', ['check', '-t', '-i', '-n', 'output.vhd'])
  await execa('qemu-img', [
    'convert',
    '-f',
    'vpc',
    '-O',
    'raw',
    'output.vhd',
    'out1.raw',
  ])
  const out1 = await readFile('out1.raw')
  const expected = Buffer.alloc(fileSize)
  blocks.forEach(b => {
    b.data.copy(expected, b.offsetBytes)
  })
  await expect(out1.slice(0, expected.length)).toEqual(expected)
})
