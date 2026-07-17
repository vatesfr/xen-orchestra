import test from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { RemoteAdapter } from './RemoteAdapter.mjs'
import { formatFilenameDate } from './_filenameDate.mjs'
import { VHDFOOTER, VHDHEADER } from './tests.fixtures.mjs'
import { VhdFile, VhdAbstract, Constants, VhdDirectory } from 'vhd-lib'
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

async function getAdapter({ useVhdDirectory = false, vhdDirectoryCompression } = {}) {
  handler = getHandler({ url: `file://${tempDir}`, useVhdDirectory })
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
  if (opts.mode === 'directory') {
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

  if (opts.mode === 'directory') {
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
  test('returns true when the target uuid matches a plain VHD', async () => {
    const adapter = await getAdapter()
    const targetUuid = uniqueIdBuffer()
    await generateVhd(`${basePath}/disk.vhd`, { uuid: targetUuid })

    assert.equal(await adapter.isMergeableParent(targetUuid, `${basePath}/disk.vhd`), true)
  })

  test('returns false when the uuid does not match', async () => {
    const adapter = await getAdapter()
    await generateVhd(`${basePath}/disk.vhd`, { uuid: uniqueIdBuffer() })

    assert.equal(await adapter.isMergeableParent(uniqueIdBuffer(), `${basePath}/disk.vhd`), false)
  })

  test('returns false when the remote uses VHD directories but the chain is a plain VHD', async () => {
    const adapter = await getAdapter({ useVhdDirectory: true })
    const targetUuid = uniqueIdBuffer()
    await generateVhd(`${basePath}/disk.vhd`, { uuid: targetUuid })

    assert.equal(await adapter.isMergeableParent(targetUuid, `${basePath}/disk.vhd`), false)
  })

  test('returns false when the remote does not use VHD directories but the chain is one', async () => {
    const adapter = await getAdapter({ useVhdDirectory: false })
    const targetUuid = uniqueIdBuffer()
    await generateVhd(`${basePath}/disk.vhd`, { uuid: targetUuid, mode: 'directory' })

    assert.equal(await adapter.isMergeableParent(targetUuid, `${basePath}/disk.vhd.alias.vhd`), false)
  })

  test('returns true when the whole VHD directory chain has matching, uniform compression', async () => {
    const adapter = await getAdapter({ useVhdDirectory: true, vhdDirectoryCompression: 'brotli' })
    const rootDisk = await generateVhd(`${basePath}/root.vhd`, { mode: 'directory', compression: 'brotli' })
    const targetUuid = uniqueIdBuffer()
    await generateVhd(`${basePath}/child.vhd`, {
      mode: 'directory',
      compression: 'brotli',
      uuid: targetUuid,
      header: {
        parentUnicodeName: 'root.vhd.alias.vhd',
        parentUuid: rootDisk.footer.uuid,
      },
    })

    assert.equal(await adapter.isMergeableParent(targetUuid, `${basePath}/child.vhd.alias.vhd`), true)
  })

  test('returns false when the VHD directory chain has mixed compression', async () => {
    const adapter = await getAdapter({ useVhdDirectory: true, vhdDirectoryCompression: 'brotli' })
    const rootDisk = await generateVhd(`${basePath}/root.vhd`, { mode: 'directory', compression: 'gzip' })
    const targetUuid = uniqueIdBuffer()
    await generateVhd(`${basePath}/child.vhd`, {
      mode: 'directory',
      compression: 'brotli',
      uuid: targetUuid,
      header: {
        parentUnicodeName: 'root.vhd.alias.vhd',
        parentUuid: rootDisk.footer.uuid,
      },
    })

    assert.equal(await adapter.isMergeableParent(targetUuid, `${basePath}/child.vhd.alias.vhd`), false)
  })
})
