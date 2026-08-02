import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { mkdtemp, rm, truncate, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import LocalBlockDevice from './_LocalBlockDevice.mjs'

const SIZE = 64 * 1024

describe('LocalBlockDevice', () => {
  let dir
  let path

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), 'xo-local-block-device-'))
    path = join(dir, 'device.img')
    await writeFile(path, '')
    await truncate(path, SIZE)
  })

  after(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  const openDevice = async (opts = {}) => {
    const device = new LocalBlockDevice({ path, size: SIZE, ...opts })
    await device.open()
    return device
  }

  it('rejects a size that is not a positive multiple of the block size', () => {
    assert.throws(() => new LocalBlockDevice({ path, size: 0 }), /positive integer/)
    assert.throws(() => new LocalBlockDevice({ path, size: SIZE + 1 }), /not a multiple/)
  })

  it('refuses I/O before open()', async () => {
    const device = new LocalBlockDevice({ path, size: SIZE })
    await assert.rejects(device.read(0, 512), /open\(\) must be called/)
  })

  it('round-trips a byte range', async () => {
    const device = await openDevice()
    try {
      const payload = Buffer.alloc(1024, 0xab)
      await device.write(4096, payload)
      assert.deepEqual(await device.read(4096, 1024), payload)
      // and left the surrounding bytes alone
      assert.deepEqual(await device.read(4096 - 512, 512), Buffer.alloc(512))
    } finally {
      await device.close()
    }
  })

  it('reports its size and block size', async () => {
    const device = await openDevice({ blockSize: 4096 })
    try {
      assert.equal(device.getSize(), SIZE)
      assert.equal(device.getBlockSize(), 4096)
    } finally {
      await device.close()
    }
  })

  it('refuses to read or write past the end', async () => {
    const device = await openDevice()
    try {
      await assert.rejects(device.read(SIZE - 256, 512), /out of range/)
      await assert.rejects(device.write(SIZE - 256, Buffer.alloc(512)), /out of range/)
      await assert.rejects(device.read(-512, 512), /out of range/)
    } finally {
      await device.close()
    }
  })

  it('flushes and closes idempotently', async () => {
    const device = await openDevice()
    await device.flush()
    await device.close()
    await device.close()
  })
})
