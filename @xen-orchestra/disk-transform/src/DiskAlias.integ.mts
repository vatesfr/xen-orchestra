import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rimraf } from 'rimraf'
import { getSyncedHandler } from '@xen-orchestra/fs'
import type { FileAccessor } from './FileAccessor.mjs'
import {
  AliasChainError,
  AliasIsDirectoryError,
  AliasMissingError,
  AliasTooLongError,
  ALIAS_MAX_PATH_LENGTH,
  DiskAlias,
} from './DiskAlias.mjs'

let tempDir: string
let dispose: () => Promise<void>
let handler: FileAccessor

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'disk-alias-'))
  const synced = await getSyncedHandler({ url: `file://${tempDir}` })
  handler = synced.value as unknown as FileAccessor
  dispose = synced.dispose
})

afterEach(async () => {
  await dispose()
  await rimraf(tempDir)
})

test('DiskAlias resolve()', async t => {
  await t.test('gets the path of the target file for an alias, same directory', async () => {
    const vhdAlias = new DiskAlias('vhd')
    const alias = 'alias.alias.vhd'
    await handler.writeFile(alias, 'target.vhd')
    assert.equal(await vhdAlias.resolve(handler, alias), 'target.vhd')
  })

  await t.test('gets the path of the target file for an alias, different directory', async () => {
    const vhdAlias = new DiskAlias('vhd')
    const alias = 'alias.alias.vhd'
    await handler.mktree('sub')
    await handler.writeFile(alias, 'sub/target.vhd', { flags: 'w' })
    assert.equal(await vhdAlias.resolve(handler, alias), 'sub/target.vhd')
  })

  await t.test('throws AliasChainError on an alias to an alias', async () => {
    const vhdAlias = new DiskAlias('vhd')
    const alias = 'alias.alias.vhd'
    const target = 'target.alias.vhd'
    await handler.writeFile(alias, target)
    await assert.rejects(async () => await vhdAlias.resolve(handler, alias), AliasChainError)
  })

  await t.test('throws AliasTooLongError on a file too big', async () => {
    const vhdAlias = new DiskAlias('vhd')
    await handler.writeFile('toobig.alias.vhd', '0'.repeat(ALIAS_MAX_PATH_LENGTH + 1))
    await assert.rejects(async () => await vhdAlias.resolve(handler, 'toobig.alias.vhd'), AliasTooLongError)
  })

  await t.test('throws AliasMissingError when the alias file does not exist', async () => {
    const vhdAlias = new DiskAlias('vhd')
    await assert.rejects(async () => await vhdAlias.resolve(handler, 'missing.alias.vhd'), AliasMissingError)
  })

  await t.test('throws AliasIsDirectoryError when the alias path is a directory', async () => {
    const vhdAlias = new DiskAlias('vhd')
    await handler.mktree('broken.alias.vhd')
    await assert.rejects(async () => await vhdAlias.resolve(handler, 'broken.alias.vhd'), AliasIsDirectoryError)
  })
})

test('DiskAlias create()', async t => {
  await t.test('writes the relative path from the alias to the target', async () => {
    const vhdAlias = new DiskAlias('vhd')
    await handler.mktree('data')
    await vhdAlias.create(handler, 'disk.alias.vhd', 'data/disk.vhd')
    assert.equal((await handler.readFile('disk.alias.vhd')).toString(), 'data/disk.vhd')
  })

  await t.test('rejects chaining alias to alias', async () => {
    const vhdAlias = new DiskAlias('vhd')
    await assert.rejects(
      async () => await vhdAlias.create(handler, 'disk.alias.vhd', 'other.alias.vhd'),
      AliasChainError
    )
  })
})

test('DiskAlias unlink()', async t => {
  await t.test('removes the alias file and its target', async () => {
    const vhdAlias = new DiskAlias('vhd')
    await handler.writeFile('data.vhd', 'content')
    await vhdAlias.create(handler, 'disk.alias.vhd', 'data.vhd')
    await vhdAlias.unlink(handler, 'disk.alias.vhd')
    await assert.rejects(async () => await handler.getSize('disk.alias.vhd'))
    await assert.rejects(async () => await handler.getSize('data.vhd'))
  })

  await t.test('removes a broken alias that is actually a directory', async () => {
    const vhdAlias = new DiskAlias('vhd')
    await handler.mktree('broken.alias.vhd')
    await vhdAlias.unlink(handler, 'broken.alias.vhd')
    await assert.rejects(async () => await handler.getSize('broken.alias.vhd'))
  })
})
