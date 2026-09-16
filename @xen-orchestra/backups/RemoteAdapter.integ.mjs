import test from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { relativeFromFile } from '@xen-orchestra/fs/path'
import { Disposable, pFromCallback } from 'promise-toolbox'
import { RandomAccessDisk } from '@xen-orchestra/disk-transform'
import { RemoteAdapter } from './RemoteAdapter.mjs'
import { checkDisk } from './_runners/_writers/_checkDisk.mjs'
import { formatFilenameDate } from './_filenameDate.mjs'
import { VHDFOOTER, VHDHEADER } from './tests.fixtures.mjs'
import { openVhd, VhdFile, VhdAbstract, Constants, VhdDirectory } from 'vhd-lib'
import computeGeometryForSize from 'vhd-lib/_computeGeometryForSize.js'
import { dirname, basename } from 'node:path'
import { rimraf } from 'rimraf'

const { beforeEach, afterEach, describe } = test

let tempDir, handler, jobId, vdiId, basePath, relativePath
const vmUuid = 'a1b2c3d4-0000-0000-0000-000000000000'
const rootPath = `xo-vm-backups/${vmUuid}`

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  jobId = uniqueId()
  vdiId = uniqueId()
  relativePath = `vdis/${jobId}/${vdiId}`
  basePath = `${rootPath}/${relativePath}`
  await fs.mkdirp(`${tempDir}/${basePath}`)
})

afterEach(async () => {
  await rimraf(tempDir)
  await handler.forget()
})

const uniqueId = () => uuid.v1()
const uniqueIdBuffer = () => uuid.v1({}, Buffer.alloc(16))

async function getAdapter({ useVhdDirectory = false, vhdDirectoryCompression, remoteCompressionType } = {}) {
  handler = getHandler({ url: `file://${tempDir}`, useVhdDirectory, compressionType: remoteCompressionType })
  await handler.sync()
  return new RemoteAdapter(handler, { vhdDirectoryCompression })
}

const listVmDir = () => handler.list(rootPath, { ignoreMissing: true })

// write a full backup the way a backup job would, i.e. through the adapter
function writeFullBackup(adapter, timestamp = Date.now()) {
  return adapter.writeVmBackupMetadata(vmUuid, {
    mode: 'full',
    xva: `./${formatFilenameDate(timestamp)}.xva`,
    vm: { uuid: vmUuid },
    jobId: uuid.v1(),
    scheduleId: uuid.v1(),
    timestamp,
  })
}

// mirrors the helper in _cleanVm.integ.mjs, with compression support for VHD directories.
// VHD directories are only openable through their alias (see RemoteVhdDisk.init), so
// `path` here is always the alias-less name; the alias is created as `${path}.alias.vhd`.
async function generateVhd(path, opts = {}) {
  let vhd

  let dataPath = path
  const { mode = 'file' } = opts
  assert.ok(mode === 'file' || mode === 'directory', `unknown mode ${mode}`)
  if (mode === 'directory') {
    dataPath = dirname(path) + '/data/' + basename(path)
    await handler.mkdir(dirname(path) + '/data/')
    await handler.mkdir(dataPath)
    vhd = new VhdDirectory(handler, dataPath, { compression: opts.compression })
  } else {
    const fd = await handler.openFile(dataPath, 'wx')
    vhd = new VhdFile(handler, fd)
  }

  vhd.header = { ...VHDHEADER, ...opts.header }
  vhd.footer = { ...VHDFOOTER, ...opts.footer, uuid: opts.uuid ?? uniqueIdBuffer() }

  if (vhd.header.parentUuid) {
    vhd.footer.diskType = Constants.DISK_TYPES.DIFFERENCING
  } else {
    vhd.footer.diskType = Constants.DISK_TYPES.DYNAMIC
  }

  if (mode === 'directory') {
    await VhdAbstract.createAlias(handler, path + '.alias.vhd', dataPath)
  }

  await vhd.writeBlockAllocationTable()
  await vhd.writeHeader()
  await vhd.writeFooter()
  return vhd
}

