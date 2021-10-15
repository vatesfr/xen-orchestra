/* eslint-env jest */

import execa from 'execa'
import fs from 'fs-extra'
import rimraf from 'rimraf'
import tmp from 'tmp'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'

import { checkFile, createRandomFile, convertFromRawToVhd } from './tests/utils'
import { createSyntheticStream } from '.'

let tempDir = null

//jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

const readAll = (stream, size) =>{
  return new Promise((resolve, reject)=>{
    const buffer = Buffer.alloc(size)
    const read = 0
    stream.on('data', data => {
      console.log('got data ', data.length)
      data.copy(buffer,read)
      read += data.length
    })
    stream.on('end', () => resolve(buffer))
  })
}
test.only('createSyntheticStream passes vhd-util check', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  const vhdFileName = `${tempDir}/randomfile.vhd`
  const recoveredVhdFileName = `${tempDir}/recovered.vhd`
  await createRandomFile(rawFileName, initalSize)
  await convertFromRawToVhd(rawFileName, vhdFileName)
  //await checkFile(vhdFileName)
  const expectedVhdSize = (await fs.stat(vhdFileName)).size

  const handler = getHandler({ url: 'file://' })
  console.log('wil create stream')
  const stream = await createSyntheticStream(handler, [vhdFileName])
  const output = fs.createWriteStream(recoveredVhdFileName)
  console.log('stream created')
  expect(stream.length).toEqual(expectedVhdSize)
  console.log('size ok ')

  let buf = await readAll(stream, stream.length)
  console.log(buf.length)

  console.log('written ')
  await checkFile(recoveredVhdFileName)
  console.log('checked recovered ')
  const stats = await fs.stat(recoveredVhdFileName)
  expect(stats.size).toEqual(expectedVhdSize)
  console.log('checked size of recovered ')
  await execa('qemu-img', ['compare', recoveredVhdFileName, rawFileName])
})
