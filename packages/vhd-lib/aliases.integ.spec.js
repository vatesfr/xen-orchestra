'use strict'

/* eslint-env jest */

const rimraf = require('rimraf')
const tmp = require('tmp')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { Disposable, pFromCallback } = require('promise-toolbox')

const { isVhdAlias, resolveVhdAlias } = require('./aliases')
const { ALIAS_MAX_PATH_LENGTH } = require('./_constants')

let tempDir

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await rimraf(tempDir)
})

test('is vhd alias recognize only *.alias.vhd files', () => {
  expect(isVhdAlias('filename.alias.vhd')).toEqual(true)
  expect(isVhdAlias('alias.vhd')).toEqual(false)
  expect(isVhdAlias('filename.vhd')).toEqual(false)
  expect(isVhdAlias('filename.alias.vhd.other')).toEqual(false)
})

test('resolve return the path in argument for a non alias file ', async () => {
  expect(await resolveVhdAlias(null, 'filename.vhd')).toEqual('filename.vhd')
})
test('resolve get the path of the target file for an alias', async () => {
  await Disposable.use(async function* () {
    // same directory
    const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
    const alias = `alias.alias.vhd`
    await handler.writeFile(alias, 'target.vhd')
    await expect(await resolveVhdAlias(handler, alias)).toEqual(`target.vhd`)

    // different directory
    await handler.mkdir(`sub`)
    await handler.writeFile(alias, 'sub/target.vhd', { flags: 'w' })
    await expect(await resolveVhdAlias(handler, alias)).toEqual(`sub/target.vhd`)
  })
})

test('resolve throws an error an alias to an alias', async () => {
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
    const alias = `alias.alias.vhd`
    const target = `target.alias.vhd`
    await handler.writeFile(alias, target)
    await expect(async () => await resolveVhdAlias(handler, alias)).rejects.toThrow(Error)
  })
})

test('resolve throws an error on a file too big ', async () => {
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
    await handler.writeFile('toobig.alias.vhd', Buffer.alloc(ALIAS_MAX_PATH_LENGTH + 1, 0))
    await expect(async () => await resolveVhdAlias(handler, 'toobig.alias.vhd')).rejects.toThrow(Error)
  })
})
