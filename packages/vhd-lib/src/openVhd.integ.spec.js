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
    const handler = yield getSyncedHandler({ url: `file://${tempDir}/` })
    const vhd = yield openVhd(handler, 'randomfile.vhd')
    expect(vhd.header.cookie).toEqual('cxsparse')
    expect(vhd.footer.cookie).toEqual('conectix')

    await VhdAbstract.createAlias(handler, 'out.alias.vhd', 'randomfile.vhd')
    const alias = yield openVhd(handler, 'out.alias.vhd')
    expect(alias.header.cookie).toEqual('cxsparse')
    expect(alias.footer.cookie).toEqual('conectix')
    expect(alias._path?.path).toEqual('/randomfile.vhd')
  })
})

test('It opens a vhd directory', async () => {
  const initalSize = 4
  const vhdDirectory = `${tempDir}/randomfile.dir`
  await createRandomVhdDirectory(vhdDirectory, initalSize)

  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: `file://${tempDir}/` })
    const vhd = yield openVhd(handler, 'randomfile.dir')
    expect(vhd.header.cookie).toEqual('cxsparse')
    expect(vhd.footer.cookie).toEqual('conectix')

    await VhdAbstract.createAlias(handler, 'out.alias.vhd', 'randomfile.dir')
    const alias = yield openVhd(handler, 'out.alias.vhd')
    expect(alias.header.cookie).toEqual('cxsparse')
    expect(alias.footer.cookie).toEqual('conectix')
    expect(alias._path).toEqual('randomfile.dir')
  })
})
