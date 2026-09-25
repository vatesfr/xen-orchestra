import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mkdtemp, rm, truncate, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { FileBlockDevice } from './backend.mjs'

const BLOCK_SIZE = 512

/** A temporary directory removed whatever the test does. */
const withTmpDir = async (fn: (dir: string) => Promise<void>): Promise<void> => {
  const dir = await mkdtemp(join(tmpdir(), 'vates-iscsi-backend-'))
  try {
    await fn(dir)
  } finally {
    await rm(dir, { force: true, recursive: true })
  }
}

/** A sparse file of `size` bytes, as the class requires: existing and pre-sized. */
const makeFile = async (dir: string, size: number, name = 'lun.img'): Promise<string> => {
  const path = join(dir, name)
  await writeFile(path, '')
  await truncate(path, size)
  return path
}

describe('FileBlockDevice', () => {
  it('rejects a non-positive-integer block size', () => {
    assert.throws(() => new FileBlockDevice({ path: '/nope', blockSize: 0 }), /positive integer/)
    assert.throws(() => new FileBlockDevice({ path: '/nope', blockSize: -1 }), /positive integer/)
    assert.throws(() => new FileBlockDevice({ path: '/nope', blockSize: 1.5 }), /positive integer/)
  })

  it('reads the capacity from the backing file', async () => {
    await withTmpDir(async dir => {
      const device = new FileBlockDevice({ path: await makeFile(dir, 4 * BLOCK_SIZE) })
      await device.open()
      try {
        assert.equal(device.getSize(), 4 * BLOCK_SIZE)
        assert.equal(device.getBlockSize(), BLOCK_SIZE)
      } finally {
        await device.close()
      }
    })
  })

  it('refuses a file whose size is not a multiple of the block size', async () => {
    await withTmpDir(async dir => {
      const device = new FileBlockDevice({ path: await makeFile(dir, BLOCK_SIZE + 1) })
      await assert.rejects(device.open(), /not a multiple of block size/)
    })
  })

  it('throws on I/O before open()', async () => {
    const device = new FileBlockDevice({ path: '/nope' })
    await assert.rejects(device.read(0, BLOCK_SIZE), /must be called before I\/O/)
    await assert.rejects(device.write(0, Buffer.alloc(BLOCK_SIZE)), /must be called before I\/O/)
    await assert.rejects(device.flush(), /must be called before I\/O/)
  })

  it('round-trips a write, at an offset and unaligned', async () => {
    await withTmpDir(async dir => {
      const device = new FileBlockDevice({ path: await makeFile(dir, 4 * BLOCK_SIZE) })
      await device.open()
      try {
        const payload = Buffer.from('hello, lun')
        await device.write(BLOCK_SIZE + 3, payload)
        assert.deepEqual(await device.read(BLOCK_SIZE + 3, payload.length), payload)

        // the bytes around it are untouched
        assert.deepEqual(await device.read(BLOCK_SIZE, 3), Buffer.alloc(3))
      } finally {
        await device.close()
      }
    })
  })

  it('zero-fills the sparse tail of a read past EOF', async () => {
    await withTmpDir(async dir => {
      // a hole: nothing was ever written, so the whole file reads as zeroes
      const device = new FileBlockDevice({ path: await makeFile(dir, 2 * BLOCK_SIZE) })
      await device.open()
      try {
        assert.deepEqual(await device.read(0, 2 * BLOCK_SIZE), Buffer.alloc(2 * BLOCK_SIZE))

        // past the end of the file, `fh.read` reports 0 bytes read: the remainder is
        // zero-filled rather than being reported as an error
        assert.deepEqual(await device.read(2 * BLOCK_SIZE, BLOCK_SIZE), Buffer.alloc(BLOCK_SIZE))
      } finally {
        await device.close()
      }
    })
  })

  it('reads back a large buffer in full', async () => {
    await withTmpDir(async dir => {
      const size = 1024 * BLOCK_SIZE
      const device = new FileBlockDevice({ path: await makeFile(dir, size) })
      await device.open()
      try {
        const payload = Buffer.alloc(size)
        for (let i = 0; i < payload.length; i++) {
          payload[i] = (i * 31 + 11) & 0xff
        }
        await device.write(0, payload)
        assert.deepEqual(await device.read(0, size), payload)
      } finally {
        await device.close()
      }
    })
  })

  it('flushes and closes, and tolerates being opened or closed twice', async () => {
    await withTmpDir(async dir => {
      const device = new FileBlockDevice({ path: await makeFile(dir, BLOCK_SIZE) })
      await device.open()
      await device.open() // no-op
      await device.write(0, Buffer.alloc(BLOCK_SIZE, 0xaa))
      await device.flush()
      await device.close()
      await device.close() // no-op
      await assert.rejects(device.read(0, BLOCK_SIZE), /must be called before I\/O/)
    })
  })

  it('leaves no handle behind when open() fails', async () => {
    await withTmpDir(async dir => {
      const device = new FileBlockDevice({ path: await makeFile(dir, BLOCK_SIZE + 1) })
      await assert.rejects(device.open())
      // the handle opened before the size check was closed again
      await assert.rejects(device.read(0, BLOCK_SIZE), /must be called before I\/O/)
    })
  })
})