describe('cache.json.gz on an immutable remote', { concurrency: 1 }, () => {
  test('writing a backup does not create it', async () => {
    const adapter = await getAdapter()
    handler.isImmutable = () => true

    await writeFullBackup(adapter)

    assert.ok(
      !(await listVmDir()).includes('cache.json.gz'),
      'cache.json.gz must never be created on an immutable remote'
    )
  })

  // deleteFullVmBackups() rather than deleteVmBackup(), because the latter also runs cleanVm()
  // which removes a leftover cache and would hide a cache wrongly written by the deletion itself
  test('deleting a backup does not create it', async () => {
    const adapter = await getAdapter()
    handler.isImmutable = () => true
    await writeFullBackup(adapter)
    const backups = await adapter.listVmBackups(vmUuid)
    assert.equal(backups.length, 1)

    await adapter.deleteFullVmBackups(backups)

    assert.ok(
      !(await listVmDir()).includes('cache.json.gz'),
      'cache.json.gz must never be created on an immutable remote'
    )
  })

  test('it is still created on a mutable remote', async () => {
    const adapter = await getAdapter()
    await writeFullBackup(adapter)

    assert.ok((await listVmDir()).includes('cache.json.gz'), 'a mutable remote must keep using the cache')
  })
})

describe('RemoteAdapter#isMergeableParent', { concurrency: 1 }, () => {
  for (const diskIsDirectory of [false, true]) {
    for (const useVhdDirectory of [false, true]) {
      for (const compressionMatches of [false, true]) {
        for (const uuidMatches of [false, true]) {
          const expected = uuidMatches && (diskIsDirectory ? useVhdDirectory && compressionMatches : !useVhdDirectory)

          test(`diskIsDirectory=${diskIsDirectory} useVhdDirectory=${useVhdDirectory} compressionMatches=${compressionMatches} uuidMatches=${uuidMatches} -> ${expected}`, async () => {
            const targetCompression = 'brotli'
            const adapter = await getAdapter({ useVhdDirectory, vhdDirectoryCompression: targetCompression })
            const targetUuid = uniqueIdBuffer()

            await generateVhd(`${basePath}/disk.vhd`, {
              mode: diskIsDirectory ? 'directory' : 'file',
              compression: diskIsDirectory ? (compressionMatches ? targetCompression : 'gzip') : undefined,
              uuid: uuidMatches ? targetUuid : uniqueIdBuffer(),
            })
            const path = diskIsDirectory ? `${basePath}/disk.vhd.alias.vhd` : `${basePath}/disk.vhd`

            assert.equal(await adapter.isMergeableParent(targetUuid, path), expected)
          })
        }
      }
    }
  }
})

describe('RemoteAdapter#isMergeableParent compression resolution', { concurrency: 1 }, () => {
  test('the per-remote compressionType override wins over the adapter default', async () => {
    const adapter = await getAdapter({
      useVhdDirectory: true,
      vhdDirectoryCompression: 'gzip', // config.toml-style default
      remoteCompressionType: 'brotli', // per-remote override, should be the one actually compared against
    })
    const targetUuid = uniqueIdBuffer()
    await generateVhd(`${basePath}/disk.vhd`, { mode: 'directory', compression: 'brotli', uuid: targetUuid })

    assert.equal(await adapter.isMergeableParent(targetUuid, `${basePath}/disk.vhd.alias.vhd`), true)
  })

  test('a disk compressed with the adapter default (not the override) is rejected', async () => {
    const adapter = await getAdapter({
      useVhdDirectory: true,
      vhdDirectoryCompression: 'gzip',
      remoteCompressionType: 'brotli',
    })
    const targetUuid = uniqueIdBuffer()
    // disk uses the config default, not the remote override that's actually in effect
    await generateVhd(`${basePath}/disk.vhd`, { mode: 'directory', compression: 'gzip', uuid: targetUuid })

    assert.equal(await adapter.isMergeableParent(targetUuid, `${basePath}/disk.vhd.alias.vhd`), false)
  })

  test("a remote-level 'none' override means no compression, ignoring the adapter default", async () => {
    const adapter = await getAdapter({
      useVhdDirectory: true,
      vhdDirectoryCompression: 'brotli',
      remoteCompressionType: 'none',
    })
    const targetUuid = uniqueIdBuffer()
    // no compression option => VhdDirectory's own getCompressionType() is undefined, matching 'none'
    await generateVhd(`${basePath}/disk.vhd`, { mode: 'directory', uuid: targetUuid })

    assert.equal(await adapter.isMergeableParent(targetUuid, `${basePath}/disk.vhd.alias.vhd`), true)
  })
})

const DEFAULT_BLOCK_SIZE = 0x00200000 // 2MB, from vhd-lib spec

// minimal source disk, enough for writeVhd() to produce a real, readable VHD
class MockDisk extends RandomAccessDisk {
  #size
  #blockIndexes
  #fillByte
  #differencing

