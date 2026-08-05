import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { openCachePersistence } from './_cachePersistence.mjs'

const BLOCK_COUNT = 4

describe('openCachePersistence', () => {
  let dir

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), 'xo-cache-persistence-'))
  })

  after(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('creates the file (and its directory) sparse, with no initial bitmap, on first use', async () => {
    const path = join(dir, 'nested', 'archive-hash')
    const persistence = await openCachePersistence(path, BLOCK_COUNT)
    try {
      assert.equal(persistence.initialBitmap, undefined)
      const stats = await stat(path)
      assert.equal(stats.size, BLOCK_COUNT)
      assert.deepEqual(await readFile(path), Buffer.alloc(BLOCK_COUNT))
    } finally {
      await persistence.close()
    }
  })

  it('marks each cached block at its own byte offset', async () => {
    const path = join(dir, 'marks')
    const persistence = await openCachePersistence(path, BLOCK_COUNT)
    persistence.markCached(0)
    persistence.markCached(2)
    await persistence.close()

    assert.deepEqual(await readFile(path), Buffer.from([1, 0, 1, 0]))
  })

  it('waits for in-flight writes before closing, even if the caller does not await markCached', async () => {
    const path = join(dir, 'in-flight')
    const persistence = await openCachePersistence(path, BLOCK_COUNT)
    for (let index = 0; index < BLOCK_COUNT; index++) {
      persistence.markCached(index)
    }
    await persistence.close()

    assert.deepEqual(await readFile(path), Buffer.alloc(BLOCK_COUNT, 1))
  })

  it('resumes from a previously persisted bitmap of the right length', async () => {
    const path = join(dir, 'resume')
    const first = await openCachePersistence(path, BLOCK_COUNT)
    first.markCached(1)
    first.markCached(3)
    await first.close()

    const second = await openCachePersistence(path, BLOCK_COUNT)
    try {
      assert.deepEqual(second.initialBitmap, Buffer.from([0, 1, 0, 1]))
    } finally {
      await second.close()
    }
  })

  it('discards a persisted file of the wrong length and starts fresh', async () => {
    const path = join(dir, 'stale')
    const first = await openCachePersistence(path, BLOCK_COUNT + 1)
    first.markCached(0)
    await first.close()

    const second = await openCachePersistence(path, BLOCK_COUNT)
    try {
      assert.equal(second.initialBitmap, undefined)
      assert.deepEqual(await readFile(path), Buffer.alloc(BLOCK_COUNT))
    } finally {
      await second.close()
    }
  })

  it('dispose() removes the file', async () => {
    const path = join(dir, 'disposed')
    const persistence = await openCachePersistence(path, BLOCK_COUNT)
    persistence.markCached(0)
    await persistence.dispose()

    await assert.rejects(stat(path), { code: 'ENOENT' })
  })
})
