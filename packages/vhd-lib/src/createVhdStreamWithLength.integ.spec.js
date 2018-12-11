/* eslint-env jest */

import execa from 'execa'
import fs from 'fs-extra'
import rimraf from 'rimraf'
import getStream from 'get-stream'
import tmp from 'tmp'
import { createReadStream, createWriteStream } from 'fs'
import { fromEvent, pFromCallback } from 'promise-toolbox'

import { createVhdStreamWithLength } from '.'
import { FOOTER_SIZE } from './_constants'

let tempDir = null

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

async function convertFromRawToVhd(rawName, vhdName) {
  await execa('qemu-img', ['convert', '-f', 'raw', '-Ovpc', rawName, vhdName])
}

async function createRandomFile(name, size) {
  await fromEvent(
    createReadStream('/dev/urandom', { end: size - 1 }).pipe(
      fs.createWriteStream(name)
    ),
    'finish'
  )
}

test('createVhdStreamWithLength can extract length', async () => {
  const initalSize = 40 * 1024 * 1024
  const rawFileName = `${tempDir}/randomfile`
  const vhdName = `${tempDir}/randomfile.vhd`
  const outputVhdName = `${tempDir}/output.vhd`
  await createRandomFile(rawFileName, initalSize)
  await convertFromRawToVhd(rawFileName, vhdName)
  const vhdSize = fs.statSync(vhdName).size
  const result = await createVhdStreamWithLength(
    await createReadStream(vhdName)
  )
  expect(result.length).toEqual(vhdSize)
  const outputFileStream = await createWriteStream(outputVhdName)
  await fromEvent(result.pipe(outputFileStream), 'finish')
  const outputSize = fs.statSync(outputVhdName).size
  expect(outputSize).toEqual(vhdSize)
})

test('createVhdStreamWithLength can skip blank after last block and before footer', async () => {
  const initalSize = 40 * 1024 * 1024
  const rawFileName = `${tempDir}/randomfile`
  const vhdName = `${tempDir}/randomfile.vhd`
  const outputVhdName = `${tempDir}/output.vhd`
  await createRandomFile(rawFileName, initalSize)
  await convertFromRawToVhd(rawFileName, vhdName)
  const vhdSize = fs.statSync(vhdName).size
  // read file footer
  const footer = await getStream.buffer(
    createReadStream(vhdName, { start: vhdSize - FOOTER_SIZE })
  )

  // we'll override the footer
  const endOfFile = await createWriteStream(vhdName, {
    flags: 'r+',
    start: vhdSize - FOOTER_SIZE,
  })
  // write a blank over the previous footer
  await pFromCallback(cb => endOfFile.write(Buffer.alloc(FOOTER_SIZE), cb))
  // write the footer after the new blank
  await pFromCallback(cb => endOfFile.end(footer, cb))
  const longerSize = fs.statSync(vhdName).size
  // check input file has been lengthened
  expect(longerSize).toEqual(vhdSize + FOOTER_SIZE)
  const result = await createVhdStreamWithLength(
    await createReadStream(vhdName)
  )
  expect(result.length).toEqual(vhdSize)
  const outputFileStream = await createWriteStream(outputVhdName)
  await fromEvent(result.pipe(outputFileStream), 'finish')
  const outputSize = fs.statSync(outputVhdName).size
  // check out file has been shortened again
  expect(outputSize).toEqual(vhdSize)
  await execa('qemu-img', ['compare', outputVhdName, vhdName])
})
