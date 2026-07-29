import test from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import { getHandler } from '@xen-orchestra/fs'
import { Disposable, pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'
import { openVhd, VhdDirectory } from 'vhd-lib'
/* eslint-disable n/no-missing-import */
import { isMergeableParent, writeVhd } from '../../dist/disks/index.mjs'
import { RemoteVhdDisk } from '../../dist/disks/RemoteVhdDisk.mjs'
/* eslint-enable n/no-missing-import */
import { generateVhd, uniqueIdBuffer } from './tests.fixtures.mjs'

const { beforeEach, afterEach, describe } = test

let tempDir, handler, sourceDisk
const basePath = 'xo-vm-backups/test-vm-uuid/vdis/job/vdi'

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  await fs.mkdirp(`${tempDir}/${basePath}`)
  sourceDisk = undefined
})

afterEach(async () => {
  if (sourceDisk !== undefined) {
    await sourceDisk.close()
  }
  await rimraf(tempDir)
  await handler.forget()
})

// a disk with 2 written blocks, to be copied by writeVhd
async function createSourceDisk() {
  await generateVhd(handler, `${basePath}/source.vhd`, { blocks: [0, 1] })
  sourceDisk = new RemoteVhdDisk({ handler, path: `${basePath}/source.vhd` })
  await sourceDisk.init({ force: false })
  return sourceDisk
}

describe('writeVhd', () => {
  test('writes a VHD directory', async () => {
    const disk = await createSourceDisk()
    const path = `${basePath}/target.alias.vhd`
    const validated = []

    const size = await writeVhd(handler, path, disk, {
      useVhdDirectory: true,
      validator: async dataPath => validated.push(dataPath),
    })

    assert.ok(size > 0, 'the written size is reported')
    assert.deepEqual(validated, [`${basePath}/data/target.vhd`])

    // the result is a readable VHD directory holding the source blocks
    await Disposable.use(openVhd(handler, path), async vhd => {
      assert.ok(vhd instanceof VhdDirectory)
      await vhd.readBlockAllocationTable()
      assert.equal((await vhd.readBlock(1)).data.length, 2 * 1024 * 1024)
    })
  })

  test('delegates the writing of a VHD file to the injected outputStream', async () => {
    const disk = await createSourceDisk()
    const path = `${basePath}/target.vhd`
    const calls = []
    const validated = []
    let streamed

    const size = await writeVhd(handler, path, disk, {
      useVhdDirectory: false,
      validator: async validatedPath => validated.push(validatedPath),
      outputStream: async (path, input, opts) => {
        calls.push({ path, opts })
        const chunks = []
        for await (const chunk of input) {
          chunks.push(chunk)
        }
        streamed = Buffer.concat(chunks)
        // the facade owns the stream size accounting
        return 4242
      },
    })

    // the size comes from outputStream, not from the archive
    assert.equal(size, 4242)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].path, path)
    // the checksum is handled by the caller of writeVhd
    assert.equal(calls[0].opts.checksum, false)
    assert.equal(typeof calls[0].opts.validator, 'function')
    // the VHD stream starts with a copy of the footer
    assert.equal(streamed.subarray(0, 8).toString(), 'conectix')
    // the path is validated once the stream has been written
    assert.deepEqual(validated, [path])
  })
})

describe('isMergeableParent', () => {
  // write the VHD to merge into, and return its path and the uuid a child must declare
  async function createTarget({ mode, chain }) {
    const isDirectory = mode === 'directory'
    const parent = await generateVhd(handler, `${basePath}/parent.vhd`, {
      blocks: [0],
      mode,
      useAlias: isDirectory,
    })
    const parentPath = isDirectory ? `${basePath}/parent.vhd.alias.vhd` : `${basePath}/parent.vhd`
    if (!chain) {
      return { path: parentPath, uuid: parent.footer.uuid }
    }

    // the uuid to match is the tip of the chain, not its base
    await generateVhd(handler, `${basePath}/child.vhd`, {
      header: { parentUnicodeName: 'parent.vhd', parentUuid: parent.footer.uuid },
      blocks: [1],
    })
    const path = `${basePath}/child.vhd`
    return { path, uuid: await Disposable.use(openVhd(handler, path), vhd => vhd.footer.uuid) }
  }

  const CASES = [
    { what: 'a VHD file chain on a remote without VHD directories', chain: true, expected: true },
    { what: 'a chain which is not the expected parent', uuid: 'mismatch', expected: false },
    { what: 'a VHD file when the remote uses VHD directories', useVhdDirectory: true, expected: false },
    { what: 'a VHD directory with the same compression', mode: 'directory', useVhdDirectory: true, expected: true },
    {
      what: 'a VHD directory with another compression',
      mode: 'directory',
      useVhdDirectory: true,
      compression: 'other',
      expected: false,
    },
    { what: 'a VHD directory when the remote does not use VHD directories', mode: 'directory', expected: false },
  ]

  for (const { what, mode, chain, uuid, compression, useVhdDirectory = false, expected } of CASES) {
    test(`${expected ? 'accepts' : 'rejects'} ${what}`, async () => {
      const target = await createTarget({ mode, chain })

      // a VHD directory is only mergeable when the remote compresses the same way
      let compressionType
      if (mode === 'directory') {
        compressionType = await Disposable.use(openVhd(handler, target.path), vhd => vhd.compressionType)
        if (compression === 'other') {
          compressionType = compressionType === 'brotli' ? 'none' : 'brotli'
        }
      }

      assert.equal(
        await isMergeableParent(handler, uuid === 'mismatch' ? uniqueIdBuffer() : target.uuid, target.path, {
          useVhdDirectory,
          compressionType,
        }),
        expected
      )
    })
  }
})
