'use strict'

const { beforeEach, afterEach, describe, it } = require('node:test')
const { strict: assert } = require('assert')

const { rimraf } = require('rimraf')
const tmp = require('tmp')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { Disposable, pFromCallback } = require('promise-toolbox')

const { isVhdAlias, resolveVhdAlias } = require('./aliases')
const { ALIAS_MAX_PATH_LENGTH } = require('./_constants')

let tempDir

describe('isVhdAlias()', async () => {
  beforeEach(async () => {
    tempDir = await pFromCallback(cb => tmp.dir(cb))
  })

  afterEach(async () => {
    await rimraf(tempDir)
  })

  it('recognizes only *.alias.vhd files', () => {
    assert.equal(isVhdAlias('filename.alias.vhd'), true)
    assert.equal(isVhdAlias('alias.vhd'), false)
    assert.equal(isVhdAlias('filename.vhd'), false)
    assert.equal(isVhdAlias('filename.alias.vhd.other'), false)
  })
})

describe('resolveVhdAlias()', async () => {
  beforeEach(async () => {
    tempDir = await pFromCallback(cb => tmp.dir(cb))
  })

  afterEach(async () => {
    await rimraf(tempDir)
  })

  it('returns the path in argument for a non alias file ', async () => {
    assert.equal(await resolveVhdAlias(null, 'filename.vhd'), 'filename.vhd')
  })
  it('gets the path of the target file for an alias', async () => {
    await Disposable.use(async function* () {
      // same directory
      const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
      const alias = `alias.alias.vhd`
      await handler.writeFile(alias, 'target.vhd')
      assert.equal(await resolveVhdAlias(handler, alias), `target.vhd`)

      // different directory
      await handler.mkdir(`sub`)
      await handler.writeFile(alias, 'sub/target.vhd', { flags: 'w' })
      assert.equal(await resolveVhdAlias(handler, alias), `sub/target.vhd`)
    })
  })

  it('throws an error an alias to an alias', async () => {
    await Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
      const alias = `alias.alias.vhd`
      const target = `target.alias.vhd`
      await handler.writeFile(alias, target)
      await assert.rejects(async () => await resolveVhdAlias(handler, alias), Error)
    })
  })

  it('throws an error on a file too big ', async () => {
    await Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
      await handler.writeFile('toobig.alias.vhd', Buffer.alloc(ALIAS_MAX_PATH_LENGTH + 1, 0))
      await assert.rejects(async () => await resolveVhdAlias(handler, 'toobig.alias.vhd'), Error)
    })
  })
})
