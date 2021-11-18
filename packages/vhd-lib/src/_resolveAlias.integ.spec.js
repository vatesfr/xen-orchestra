/* eslint-env jest */

import rimraf from 'rimraf'
import tmp from 'tmp'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { Disposable, pFromCallback } from 'promise-toolbox'

import { isVhdAlias, resolveAlias } from './_resolveAlias'
import { ALIAS_MAX_PATH_LENGTH } from './_constants'

let tempDir

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

test('is vhd alias recognize only *.alias.vhd files', () => {
  expect(isVhdAlias('filename.alias.vhd')).toEqual(true)
  expect(isVhdAlias('alias.vhd')).toEqual(false)
  expect(isVhdAlias('filename.vhd')).toEqual(false)
  expect(isVhdAlias('filename.alias.vhd.other')).toEqual(false)
})

test('resolve return the path in argument for a non alias file ', async () => {
  expect(await resolveAlias(null, 'filename.vhd')).toEqual('filename.vhd')
})
test('resolve get the path of the target file for an alias', async () => {
  await Disposable.use(async function* () {
    // same directory
    const handler = yield getSyncedHandler({ url: 'file:///' })
    const tempDirFomRemoteUrl = tempDir.slice(1) // remove the / which is included in the remote url
    const alias = `${tempDirFomRemoteUrl}/alias.alias.vhd`
    await handler.writeFile(alias, 'target.vhd')
    await expect(await resolveAlias(handler, alias)).toEqual(`${tempDirFomRemoteUrl}/target.vhd`)

    // different directory
    await handler.mkdir(`${tempDirFomRemoteUrl}/sub/`)
    await handler.writeFile(alias, 'sub/target.vhd', { flags: 'w' })
    await expect(await resolveAlias(handler, alias)).toEqual(`${tempDirFomRemoteUrl}/sub/target.vhd`)
  })
})

test('resolve throws an error an alias to an alias', async () => {
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file:///' })
    const alias = `${tempDir}/alias.alias.vhd`
    const target = `${tempDir}/target.alias.vhd`
    await handler.writeFile(alias, target)
    await expect(async () => await resolveAlias(handler, alias)).rejects.toThrow(Error)
  })
})

test('resolve throws an error on a file too big ', async () => {
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
    await handler.writeFile('toobig.alias.vhd', Buffer.alloc(ALIAS_MAX_PATH_LENGTH + 1, 0))
    await expect(async () => await resolveAlias(handler, 'toobig.alias.vhd')).rejects.toThrow(Error)
  })
})
