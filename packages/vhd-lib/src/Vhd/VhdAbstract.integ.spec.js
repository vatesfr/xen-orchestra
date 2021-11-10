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
    const handler = yield getSyncedHandler({ url: 'file://' + tempDir })
    const aliasPath = `alias/alias.alias.vhd`
    const aliasFsPath = `${tempDir}/${aliasPath}`
    await fs.mkdirp(`${tempDir}/alias`)

    const testOneCombination = async ({ targetPath, targetContent }) => {
      await VhdAbstract.createAlias(handler, aliasPath, targetPath)
      // alias file is created
      expect(await fs.exists(aliasFsPath)).toEqual(true)
      // content is the target path relative to the alias location
      const content = await fs.readFile(aliasFsPath, 'utf-8')
      expect(content).toEqual(targetContent)
      // create alias fails if alias already exists, remove it before next loop step
      await fs.unlink(aliasFsPath)
    }

    const combinations = [
      { targetPath: `targets.vhd`, targetContent: `../targets.vhd` },
      { targetPath: `alias/targets.vhd`, targetContent: `targets.vhd` },
      { targetPath: `alias/sub/targets.vhd`, targetContent: `sub/targets.vhd` },
      { targetPath: `sibling/targets.vhd`, targetContent: `../sibling/targets.vhd` },
    ]

    for (const { targetPath, targetContent } of combinations) {
      await testOneCombination({ targetPath, targetContent })
    }
  })
})

test('alias must have *.alias.vhd extension', async () => {
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
    const aliasPath = 'invalidalias.vhd'
    const targetPath = 'targets.vhd'
    expect(async () => await VhdAbstract.createAlias(handler, aliasPath, targetPath)).rejects.toThrow()

    expect(await fs.exists(aliasPath)).toEqual(false)
  })
})

test('alias must not be chained', async () => {
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
    const aliasPath = 'valid.alias.vhd'
    const targetPath = 'an.other.valid.alias.vhd'
    expect(async () => await VhdAbstract.createAlias(handler, aliasPath, targetPath)).rejects.toThrow()
    expect(await fs.exists(aliasPath)).toEqual(false)
  })
})

test('It rename and unlink a VHDFile', async () => {
  const initalSize = 4
  const rawFileName = `${tempDir}/randomfile`
  await createRandomFile(rawFileName, initalSize)
  await convertFromRawToVhd(rawFileName, `${tempDir}/randomfile.vhd`)
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
    const { size } = await fs.stat(`${tempDir}/randomfile.vhd`)

    await VhdAbstract.rename(handler, 'randomfile.vhd', 'renamed.vhd')
    expect(await fs.exists(`${tempDir}/randomfile.vhd`)).toEqual(false)
    const { size: renamedSize } = await fs.stat(`${tempDir}/renamed.vhd`)
    expect(size).toEqual(renamedSize)
    await VhdAbstract.unlink(handler, 'renamed.vhd')
    expect(await fs.exists(`${tempDir}/renamed.vhd`)).toEqual(false)
  })
})

test('It rename and unlink a VhdDirectory', async () => {
  const initalSize = 4
  const vhdDirectory = `${tempDir}/randomfile.dir`
  await createRandomVhdDirectory(vhdDirectory, initalSize)

  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
    const vhd = yield openVhd(handler, 'randomfile.dir')
    expect(vhd.header.cookie).toEqual('cxsparse')
    expect(vhd.footer.cookie).toEqual('conectix')

    await VhdAbstract.rename(handler, 'randomfile.dir', 'renamed.vhd')
    expect(await fs.exists(`${tempDir}/randomfile.dir`)).toEqual(false)
    await VhdAbstract.unlink(handler, `renamed.vhd`)
    expect(await fs.exists(`${tempDir}/renamed.vhd`)).toEqual(false)
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
    const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
    await VhdAbstract.createAlias(handler, 'aliasFileName.alias.vhd', 'randomfile.vhd')
    expect(await fs.exists(aliasFileName)).toEqual(true)
    expect(await fs.exists(vhdFileName)).toEqual(true)

    await VhdAbstract.rename(handler, 'aliasFileName.alias.vhd', 'aliasFileNameRenamed.alias.vhd')
    expect(await fs.exists(aliasFileName)).toEqual(false)
    expect(await fs.exists(vhdFileName)).toEqual(true)
    expect(await fs.exists(aliasFileNameRenamed)).toEqual(true)

    await VhdAbstract.unlink(handler, 'aliasFileNameRenamed.alias.vhd')
    expect(await fs.exists(aliasFileName)).toEqual(false)
    expect(await fs.exists(vhdFileName)).toEqual(false)
    expect(await fs.exists(aliasFileNameRenamed)).toEqual(false)
  })
})
