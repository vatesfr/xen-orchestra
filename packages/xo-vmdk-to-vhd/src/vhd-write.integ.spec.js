/* eslint-env jest */
import { computeGeometryForSize } from '@xen-orchestra/vhd-lib'
import execa from 'execa'
import { createWriteStream } from 'fs'
import { exec } from 'child-process-promise'
import { readFile } from 'fs-promise'
import { fromCallback as pFromCallback } from 'promise-toolbox'
import rimraf from 'rimraf'
import tmp from 'tmp'

import {
  createDynamicDiskHeader,
  createFooter,
  ReadableRawVHDStream,
  VHDFile,
} from './vhd-write'

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

test('createDynamicDiskHeader() does not crash', () => {
  createDynamicDiskHeader(1, 0x00200000)
})

test('ReadableRawVHDStream does not crash', async () => {
  const data = [
    {
      lbaBytes: 100,
      grain: Buffer.from('azerzaerazeraze', 'ascii'),
    },
    {
      lbaBytes: 700,
      grain: Buffer.from('gdfslkdfguer', 'ascii'),
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
  return new Promise((resolve, reject) => {
    pipe.on('finish', resolve)
    pipe.on('error', reject)
  })
})

test('ReadableRawVHDStream detects when blocks are out of order', () => {
  const data = [
    {
      lbaBytes: 700,
      grain: Buffer.from('azerzaerazeraze', 'ascii'),
    },
    {
      lbaBytes: 100,
      grain: Buffer.from('gdfslkdfguer', 'ascii'),
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
  ).rejects.toThrow(
    'This VMDK file does not have its blocks in the correct order'
  )
})

test('writing a known file with VHDFile is successful', async () => {
  const fileName = 'output.vhd'
  const rawFilename = 'output.raw'
  const randomFileName = 'random.raw'
  const geometry = computeGeometryForSize(1024 * 1024 * 8)
  const dataSize = geometry.actualSize
  await exec(
    'base64 /dev/urandom | head -c ' + dataSize + ' > ' + randomFileName
  )
  const buffer = await readFile(randomFileName)
  const f = new VHDFile(buffer.length, 523557791)
  const splitPoint = Math.floor(Math.random() * buffer.length)
  f.writeBuffer(buffer.slice(splitPoint), splitPoint)
  f.writeBuffer(buffer.slice(0, splitPoint), 0)
  f.writeBuffer(buffer.slice(splitPoint), splitPoint)
  await f.writeFile(fileName)
  await execa('vhd-util', ['check', '-p', '-b', '-t', '-n', fileName])
  await exec('qemu-img convert -fvpc -Oraw ' + fileName + ' ' + rawFilename)
  const fileContent = await readFile(rawFilename)
  expect(fileContent.length).toEqual(dataSize)
  for (let i = 0; i < fileContent.length; i++) {
    expect(fileContent[i]).toEqual(buffer[i])
  }
})
