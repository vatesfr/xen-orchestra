/* eslint-env jest */

import asyncIteratorToStream from 'async-iterator-to-stream'
import execa from 'execa'
import fs from 'fs-extra'
import rimraf from 'rimraf'
import getStream from 'get-stream'
import tmp from 'tmp'
import { createReadStream, createWriteStream } from 'fs'
import { pFromCallback } from 'promise-toolbox'
import { pipeline } from 'readable-stream'

import { createVhdStreamWithLength } from '.'
import { FOOTER_SIZE } from './_constants'

let tempDir = null

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

const RAW = 'raw'
const VHD = 'vpc'
const convert = (inputFormat, inputFile, outputFormat, outputFile) =>
  execa('qemu-img', ['convert', '-f', inputFormat, '-O', outputFormat, inputFile, outputFile])

const createRandomStream = asyncIteratorToStream(function* (size) {
  let requested = Math.min(size, yield)
  while (size > 0) {
    const buf = Buffer.allocUnsafe(requested)
    for (let i = 0; i < requested; ++i) {
      buf[i] = Math.floor(Math.random() * 256)
    }
    requested = Math.min((size -= requested), yield buf)
  }
})

async function createRandomFile(name, size) {
  const input = await createRandomStream(size)
  await pFromCallback(cb => pipeline(input, fs.createWriteStream(name), cb))
}

const forOwn = (object, cb) => Object.keys(object).forEach(key => cb(object[key], key, object))

describe('createVhdStreamWithLength', () => {
  forOwn(
    {
      // qemu-img requires this length or it fill with null bytes which breaks
      // the test
      'can extract length': 34816,

      'can handle empty file': 0,
    },
    (size, title) =>
      it(title, async () => {
        const inputRaw = `${tempDir}/input.raw`
        await createRandomFile(inputRaw, size)

        const inputVhd = `${tempDir}/input.vhd`
        await convert(RAW, inputRaw, VHD, inputVhd)

        const result = await createVhdStreamWithLength(await createReadStream(inputVhd))
        const { length } = result

        const outputVhd = `${tempDir}/output.vhd`
        await pFromCallback(pipeline.bind(undefined, result, await createWriteStream(outputVhd)))

        // ensure the guessed length correspond to the stream length
        const { size: outputSize } = await fs.stat(outputVhd)
        expect(length).toEqual(outputSize)

        // ensure the generated VHD is correct and contains the same data
        const outputRaw = `${tempDir}/output.raw`
        await convert(VHD, outputVhd, RAW, outputRaw)
        await execa('cmp', [inputRaw, outputRaw])
      })
  )

  it('can skip blank after the last block and before the footer', async () => {
    const initialSize = 4 * 1024
    const rawFileName = `${tempDir}/randomfile`
    const vhdName = `${tempDir}/randomfile.vhd`
    const outputVhdName = `${tempDir}/output.vhd`
    await createRandomFile(rawFileName, initialSize)
    await convert(RAW, rawFileName, VHD, vhdName)
    const { size: vhdSize } = await fs.stat(vhdName)
    // read file footer
    const footer = await getStream.buffer(createReadStream(vhdName, { start: vhdSize - FOOTER_SIZE }))

    // we'll override the footer
    const endOfFile = await createWriteStream(vhdName, {
      flags: 'r+',
      start: vhdSize - FOOTER_SIZE,
    })
    // write a blank over the previous footer
    await pFromCallback(cb => endOfFile.write(Buffer.alloc(FOOTER_SIZE), cb))
    // write the footer after the new blank
    await pFromCallback(cb => endOfFile.end(footer, cb))
    const { size: longerSize } = await fs.stat(vhdName)
    // check input file has been lengthened
    expect(longerSize).toEqual(vhdSize + FOOTER_SIZE)
    const result = await createVhdStreamWithLength(await createReadStream(vhdName))
    expect(result.length).toEqual(vhdSize)
    const outputFileStream = await createWriteStream(outputVhdName)
    await pFromCallback(cb => pipeline(result, outputFileStream, cb))
    const { size: outputSize } = await fs.stat(outputVhdName)
    // check out file has been shortened again
    expect(outputSize).toEqual(vhdSize)
    await execa('qemu-img', ['compare', outputVhdName, vhdName])
  })
})
