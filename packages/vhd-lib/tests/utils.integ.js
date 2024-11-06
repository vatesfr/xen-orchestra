'use strict'

const { beforeEach, afterEach, test } = require('node:test')
const { strict: assert } = require('assert')

const fs = require('fs-extra')
const tmp = require('tmp')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { pFromCallback } = require('promise-toolbox')
const { rimraf } = require('rimraf')

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
  await assert.rejects(async () => await checkFile(vhdFileName))
})
