import assert from 'node:assert/strict'
import { execFile, execFileSync } from 'node:child_process'
import { mkdtemp, rm, truncate, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { after, before, describe, it } from 'node:test'

import { RawBlockDevice } from './index.mjs'

const execFileP = promisify(execFile)

const BLOCK_SIZE = 512
const SIZE = 4 * 1024 * 1024 // 4 MiB

/**
 * Why this cannot run here, or `false` if it can. A real block device is the
 * whole point, and the cheapest one to make is a loop device — which needs root
 * and `losetup`.
 */
function skipReason(): string | false {
  if (process.getuid === undefined || process.getuid() !== 0) {
    return 'requires root to attach a loop device'
  }
  try {
    execFileSync('losetup', ['--version'], { stdio: 'ignore' })
  } catch {
    return 'requires util-linux (losetup not found)'
  }
  return false
}

const bytePattern = (i: number) => (i * 31 + 11) & 0xff

describe('RawBlockDevice on a loop device', { skip: skipReason() }, () => {
  let dir: string
  let devicePath: string

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), 'vates-iscsi-loop-'))
    const backing = join(dir, 'backing.img')
    await writeFile(backing, '')
    await truncate(backing, SIZE)
    const { stdout } = await execFileP('losetup', ['--find', '--show', backing])
    devicePath = stdout.trim()
  })

  after(async () => {
    if (devicePath !== undefined) {
      await execFileP('losetup', ['--detach', devicePath])
    }
    await rm(dir, { force: true, recursive: true })
  })

  const withDevice = async (fn: (device: RawBlockDevice) => Promise<void>): Promise<void> => {
    const device = new RawBlockDevice({ path: devicePath, size: SIZE })
    await device.open()
    try {
      await fn(device)
    } finally {
      await device.close()
    }
  }

  it('accepts the device node and reports the capacity it was given', async () => {
    await withDevice(async device => {
      assert.equal(device.getSize(), SIZE)
      assert.equal(device.getBlockSize(), BLOCK_SIZE)
    })
  })

  it('round-trips block-aligned data', async () => {
    await withDevice(async device => {
      const payload = Buffer.alloc(8 * BLOCK_SIZE)
      for (let i = 0; i < payload.length; i++) {
        payload[i] = bytePattern(i)
      }
      await device.write(16 * BLOCK_SIZE, payload)
      assert.deepEqual(await device.read(16 * BLOCK_SIZE, payload.length), payload)
    })
  })

  it('round-trips data straddling block boundaries, at an unaligned offset', async () => {
    await withDevice(async device => {
      const payload = Buffer.from('a payload that is not a whole number of sectors long')
      const offset = 3 * BLOCK_SIZE + 17
      await device.write(offset, payload)
      assert.deepEqual(await device.read(offset, payload.length), payload)
      // the surrounding sector was read-modify-written by the kernel, not clobbered
      assert.deepEqual(await device.read(3 * BLOCK_SIZE, 17), Buffer.alloc(17))
    })
  })

  it('survives a reopen, which is what makes it a cache', async () => {
    const payload = Buffer.alloc(BLOCK_SIZE, 0x5a)
    await withDevice(device => device.write(2 * BLOCK_SIZE, payload))
    await withDevice(async device => {
      await device.flush()
      assert.deepEqual(await device.read(2 * BLOCK_SIZE, BLOCK_SIZE), payload)
    })
  })

  it('reads a large range in one call', async () => {
    await withDevice(async device => {
      const payload = Buffer.alloc(SIZE / 2)
      for (let i = 0; i < payload.length; i++) {
        payload[i] = bytePattern(i + 7)
      }
      await device.write(0, payload)
      assert.deepEqual(await device.read(0, payload.length), payload)
    })
  })

  it('throws on a read running past the end, instead of zero-filling it', async () => {
    // the behaviour that sets this apart from FileBlockDevice: a short read on a
    // device of a known size is an I/O error, never a sparse tail
    await withDevice(async device => {
      await assert.rejects(device.read(SIZE, BLOCK_SIZE), /ended after 0 bytes/)
      await assert.rejects(device.read(SIZE - BLOCK_SIZE, 2 * BLOCK_SIZE), /ended after 512 bytes/)
    })
  })

  it('flushes without error', async () => {
    await withDevice(async device => {
      await device.write(0, Buffer.alloc(BLOCK_SIZE, 0xff))
      await device.flush()
    })
  })
})
