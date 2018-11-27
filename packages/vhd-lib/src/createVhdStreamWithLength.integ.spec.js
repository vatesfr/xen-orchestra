/* eslint-env jest */

import execa from 'execa'
import fs from 'fs-extra'
import rimraf from 'rimraf'
import getBuffer from 'get-buffer'
import tmp from 'tmp'
import { createReadStream, createWriteStream } from 'fs-promise'
import { fromEvent, pFromCallback } from 'promise-toolbox'

import { createVhdStreamWithLength } from '.'
import { FOOTER_SIZE } from './_constants'

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

async function convertFromRawToVhd(rawName, vhdName) {
  await execa('qemu-img', ['convert', '-f', 'raw', '-Ovpc', rawName, vhdName])
}

async function createRandomFile(name, size) {
  await execa('bash', ['-c', `head -c ${size} /dev/urandom  >${name}`])
}

test('createVhdStreamWithLength can extract length', async () => {
  const initalSize = 40 * 1204 * 1024
  await createRandomFile('randomfile', initalSize)
  const vhdName = 'randomfile.vhd'
  await convertFromRawToVhd('randomfile', vhdName)
  const vhdSize = fs.statSync(vhdName).size
  const result = await createVhdStreamWithLength(
    await createReadStream(vhdName)
  )
  expect(result.length).toEqual(vhdSize)
  const outputFileStream = await createWriteStream('output.vhd')
  await fromEvent(result.pipe(outputFileStream), 'finish')
  const outputSize = fs.statSync('output.vhd').size
  expect(outputSize).toEqual(vhdSize)
})

test('createVhdStreamWithLength can skip blank after last block and before footer', async () => {
  const initalSize = 40 * 1204 * 1024
  await createRandomFile('randomfile', initalSize)
  const vhdName = 'randomfile.vhd'
  await convertFromRawToVhd('randomfile', vhdName)
  const vhdSize = fs.statSync(vhdName).size
  // read file footer
  const footer = await getBuffer.fromStream(
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
  const outputFileStream = await createWriteStream('recovered.vhd')
  await fromEvent(result.pipe(outputFileStream), 'finish')
  const outputSize = fs.statSync('recovered.vhd').size
  // check out file has been shortened again
  expect(outputSize).toEqual(vhdSize)
  await execa('qemu-img', ['compare', 'recovered.vhd', 'randomfile.vhd'])
})
