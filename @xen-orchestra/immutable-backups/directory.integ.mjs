import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import * as Directory from './directory.mjs'
import { rimraf } from 'rimraf'

describe('immutable-backups/file', async () => {
  it('really lock a directory', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'immutable-backups-tests'))
    const dataDir = path.join(dir, 'data')
    await fs.mkdir(dataDir)
    const immutDir = path.join(dir, '.immutable')
    const filePath = path.join(dataDir, 'test')
    await fs.writeFile(filePath, 'data')
    await Directory.makeImmutable(dataDir, immutDir)
    assert.strictEqual(await Directory.isImmutable(dataDir), true)
    await assert.rejects(() => fs.writeFile(filePath, 'data'))
    await assert.rejects(() => fs.appendFile(filePath, 'data'))
    await assert.rejects(() => fs.unlink(filePath))
    await assert.rejects(() => fs.rename(filePath, filePath + 'copy'))
    await assert.rejects(() => fs.writeFile(path.join(dataDir, 'test2'), 'data'))
    await assert.rejects(() => fs.rename(dataDir, dataDir + 'copy'))
    await Directory.liftImmutability(dataDir, immutDir)
    assert.strictEqual(await Directory.isImmutable(dataDir), false)
    await fs.writeFile(filePath, 'data')
    await fs.appendFile(filePath, 'data')
    await fs.unlink(filePath)
    await fs.rename(dataDir, dataDir + 'copy')
    await rimraf(dir)
  })
})
