/* eslint-env jest */

import { createReadStream, stat } from 'fs-extra'
import { exec } from 'child-process-promise'
import { pFromCallback } from 'promise-toolbox'
import rimraf from 'rimraf'
import tmp from 'tmp'

import VMDKDirectParser from './vmdk-read'
import getStream from 'get-stream'
import { readVmdkGrainTable } from './index'

// noinspection DuplicatedCode
function createFileAccessor(file) {
  return async (start, end) => {
    if (start < 0 || end < 0) {
      const fileLength = (await stat(file)).size
      start = start < 0 ? fileLength + start : start
      end = end < 0 ? fileLength + end : end
    }
    const result = await getStream.buffer(createReadStream(file, { start, end: end - 1 }))
    // crazy stuff to get a browser-compatible ArrayBuffer from a node buffer
    // https://stackoverflow.com/a/31394257/72637
    return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength)
  }
}

function bufferToArray(buffer) {
  const view = new DataView(buffer)
  const res = []
  for (let i = 0; i < buffer.byteLength; i += 4) {
    res.push(view.getUint32(i, true))
  }
  return res
}

jest.setTimeout(10000)

const initialDir = process.cwd()

beforeEach(async () => {
  const dir = await pFromCallback(cb => tmp.dir(cb))
  process.chdir(dir)
})

afterEach(async () => {
  const tmpDir = process.cwd()
  process.chdir(initialDir)
  await rimraf(tmpDir)
})

test('VMDKDirectParser reads OK', async () => {
  const rawFileName = 'random-data'
  const fileName = 'random-data.vmdk'
  await exec('base64 /dev/urandom | head -c 104448 > ' + rawFileName)
  await exec(
    'rm -f ' + fileName + '&& python /usr/lib/python3/dist-packages/VMDKstream.py ' + rawFileName + ' ' + fileName
  )
  const data = await readVmdkGrainTable(createFileAccessor(fileName))
  const parser = new VMDKDirectParser(
    createReadStream(fileName),
    bufferToArray(data.grainLogicalAddressList),
    bufferToArray(data.grainFileOffsetList)
  )
  const header = await parser.readHeader()
  const harvested = []
  for await (const res of parser.blockIterator()) {
    harvested.push(res)
  }
  expect(harvested.length).toEqual(2)
  expect(harvested[0].logicalAddressBytes).toEqual(0)
  expect(harvested[0].data.length).toEqual(header.grainSizeSectors * 512)
  expect(harvested[1].logicalAddressBytes).toEqual(header.grainSizeSectors * 512)
})
