/* eslint-env jest */

import { createReadStream } from 'fs-promise'
import { exec } from 'child-process-promise'

import { VMDKDirectParser } from './vmdk-read'

jest.setTimeout(10000)

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
  while (true) {
    const res = await parser.next()
    if (res === null) {
      break
    }
    harvested.push(res)
  }
  expect(harvested.length).toEqual(2)
  expect(harvested[0].lba).toEqual(0)
  expect(harvested[1].lba).toEqual(header['grainSizeSectors'])
})
