/* eslint-env jest */

import { createReadStream } from 'fs-extra'
import { exec } from 'child-process-promise'
import { pFromCallback } from 'promise-toolbox'
import rimraf from 'rimraf'
import tmp from 'tmp'

import VMDKDirectParser from './vmdk-read'

jest.setTimeout(10000)

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

test('VMDKDirectParser reads OK', async () => {
  const rawFileName = 'random-data'
  const fileName = 'random-data.vmdk'
  await exec('base64 /dev/urandom | head -c 104448 > ' + rawFileName)
  await exec(
    'rm -f ' +
      fileName +
      '&& python /usr/share/pyshared/VMDKstream.py ' +
      rawFileName +
      ' ' +
      fileName
  )
  const parser = new VMDKDirectParser(createReadStream(fileName))
  const header = await parser.readHeader()
  const harvested = []
  for await (const res of parser.blockIterator()) {
    harvested.push(res)
  }
  expect(harvested.length).toEqual(2)
  expect(harvested[0].offsetBytes).toEqual(0)
  expect(harvested[0].data.length).toEqual(header['grainSizeSectors'] * 512)
  expect(harvested[1].offsetBytes).toEqual(header['grainSizeSectors'] * 512)
})