  constructor(nbBlocks, blockIndexes, fillByte, { differencing = false } = {}) {
    super()
    const { actualSize } = computeGeometryForSize(nbBlocks * DEFAULT_BLOCK_SIZE)
    this.#size = actualSize
    this.#blockIndexes = blockIndexes
    this.#fillByte = fillByte
    this.#differencing = differencing
  }

  async readBlock(index) {
    const remaining = this.#size - DEFAULT_BLOCK_SIZE * index
    return { index, data: Buffer.alloc(Math.min(remaining, DEFAULT_BLOCK_SIZE), this.#fillByte) }
  }

  getVirtualSize() {
    return this.#size
  }

  getBlockSize() {
    return DEFAULT_BLOCK_SIZE
  }

  isDifferencing() {
    return this.#differencing
  }

  getBlockIndexes() {
    return this.#blockIndexes
  }

  hasBlock(index) {
    return this.#blockIndexes.includes(index)
  }

  async init() {}
  async close() {}
}

// IncrementalRemoteWriter._transfer(): the disk is written
// through the adapter, and the *real* checkDisk() is used as the validator
describe('RemoteAdapter#writeVhd validated by checkDisk', { concurrency: 1 }, () => {
  for (const useVhdDirectory of [false, true]) {
    const mode = useVhdDirectory ? 'directory' : 'file'

    test(`${mode}: writes a base disk that passes validation and reads back`, async () => {
      const adapter = await getAdapter({ useVhdDirectory })
      const path = `${basePath}/${adapter.getVhdFileName('base')}`

      const size = await adapter.writeVhd(path, new MockDisk(2, [0, 1], 0x42), {
        validator: tmpPath => checkDisk(handler, tmpPath),
        uuid: uniqueIdBuffer(),
      })

      assert.ok(size > 0, 'reported size should be greater than 0')
      assert.equal(basename(path).endsWith('.alias.vhd'), useVhdDirectory)
      await Disposable.use(openVhd(handler, path), async vhd => {
        assert.equal(vhd.footer.diskType, Constants.DISK_TYPES.DYNAMIC)
        await vhd.readBlockAllocationTable()
        const { data } = await vhd.readBlock(1)
        assert.ok(
          data.every(byte => byte === 0x42),
          'block 1 should contain the source disk data'
        )
      })
    })

    test(`${mode}: writes a differencing disk chained to its parent that passes validation`, async () => {
      const adapter = await getAdapter({ useVhdDirectory })
      const parentPath = `${basePath}/${adapter.getVhdFileName('20000101T000000Z')}`
      const childPath = `${basePath}/${adapter.getVhdFileName('20000102T000000Z')}`
      const parentUuid = uniqueIdBuffer()

      await adapter.writeVhd(parentPath, new MockDisk(2, [0, 1], 0xaa), {
        validator: tmpPath => checkDisk(handler, tmpPath),
        uuid: parentUuid,
      })
      await adapter.writeVhd(childPath, new MockDisk(2, [1], 0xbb, { differencing: true }), {
        validator: tmpPath => checkDisk(handler, tmpPath),
        uuid: uniqueIdBuffer(),
        parentUuid,
        parentPath: relativeFromFile(childPath, parentPath),
      })

      await Disposable.use(openVhd(handler, childPath), async vhd => {
        assert.equal(vhd.footer.diskType, Constants.DISK_TYPES.DIFFERENCING)
        assert.deepEqual(vhd.header.parentUuid, parentUuid)
        assert.equal(vhd.header.parentUnicodeName, relativeFromFile(childPath, parentPath))
      })
    })

    test(`${mode}: a rejected validation leaves no disk behind`, async () => {
      const adapter = await getAdapter({ useVhdDirectory })
      const path = `${basePath}/${adapter.getVhdFileName('base')}`

      await assert.rejects(
        adapter.writeVhd(path, new MockDisk(1, [0], 0x11), {
          validator: async () => {
            throw new Error('boom')
          },
          uuid: uniqueIdBuffer(),
        }),
        /boom/
      )

      // neither the alias/file nor the VHD directory it points to must survive, otherwise the
      // next run would chain onto a disk that was never validated
      assert.deepEqual(await handler.list(basePath, { ignoreMissing: true }), useVhdDirectory ? ['data'] : [])
      assert.deepEqual(await handler.list(`${basePath}/data`, { ignoreMissing: true }), [])
    })
  }
})
