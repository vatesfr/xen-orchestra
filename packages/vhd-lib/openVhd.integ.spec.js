'use strict'

/* eslint-env jest */

const rimraf = require('rimraf')
const tmp = require('tmp')
const fs = require('node:fs/promises')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { Disposable, pFromCallback } = require('promise-toolbox')

const { openVhd } = require('./index')
const { createRandomFile, convertFromRawToVhd, createRandomVhdDirectory } = require('./tests/utils')

const { VhdAbstract } = require('./Vhd/VhdAbstract')

let tempDir

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await rimraf(tempDir)
})

test('It opens a vhd file ( alias or not)', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSize)
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
    const vhd = yield openVhd(handler, 'randomfile.vhd')
    expect(vhd.header.cookie).toEqual('cxsparse')
    expect(vhd.footer.cookie).toEqual('conectix')

    const aliasFileName = `out.alias.vhd`
    await VhdAbstract.createAlias(handler, aliasFileName, 'randomfile.vhd')
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
    const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
    const vhd = yield openVhd(handler, 'randomfile.dir')
    expect(vhd.header.cookie).toEqual('cxsparse')
    expect(vhd.footer.cookie).toEqual('conectix')

    const aliasFileName = `out.alias.vhd`
    await VhdAbstract.createAlias(handler, aliasFileName, 'randomfile.dir')
    const alias = yield openVhd(handler, aliasFileName)
    expect(alias.header.cookie).toEqual('cxsparse')
    expect(alias.footer.cookie).toEqual('conectix')
  })
})

test('It fails correctly when opening a broken vhd', async () => {
  const initalSize = 4

  // emtpy file
  await expect(
    Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
      yield openVhd(handler, 'randomfile.vhd')
    })
  ).rejects.toThrow()

  const rawFileName = `${tempDir}/randomfile.vhd`
  await createRandomFile(rawFileName, initalSize)
  // broken file
  await expect(
    Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
      yield openVhd(handler, 'randomfile.vhd')
    })
  ).rejects.toThrow()

  // empty dir
  await fs.mkdir(`${tempDir}/dir.vhd`)
  await expect(
    Disposable.use(async function* () {
      const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
      const vhd = yield openVhd(handler, 'dir.vhd')
      await vhd.readBlockAllocationTable()
    })
  ).rejects.toThrow()
  // dir with missing parts
  await createRandomVhdDirectory(`${tempDir}/dir.vhd`, initalSize)

  const targets = ['header', 'footer', 'bat']
  for (const target of targets) {
    await fs.rename(`${tempDir}/dir.vhd/${target}`, `${tempDir}/dir.vhd/moved`)
    await expect(
      Disposable.use(async function* () {
        const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
        const vhd = yield openVhd(handler, 'dir.vhd')
        await vhd.readBlockAllocationTable()
      })
    ).rejects.toThrow()
    await fs.rename(`${tempDir}/dir.vhd/moved`, `${tempDir}/dir.vhd/${target}`)
  }
})

test('It fails correctly when opening a vhdfile on an encrypted remote', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile.vhd`
  await expect(
    Disposable.use(async function* () {
      const handler = yield getSyncedHandler({
        url: `file://${tempDir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd00"`,
      })

      await createRandomFile(rawFileName, initalSize)
      yield openVhd(handler, 'randomfile.vhd')
    })
  ).rejects.toThrow()
})
