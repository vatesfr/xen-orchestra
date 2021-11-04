/* eslint-env jest */

import rimraf from 'rimraf'
import tmp from 'tmp'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { Disposable, pFromCallback } from 'promise-toolbox'

import { openVhd } from './index'
import { createRandomFile, convertFromRawToVhd, createRandomVhdDirectory } from './tests/utils'

import { VhdAbstract } from './Vhd/VhdAbstract'

let tempDir

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

test('It opens a vhd file ( alias or not)', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSize)
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file://' })
    const vhd = yield openVhd(handler, vhdFileName)
    expect(vhd.header.cookie).toEqual('cxsparse')
    expect(vhd.footer.cookie).toEqual('conectix')

    const aliasFileName = `${tempDir}/out.alias.vhd`
    await VhdAbstract.createAlias(handler, aliasFileName, vhdFileName)
    const alias = yield openVhd(handler, aliasFileName)
    expect(alias.header.cookie).toEqual('cxsparse')
    expect(alias.footer.cookie).toEqual('conectix')
  })
})

test('It opens a vhd directory', async () => {
  const initalSize = 4
  const vhdDirectory = `${tempDir}/randomfile.dir`
  await createRandomVhdDirectory(vhdDirectory, initalSize)

  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file://' })
    const vhd = yield openVhd(handler, vhdDirectory)
    expect(vhd.header.cookie).toEqual('cxsparse')
    expect(vhd.footer.cookie).toEqual('conectix')

    const aliasFileName = `${tempDir}/out.alias.vhd`
    await VhdAbstract.createAlias(handler, aliasFileName, vhdDirectory)
    const alias = yield openVhd(handler, aliasFileName)
    expect(alias.header.cookie).toEqual('cxsparse')
    expect(alias.footer.cookie).toEqual('conectix')
  })
})
