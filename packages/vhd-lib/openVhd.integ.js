'use strict'

const { beforeEach, afterEach, describe, it } = require('node:test')
const { strict: assert } = require('assert')

const { rimraf } = require('rimraf')
const tmp = require('tmp')
const fs = require('node:fs/promises')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { Disposable, pFromCallback } = require('promise-toolbox')

const { openVhd } = require('./index')
const { createRandomFile, convertFromRawToVhd, createRandomVhdDirectory } = require('./tests/utils')

const { VhdAbstract } = require('./Vhd/VhdAbstract')

let tempDir

describe('OpenVhd', { concurrency: 1 }, async () => {
  beforeEach(async () => {
    tempDir = await pFromCallback(cb => tmp.dir(cb))
  })

  afterEach(async () => {
    await rimraf(tempDir)
  })

  it('opens a vhd file ( alias or not)', async () => {
    const initalSize = 4
    const rawFileName = `${tempDir}/randomfile`
    await createRandomFile(rawFileName, initalSize)
    const vhdFileName = `${tempDir}/randomfile.vhd`
    await convertFromRawToVhd(rawFileName, vhdFileName)
    await Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
      const vhd = yield openVhd(handler, 'randomfile.vhd')
      assert.equal(vhd.header.cookie, 'cxsparse')
      assert.equal(vhd.footer.cookie, 'conectix')

      const aliasFileName = `out.alias.vhd`
      await VhdAbstract.createAlias(handler, aliasFileName, 'randomfile.vhd')
      const alias = yield openVhd(handler, aliasFileName)
      assert.equal(alias.header.cookie, 'cxsparse')
      assert.equal(alias.footer.cookie, 'conectix')
    })
  })

  it('opens a vhd directory', async () => {
    const initalSize = 4
    const vhdDirectory = `${tempDir}/randomfile.dir`
    await createRandomVhdDirectory(vhdDirectory, initalSize)

    await Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
      const vhd = yield openVhd(handler, 'randomfile.dir')
      assert.equal(vhd.header.cookie, 'cxsparse')
      assert.equal(vhd.footer.cookie, 'conectix')

      const aliasFileName = `out.alias.vhd`
      await VhdAbstract.createAlias(handler, aliasFileName, 'randomfile.dir')
      const alias = yield openVhd(handler, aliasFileName)
      assert.equal(alias.header.cookie, 'cxsparse')
      assert.equal(alias.footer.cookie, 'conectix')
    })
  })

  it('fails correctly when opening a broken vhd', async () => {
    const initalSize = 4

    // empty file
    await assert.rejects(
      Disposable.use(async function* () {
        const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
        yield openVhd(handler, 'randomfile.vhd')
      })
    )

    const rawFileName = `${tempDir}/randomfile.vhd`
    await createRandomFile(rawFileName, initalSize)
    // broken file
    await assert.rejects(
      Disposable.use(async function* () {
        const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
        yield openVhd(handler, 'randomfile.vhd')
      })
    )

    // empty dir
    await fs.mkdir(`${tempDir}/dir.vhd`)
    await assert.rejects(
      Disposable.use(async function* () {
        const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
        const vhd = yield openVhd(handler, 'dir.vhd')
        await vhd.readBlockAllocationTable()
      })
    )
    // dir with missing parts
    await createRandomVhdDirectory(`${tempDir}/dir.vhd`, initalSize)

    const targets = ['header', 'footer', 'bat']
    for (const target of targets) {
      await fs.rename(`${tempDir}/dir.vhd/${target}`, `${tempDir}/dir.vhd/moved`)
      await assert.rejects(
        Disposable.use(async function* () {
          const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
          const vhd = yield openVhd(handler, 'dir.vhd')
          await vhd.readBlockAllocationTable()
        })
      )
      await fs.rename(`${tempDir}/dir.vhd/moved`, `${tempDir}/dir.vhd/${target}`)
    }
  })

  it('fails correctly when opening a vhdfile on an encrypted remote', async () => {
    const initalSize = 4
    const rawFileName = `${tempDir}/randomfile.vhd`
    await assert.rejects(
      Disposable.use(async function* () {
        const handler = yield getSyncedHandler({
          url: `file://${tempDir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd00"`,
        })

        await createRandomFile(rawFileName, initalSize)
        yield openVhd(handler, 'randomfile.vhd')
      })
    )
  })
})
