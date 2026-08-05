import test from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { RemoteAdapter } from './RemoteAdapter.mjs'
import { VHDFOOTER, VHDHEADER } from './tests.fixtures.mjs'
import { VhdFile, VhdAbstract, Constants, VhdDirectory } from 'vhd-lib'
import { dirname, basename } from 'node:path'
import { rimraf } from 'rimraf'

const { beforeEach, afterEach, describe } = test

let tempDir, handler, jobId, vdiId, basePath, relativePath
const rootPath = 'xo-vm-backups/VMUUID/'

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
              mode: diskIsDirectory ? 'directory' : 'plain',
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
