/* eslint-env jest */

import rimraf from 'rimraf'
import tmp from 'tmp'
import fs from 'fs-extra'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { Disposable, pFromCallback } from 'promise-toolbox'

import { openVhd } from '../index'
import { createRandomFile, convertFromRawToVhd, createRandomVhdDirectory } from '../_testUtils'
import { VhdAbstract } from './VhdAbstract'

let tempDir = null

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

test('It rename and unlink a VHDFile', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSize)
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file://' })
    const { size } = await fs.stat(vhdFileName)
    const targetFileName = `${tempDir}/renamed.vhd`

    await VhdAbstract.rename(handler, vhdFileName, targetFileName)
    expect(await fs.exists(vhdFileName)).toEqual(false)
    const { size: renamedSize } = await fs.stat(targetFileName)
    expect(size).toEqual(renamedSize)
    VhdAbstract.unlink(handler, targetFileName)
    expect(await fs.exists(targetFileName)).toEqual(false)
  })
})

test('It rename and unlink a VhdDirectory', async () => {
  const initalSize = 4
  const vhdDirectory = `${tempDir}/randomfile.dir`
  await createRandomVhdDirectory(vhdDirectory, initalSize)

  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file://' })
    const vhd = yield openVhd(handler, vhdDirectory)
    expect(vhd.header.cookie).toEqual('cxsparse')
    expect(vhd.footer.cookie).toEqual('conectix')

    const targetFileName = `${tempDir}/renamed.vhd`
    await VhdAbstract.rename(handler, vhdDirectory, targetFileName)
    expect(await fs.exists(vhdDirectory)).toEqual(false)

    const alias = yield openVhd(handler, targetFileName)
    expect(alias.header.cookie).toEqual('cxsparse')
    expect(alias.footer.cookie).toEqual('conectix')
  })
})
