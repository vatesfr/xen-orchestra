import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mkdtemp, rm, truncate, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { RawBlockDevice } from './RawBlockDevice.mjs'

const BLOCK_SIZE = 512
const SIZE = 4 * BLOCK_SIZE

/** A temporary directory removed whatever the test does. */
const withTmpDir = async (fn: (dir: string) => Promise<void>): Promise<void> => {
  const dir = await mkdtemp(join(tmpdir(), 'vates-iscsi-raw-'))
  try {
    await fn(dir)
  } finally {
    await rm(dir, { force: true, recursive: true })
  }
}

// A real device node cannot be created without root, so what is covered here is
// everything around the I/O: the guards, the capacity, and the lifecycle. The
// I/O itself is covered by `RawBlockDevice.integ.mts`, against a loop device.
describe('RawBlockDevice', () => {
  it('rejects a non-positive-integer block size', () => {
    for (const blockSize of [0, -1, 1.5]) {
      assert.throws(() => new RawBlockDevice({ path: '/dev/null', size: SIZE, blockSize }), /positive integer/)
    }
  })

  it('rejects a non-positive-integer size', () => {
    for (const size of [0, -BLOCK_SIZE, 1.5]) {
      assert.throws(() => new RawBlockDevice({ path: '/dev/null', size }), /size must be a positive integer/)
    }
  })

  it('rejects a size that is not a multiple of the block size', () => {
    assert.throws(
      () => new RawBlockDevice({ path: '/dev/null', size: BLOCK_SIZE + 1 }),
      /is not a multiple of block size/
    )
  })

  it('reports the capacity it was given, never the inode', async () => {
    await withTmpDir(async dir => {
      // an ordinary file of a *different* length: nothing may be read from the
      // inode, which for a real device node would report 0
      const path = join(dir, 'not-a-device')
      await writeFile(path, '')
      await truncate(path, 8 * BLOCK_SIZE)

      const device = new RawBlockDevice({ path, size: SIZE })
      assert.equal(device.getSize(), SIZE)
      assert.equal(device.getBlockSize(), BLOCK_SIZE)
    })
  })

  it('refuses to open a path that is not a block device', async () => {
    await withTmpDir(async dir => {
      const path = join(dir, 'regular-file')
      await writeFile(path, '')
      await truncate(path, SIZE)

      const device = new RawBlockDevice({ path, size: SIZE })
      // the guard against a misconfigured path naming, say, a real disk's
      // filesystem instead of the cache device
      await assert.rejects(device.open(), new RegExp(`${path} is not a block device`))
      // and the handle it opened to check was closed again
      await assert.rejects(device.read(0, BLOCK_SIZE), /must be called before I\/O/)
    })
  })

  it('gives up on a path that never appears, after its retries', async () => {
    const device = new RawBlockDevice({
      path: '/dev/does-not-exist-for-vates-iscsi',
      size: SIZE,
      openRetries: 2,
      openRetryDelayMs: 1,
    })
    await assert.rejects(device.open(), { code: 'ENOENT' })
  })

  it('does not retry a failure that will not fix itself', async () => {
    // a directory: EISDIR, which is never transient — it must surface at once
    await withTmpDir(async dir => {
      const device = new RawBlockDevice({ path: dir, size: SIZE, openRetryDelayMs: 60_000 })
      // would time out the test if EISDIR were retried at all
      await assert.rejects(device.open(), { code: 'EISDIR' })
    })
  })

  it('throws on I/O before open()', async () => {
    const device = new RawBlockDevice({ path: '/dev/null', size: SIZE })
    await assert.rejects(device.read(0, BLOCK_SIZE), /RawBlockDevice.open\(\) must be called before I\/O/)
    await assert.rejects(device.write(0, Buffer.alloc(BLOCK_SIZE)), /must be called before I\/O/)
    await assert.rejects(device.flush(), /must be called before I\/O/)
  })

  it('tolerates being closed before it was ever opened, and twice', async () => {
    const device = new RawBlockDevice({ path: '/dev/null', size: SIZE })
    await device.close()
    await device.close()
  })
})
