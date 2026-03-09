import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import * as File from './file.mjs'
import { tmpdir } from 'node:os'
import { rimraf } from 'rimraf'

describe('immutable-backups/file', async () => {
  it('really lock a file', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'immutable-backups-tests'))
    const immutDir = path.join(dir, '.immutable')
    const filePath = path.join(dir, 'test.ext')
    await fs.writeFile(filePath, 'data')
    assert.strictEqual(await File.isImmutable(filePath), false)
    await File.makeImmutable(filePath, immutDir)
    assert.strictEqual(await File.isImmutable(filePath), true)
    await assert.rejects(() => fs.writeFile(filePath, 'data'))
    await assert.rejects(() => fs.appendFile(filePath, 'data'))
    await assert.rejects(() => fs.unlink(filePath))
    await assert.rejects(() => fs.rename(filePath, filePath + 'copy'))
    await File.liftImmutability(filePath, immutDir)
    assert.strictEqual(await File.isImmutable(filePath), false)
    await fs.writeFile(filePath, 'data')
    await fs.appendFile(filePath, 'data')
    await fs.unlink(filePath)
    await rimraf(dir)
  })

  describe('makeImmutableBatch', async () => {
    it('locks all files in the batch', async () => {
      const dir = await fs.mkdtemp(path.join(tmpdir(), 'immutable-backups-tests'))
      const immutDir = path.join(dir, '.immutable')
      const fileA = path.join(dir, 'a.vhd')
      const fileB = path.join(dir, 'b.vhd')
      await fs.writeFile(fileA, 'data-a')
      await fs.writeFile(fileB, 'data-b')

      await File.makeImmutableBatch([fileA, fileB], immutDir)

      assert.strictEqual(await File.isImmutable(fileA), true)
      assert.strictEqual(await File.isImmutable(fileB), true)

      await File.liftImmutability(fileA, immutDir)
      await File.liftImmutability(fileB, immutDir)
      await rimraf(dir)
    })

    it('does not fail when a file in the batch does not exist, and locks the rest', async () => {
      const dir = await fs.mkdtemp(path.join(tmpdir(), 'immutable-backups-tests'))
      const immutDir = path.join(dir, '.immutable')
      const fileA = path.join(dir, 'a.vhd')
      const missing = path.join(dir, 'missing.vhd')
      const fileB = path.join(dir, 'b.vhd')
      await fs.writeFile(fileA, 'data-a')
      await fs.writeFile(fileB, 'data-b')

      await File.makeImmutableBatch([fileA, missing, fileB], immutDir)

      assert.strictEqual(await File.isImmutable(fileA), true)
      assert.strictEqual(await File.isImmutable(fileB), true)

      await File.liftImmutability(fileA, immutDir)
      await File.liftImmutability(fileB, immutDir)
      await rimraf(dir)
    })
  })
})
