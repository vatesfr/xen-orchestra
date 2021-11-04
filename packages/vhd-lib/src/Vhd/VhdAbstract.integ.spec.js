/* eslint-env jest */

import rimraf from 'rimraf'
import tmp from 'tmp'
import fs from 'fs-extra'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { Disposable, pFromCallback } from 'promise-toolbox'

import { openVhd } from '../index'
import { createRandomFile, convertFromRawToVhd, createRandomVhdDirectory } from '../tests/utils'
import { VhdAbstract } from './VhdAbstract'

let tempDir

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
})

test('It creates an alias', async () => {
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file:///' })
    const aliasPath = `${tempDir}/alias.alias.vhd`

    const testOneCombination = async ({ targetPath, targetContent }) => {
      await VhdAbstract.createAlias(handler, aliasPath, targetPath)
      // alias file is created
      expect(await fs.exists(aliasPath)).toEqual(true)
      // content is the target path relative to the alias location
      const content = await fs.readFile(aliasPath, 'utf-8')
      expect(content).toEqual(targetContent)
      await fs.unlink(aliasPath)
    }
    const combinations = [
      { targetPath: `${tempDir}/targets.vhd`, targetContent: `targets.vhd` },
      { targetPath: `${tempDir}/sub/targets.vhd`, targetContent: `sub/targets.vhd` },
    ]

    for (const { targetPath, targetContent } of combinations) {
      await testOneCombination({ targetPath, targetContent })
    }
  })
})

test('alias must have *.alias.vhd extension', async () => {
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file:///' })
    const aliasPath = `${tempDir}/invalidalias.vhd`
    const targetPath = `${tempDir}/targets.vhd`
    expect(async () => await VhdAbstract.createAlias(handler, aliasPath, targetPath)).rejects.toThrow()

    expect(await fs.exists(aliasPath)).toEqual(false)
  })
})

test('alias must not be chained', async () => {
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file:///' })
    const aliasPath = `${tempDir}/valid.alias.vhd`
    const targetPath = `${tempDir}/an.other.valid.alias.vhd`
    expect(async () => await VhdAbstract.createAlias(handler, aliasPath, targetPath)).rejects.toThrow()
    expect(await fs.exists(aliasPath)).toEqual(false)
  })
})

test('It rename and unlink a VHDFile', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSize)
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file:///' })
    const { size } = await fs.stat(vhdFileName)
    const targetFileName = `${tempDir}/renamed.vhd`

    await VhdAbstract.rename(handler, vhdFileName, targetFileName)
    expect(await fs.exists(vhdFileName)).toEqual(false)
    const { size: renamedSize } = await fs.stat(targetFileName)
    expect(size).toEqual(renamedSize)
    await VhdAbstract.unlink(handler, targetFileName)
    expect(await fs.exists(targetFileName)).toEqual(false)
  })
})

test('It rename and unlink a VhdDirectory', async () => {
  const initalSize = 4
  const vhdDirectory = `${tempDir}/randomfile.dir`
  await createRandomVhdDirectory(vhdDirectory, initalSize)

  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file:///' })
    const vhd = yield openVhd(handler, vhdDirectory)
    expect(vhd.header.cookie).toEqual('cxsparse')
    expect(vhd.footer.cookie).toEqual('conectix')

    const targetFileName = `${tempDir}/renamed.vhd`
    await VhdAbstract.rename(handler, vhdDirectory, targetFileName)
    expect(await fs.exists(vhdDirectory)).toEqual(false)
    await VhdAbstract.unlink(handler, targetFileName)
    expect(await fs.exists(targetFileName)).toEqual(false)
  })
})

test('It create , rename and unlink alias', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSize)
  const vhdFileName = `${tempDir}/randomfile.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  const aliasFileName = `${tempDir}/aliasFileName.alias.vhd`
  const aliasFileNameRenamed = `${tempDir}/aliasFileNameRenamed.alias.vhd`

  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: 'file:///' })
    await VhdAbstract.createAlias(handler, aliasFileName, vhdFileName)
    expect(await fs.exists(aliasFileName)).toEqual(true)
    expect(await fs.exists(vhdFileName)).toEqual(true)

    await VhdAbstract.rename(handler, aliasFileName, aliasFileNameRenamed)
    expect(await fs.exists(aliasFileName)).toEqual(false)
    expect(await fs.exists(vhdFileName)).toEqual(true)
    expect(await fs.exists(aliasFileNameRenamed)).toEqual(true)

    await VhdAbstract.unlink(handler, aliasFileNameRenamed)
    expect(await fs.exists(aliasFileName)).toEqual(false)
    expect(await fs.exists(vhdFileName)).toEqual(false)
    expect(await fs.exists(aliasFileNameRenamed)).toEqual(false)
  })
})
