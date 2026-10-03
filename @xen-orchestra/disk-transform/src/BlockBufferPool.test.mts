import { test } from 'node:test'
import assert from 'node:assert'
import { BlockBufferPool } from './BlockBufferPool.mjs'
import { DebugDisk } from './utils/DebugDisk.mjs'
import { DiskBlock } from './Disk.mjs'
import { SynchronizedDisk } from './SynchronizedDisk.mjs'
import { ThrottledDisk } from './Throttled.mjs'
import { Throttle } from '@vates/generator-toolbox'

test('BlockBufferPool', async t => {
  await t.test('reuses released buffers', () => {
    const pool = new BlockBufferPool({ blockSize: 64 })
    const first = pool.acquire()
    assert.strictEqual(first.data.length, 64)

    first.release()
    const second = pool.acquire()
    assert.strictEqual(second.data, first.data, 'the released buffer is reused')
    assert.strictEqual(pool.allocated, 1)
    assert.strictEqual(pool.reused, 1)
  })

  await t.test('ignores a double release', () => {
    const pool = new BlockBufferPool({ blockSize: 8 })
    const block = pool.acquire()
    block.release()
    block.release()
    const a = pool.acquire()
    const b = pool.acquire()
    assert.notStrictEqual(a.data, b.data, 'the same memory must never be handed out twice')
  })

  await t.test('keeps at most maxFree buffers', () => {
    const pool = new BlockBufferPool({ blockSize: 8, maxFree: 1 })
    const a = pool.acquire()
    const b = pool.acquire()
    a.release()
    b.release()
    pool.acquire()
    pool.acquire()
    assert.strictEqual(pool.allocated, 3)
    assert.strictEqual(pool.reused, 1)
  })
})

// a disk whose blocks come from a pool, and which tracks the releases
class PooledDisk extends DebugDisk {
  pool: BlockBufferPool
  released = 0
  constructor(nbBlocks: number, blockSize: number) {
    super({ nbBlocks, blockSize, fillRate: 100 })
    this.pool = new BlockBufferPool({ blockSize })
  }
  async readBlock(index: number): Promise<DiskBlock> {
    const { data, release } = this.pool.acquire()
    data.fill(index)
    return {
      index,
      data,
      release: () => {
        this.released++
        release()
      },
    }
  }
}

test('release through the disk transforms', async t => {
  await t.test('ThrottledDisk keeps release', async () => {
    const source = new PooledDisk(4, 32)
    await source.init()
    const disk = new ThrottledDisk(source, new Throttle(0))
    for await (const block of disk.diskBlocks()) {
      assert.strictEqual(typeof block.release, 'function')
      block.release!()
    }
    assert.strictEqual(source.released, 4)
  })

  await t.test('SynchronizedDisk releases a block once every fork released it', async () => {
    const nbBlocks = 10
    const source = new PooledDisk(nbBlocks, 32)
    await source.init()
    const disk = new SynchronizedDisk(source)
    const forks = [disk.fork('a'), disk.fork('b')]
    const seen: Array<Array<number>> = [[], []]
    await Promise.all(
      forks.map(async (fork, i) => {
        for await (const block of fork.diskBlocks()) {
          // the data must still be valid here, even if the other fork already released it
          assert.strictEqual(block.data[0], block.index)
          seen[i].push(block.index)
          // releasing twice from the same fork must count once
          block.release!()
          block.release!()
        }
      })
    )
    assert.deepStrictEqual(seen[0], seen[1])
    assert.strictEqual(source.released, nbBlocks, 'each block released once, after both forks')
  })

  await t.test('SynchronizedDisk does not release while a fork still holds the block', async () => {
    const source = new PooledDisk(3, 32)
    await source.init()
    const disk = new SynchronizedDisk(source)
    const forks = [disk.fork('a'), disk.fork('b')]
    const held: Array<DiskBlock> = []
    await Promise.all([
      (async () => {
        for await (const block of forks[0].diskBlocks()) {
          block.release!()
        }
      })(),
      (async () => {
        for await (const block of forks[1].diskBlocks()) {
          held.push(block)
        }
      })(),
    ])
    assert.strictEqual(source.released, 0, 'fork b never released')
    held.forEach(block => block.release!())
    assert.strictEqual(source.released, 3)
  })
})
