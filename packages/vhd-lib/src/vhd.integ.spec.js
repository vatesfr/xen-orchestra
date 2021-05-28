/* eslint-env jest */
import execa from 'execa'
import rimraf from 'rimraf'
import tmp from 'tmp'
import { createWriteStream, readFile } from 'fs-extra'
import { fromEvent, pFromCallback } from 'promise-toolbox'
import { pipeline } from 'readable-stream'

import { createReadableRawStream, createReadableSparseStream } from './'

import { createFooter } from './_createFooterHeader'

let tempDir = null

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
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
      logicalAddressBytes: 100,
      data: Buffer.from('azerzaerazeraze', 'ascii'),
    },
    {
      logicalAddressBytes: 700,
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
  const stream = createReadableRawStream(fileSize, mockParser)
  await pFromCallback(cb => pipeline(stream, createWriteStream(`${tempDir}/output.vhd`), cb))
  await execa('vhd-util', ['check', '-t', '-i', '-n', `${tempDir}/output.vhd`])
})

test('ReadableRawVHDStream detects when blocks are out of order', async () => {
  const data = [
    {
      logicalAddressBytes: 700,
      data: Buffer.from('azerzaerazeraze', 'ascii'),
    },
    {
      logicalAddressBytes: 100,
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
      const stream = createReadableRawStream(100000, mockParser)
      stream.on('error', reject)
      pipeline(stream, createWriteStream(`${tempDir}/outputStream`), err => (err ? reject(err) : resolve()))
    })
  ).rejects.toThrow('Received out of order blocks')
})

test('ReadableSparseVHDStream can handle a sparse file', async () => {
  const blockSize = Math.pow(2, 16)
  const blocks = [
    {
      logicalAddressBytes: blockSize * 3,
      data: Buffer.alloc(blockSize, 'azerzaerazeraze', 'ascii'),
    },
    {
      logicalAddressBytes: blockSize * 100,
      data: Buffer.alloc(blockSize, 'gdfslkdfguer', 'ascii'),
    },
  ]
  const fileSize = blockSize * 110
  const stream = await createReadableSparseStream(
    fileSize,
    blockSize,
    blocks.map(b => b.logicalAddressBytes / blockSize),
    blocks
  )
  expect(stream.length).toEqual(4197888)
  const pipe = stream.pipe(createWriteStream(`${tempDir}/output.vhd`))
  await fromEvent(pipe, 'finish')
  await execa('vhd-util', ['check', '-t', '-i', '-n', `${tempDir}/output.vhd`])
  await execa('qemu-img', ['convert', '-f', 'vpc', '-O', 'raw', `${tempDir}/output.vhd`, `${tempDir}/out1.raw`])
  const out1 = await readFile(`${tempDir}/out1.raw`)
  const expected = Buffer.alloc(fileSize)
  blocks.forEach(b => {
    b.data.copy(expected, b.logicalAddressBytes)
  })
  await expect(out1.slice(0, expected.length)).toEqual(expected)
})
