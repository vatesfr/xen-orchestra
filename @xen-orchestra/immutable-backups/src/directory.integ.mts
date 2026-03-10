import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import * as Directory from './directory.mjs'
import { tmpdir } from 'node:os'
import { rimraf } from 'rimraf'

describe('immutable-backups/file', async () => {
  it('really lock a directory', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'immutable-backups-tests'))
    try {
      const dataDir = path.join(dir, 'data')
      await fs.mkdir(dataDir)
      const filePath = path.join(dataDir, 'test')
      await fs.writeFile(filePath, 'data')
      await Directory.makeImmutable(dataDir)
      assert.strictEqual(await Directory.isImmutable(dataDir), true)
      await assert.rejects(() => fs.writeFile(filePath, 'data'))
      await assert.rejects(() => fs.appendFile(filePath, 'data'))
      await assert.rejects(() => fs.unlink(filePath))
      await assert.rejects(() => fs.rename(filePath, filePath + 'copy'))
      await assert.rejects(() => fs.writeFile(path.join(dataDir, 'test2'), 'data'))
      await assert.rejects(() => fs.rename(dataDir, dataDir + 'copy'))
      await Directory.liftImmutability(dataDir)
      assert.strictEqual(await Directory.isImmutable(dataDir), false)
      await fs.writeFile(filePath, 'data')
      await fs.appendFile(filePath, 'data')
      await fs.unlink(filePath)
      await fs.rename(dataDir, dataDir + 'copy')
    } finally {
      await Directory.liftImmutabilityBatch([dir]).catch(() => {})
      await rimraf(dir)
    }
  })

  it('makeImmutableBatch locks existing files and directories, ignores missing paths', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'immutable-backups-tests'))
    try {
      const fileA = path.join(dir, 'a.txt')
      const fileB = path.join(dir, 'b.txt')
      const subDir = path.join(dir, 'sub')
      const subFile = path.join(subDir, 'c.txt')
      const missing = path.join(dir, 'does-not-exist')

      await fs.writeFile(fileA, 'aaa')
      await fs.writeFile(fileB, 'bbb')
      await fs.mkdir(subDir)
      await fs.writeFile(subFile, 'ccc')

      // missing path must not throw
      await assert.doesNotReject(() => Directory.makeImmutableBatch([fileA, fileB, subDir, missing]))

      assert.strictEqual(await Directory.isImmutable(fileA), true, 'fileA should be immutable')
      assert.strictEqual(await Directory.isImmutable(fileB), true, 'fileB should be immutable')
      assert.strictEqual(await Directory.isImmutable(subDir), true, 'subDir should be immutable')
      assert.strictEqual(await Directory.isImmutable(subFile), true, 'subFile should be immutable (recursive)')

      await assert.rejects(() => fs.writeFile(fileA, 'tampered'), { code: 'EPERM' })
      await assert.rejects(() => fs.writeFile(subFile, 'tampered'), { code: 'EPERM' })
    } finally {
      // lift before rimraf — rimraf cannot delete immutable files
      await Directory.liftImmutabilityBatch([dir]).catch(() => {})
      await rimraf(dir)
    }
  })

  it('liftImmutabilityBatch unlocks existing files and directories, ignores missing paths', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'immutable-backups-tests'))
    try {
      const fileA = path.join(dir, 'a.txt')
      const subDir = path.join(dir, 'sub')
      const subFile = path.join(subDir, 'c.txt')
      const missing = path.join(dir, 'does-not-exist')

      await fs.writeFile(fileA, 'aaa')
      await fs.mkdir(subDir)
      await fs.writeFile(subFile, 'ccc')
      await Directory.makeImmutableBatch([fileA, subDir])

      // missing path must not throw
      await assert.doesNotReject(() => Directory.liftImmutabilityBatch([fileA, subDir, missing]))

      assert.strictEqual(await Directory.isImmutable(fileA), false, 'fileA should be mutable again')
      assert.strictEqual(await Directory.isImmutable(subDir), false, 'subDir should be mutable again')
      assert.strictEqual(await Directory.isImmutable(subFile), false, 'subFile should be mutable again')

      await fs.writeFile(fileA, 'updated')
      await fs.writeFile(subFile, 'updated')
    } finally {
      await Directory.liftImmutabilityBatch([dir]).catch(() => {})
      await rimraf(dir)
    }
  })
})
