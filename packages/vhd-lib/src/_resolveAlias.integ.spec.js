/* eslint-env jest */

import rimraf from 'rimraf'
import tmp from 'tmp'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { Disposable, pFromCallback } from 'promise-toolbox'

import { isVhdAlias, resolveAlias } from './_resolveAlias'

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
    const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
    await handler.mkdir(`alias`)
    const aliasPath = 'alias/alias.alias.vhd'
    const testOneCombination = async ({ targetPath, targetContent }) => {
      await handler.writeFile(aliasPath, targetPath, { flags: 'w' })
      const resolved = await resolveAlias(handler, aliasPath)
      expect(resolved).toEqual(targetContent)
      await handler.unlink(aliasPath)
    }
    // the alias contain the relative path to the file. The resolved values is the full path from the root of the remote
    const combinations = [
      { targetPath: `../targets.vhd`, targetContent: `targets.vhd` },
      { targetPath: `targets.vhd`, targetContent: `alias/targets.vhd` },
      { targetPath: `sub/targets.vhd`, targetContent: `alias/sub/targets.vhd` },
      { targetPath: `../sibling/targets.vhd`, targetContent: `sibling/targets.vhd` },
    ]

    for (const { targetPath, targetContent } of combinations) {
      await testOneCombination({ targetPath, targetContent })
    }
  })
})

test('resolve throws an error an alias to an alias', async () => {
  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: `file://${tempDir}` })
    const alias = 'alias.alias.vhd'
    const target = 'target.alias.vhd'
    await handler.writeFile(alias, target)
    expect(async () => await resolveAlias(handler, alias)).rejects.toThrow(Error)
  })
})
