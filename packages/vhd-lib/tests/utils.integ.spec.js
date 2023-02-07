'use strict'

/* eslint-env jest */

const fs = require('fs-extra')
const rimraf = require('rimraf')
const tmp = require('tmp')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { pFromCallback } = require('promise-toolbox')

const { checkFile, createRandomFile, convertFromRawToVhd } = require('./utils')

let tempDir = null
let disposeHandler

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))

  const d = await getSyncedHandler({ url: `file://${tempDir}` })
  disposeHandler = d.dispose
})

afterEach(async () => {
  await rimraf(tempDir)
  disposeHandler()
})

test('checkFile fails with unvalid VHD file', async () => {
  const initalSizeInMB = 4
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSizeInMB)
  const vhdFileName = `${tempDir}/vhdFile.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)

  await checkFile(vhdFileName)

  const sizeToTruncateInByte = 250000
  await fs.truncate(vhdFileName, sizeToTruncateInByte)
  await expect(async () => await checkFile(vhdFileName)).rejects.toThrow()
})
