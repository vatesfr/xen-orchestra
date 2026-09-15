import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'
import { execFile } from 'node:child_process'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { pipeline } from 'node:stream/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { QcowStream } from '@xen-orchestra/qcow2'

import { toVmdkStream, type VmdkLayout } from '../index.mjs'

const execFileAsync = promisify(execFile)

const MiB = 1024 * 1024
const VIRTUAL_SIZE = 64 * MiB

async function qemuImg(...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('qemu-img', args)
  return stdout
}

const hasQemuImg = await qemuImg('--version').then(
  () => true,
  () => false
)

/**
 * A disk with a compressible area, an incompressible one - the case where deflate expands the data
 * and the grains do not fit in their uncompressed size - a hole, and a tail past the last grain.
 */
async function createSource(path: string): Promise<Buffer> {
  const raw = Buffer.alloc(VIRTUAL_SIZE)
  Buffer.alloc(8 * MiB, 0x42).copy(raw, 0)
  const { randomBytes } = await import('node:crypto')
  randomBytes(8 * MiB).copy(raw, 16 * MiB)
  Buffer.from('end of the disk').copy(raw, VIRTUAL_SIZE - 32)
  await writeFile(path, raw)
  return raw
}

describe(
  'ConsumerVmdkStreamOptimized',
  { concurrency: 1, skip: hasQemuImg ? false : 'qemu-img is not available' },
  () => {
    for (const layout of ['streaming', 'withLength'] as VmdkLayout[]) {
      test(`generates a valid vmdk from a qcow2 stream, ${layout} layout`, async () => {
        const dir = await mkdtemp(join(tmpdir(), 'xo-vmdk-'))
        try {
          const rawPath = join(dir, 'source.raw')
          const qcow2Path = join(dir, 'source.qcow2')
          const vmdkPath = join(dir, 'result.vmdk')
          await createSource(rawPath)
          await qemuImg('convert', '-f', 'raw', '-O', 'qcow2', rawPath, qcow2Path)

          const disk = new QcowStream(createReadStream(qcow2Path))
          await disk.init()
          const stream = await toVmdkStream(disk, { layout, diskName: 'result.vmdk' })
          const announcedLength = stream.length
          await pipeline(stream, createWriteStream(vmdkPath))

          const { size } = await stat(vmdkPath)
          if (layout === 'withLength') {
            assert.equal(announcedLength, size, 'the announced length is the size of the file')
          } else {
            assert.equal(announcedLength, undefined, 'the size of a streaming vmdk is not known in advance')
          }

          const info = JSON.parse(await qemuImg('info', '--output=json', vmdkPath))
          assert.equal(info.format, 'vmdk')
          assert.equal(info['virtual-size'], VIRTUAL_SIZE)

          // `check` parses the metadata, `compare` reads every byte back
          await qemuImg('check', vmdkPath)
          const compared = await qemuImg('compare', '-f', 'raw', '-F', 'vmdk', rawPath, vmdkPath)
          assert.match(compared, /Images are identical/)
        } finally {
          await rm(dir, { recursive: true, force: true })
        }
      })
    }
  }
)
