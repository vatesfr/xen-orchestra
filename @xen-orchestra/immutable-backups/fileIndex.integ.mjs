import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import * as FileIndex from './fileIndex.mjs'
import * as Directory from './directory.mjs'
import { tmpdir } from 'node:os'
import { rimraf } from 'rimraf'

describe('immutable-backups/fileIndex', async () => {
  it('index File changes', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'immutable-backups-tests'))
    const immutDir = path.join(dir, '.immutable')
    const filePath = path.join(dir, 'test.ext')

    await fs.writeFile(filePath, 'data')
    await FileIndex.indexFile(filePath, immutDir)
    await fs.mkdir(path.join(immutDir, 'NOTADATE'))
    await fs.writeFile(path.join(immutDir, 'NOTADATE.file'), 'content')
    let nb = 0
    let index, target
    for await ({ index, target } of FileIndex.listOlderTargets(immutDir, 0)) {
      assert.strictEqual(true, false, 'Nothing should be eligible for deletion')
    }
    nb = 0
    for await ({ index, target } of FileIndex.listOlderTargets(immutDir, -24 * 60 * 60 * 1000)) {
      assert.strictEqual(target, filePath)
      await fs.unlink(index)
      nb++
    }
    assert.strictEqual(nb, 1)
    await fs.rmdir(path.join(immutDir, 'NOTADATE'))
    await fs.rm(path.join(immutDir, 'NOTADATE.file'))
    for await ({ index, target } of FileIndex.listOlderTargets(immutDir, -24 * 60 * 60 * 1000)) {
      // should remove the empty dir
      assert.strictEqual(true, false, 'Nothing should have stayed here')
    }
    assert.strictEqual((await fs.readdir(immutDir)).length, 0)
    await rimraf(dir)
  })

  it('fails correctly', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'immutable-backups-tests'))
    const immutDir = path.join(dir, '.immutable')
    await fs.mkdir(immutDir)
    const placeholderFile = path.join(dir, 'test.ext')
    await fs.writeFile(placeholderFile, 'data')
    await FileIndex.indexFile(placeholderFile, immutDir)

    const filePath = path.join(dir, 'test2.ext')
    await fs.writeFile(filePath, 'data')
    await FileIndex.indexFile(filePath, immutDir)
    await assert.rejects(() => FileIndex.indexFile(filePath, immutDir), { code: 'EEXIST' })

    await Directory.makeImmutable(immutDir)
    await assert.rejects(() => FileIndex.unindexFile(filePath, immutDir), { code: 'EPERM' })
    await Directory.liftImmutability(immutDir)
    await rimraf(dir)
  })

  it('handles bomb index files', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'immutable-backups-tests'))
    const immutDir = path.join(dir, '.immutable')
    await fs.mkdir(immutDir)
    const placeholderFile = path.join(dir, 'test.ext')
    await fs.writeFile(placeholderFile, 'data')
    await FileIndex.indexFile(placeholderFile, immutDir)

    const indexDayDir = path.join(immutDir, '1980,11-28')
    await fs.mkdir(indexDayDir)
    await fs.writeFile(path.join(indexDayDir, 'big'), Buffer.alloc(2 * 1024 * 1024))
    assert.rejects(async () => {
      let index, target
      for await ({ index, target } of FileIndex.listOlderTargets(immutDir, 0)) {
        // should remove the empty dir
        assert.strictEqual(true, false, `Nothing should have stayed here, got ${index} ${target}`)
      }
    })
    await rimraf(dir)
  })
})
