import { test } from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { RemoteAdapter } from '../RemoteAdapter.mjs'
import { VHDFOOTER, VHDHEADER } from '../tests.fixtures.mjs'
import { VhdFile, Constants, VhdDirectory, VhdAbstract } from 'vhd-lib'
import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'
import { RemoteVhdDiskChain } from './RemoteVhdDiskChain.mjs'
import { dirname, basename } from 'node:path'
import { rimraf } from 'rimraf'
import { MergeRemoteDisk } from './MergeRemoteDisk.mjs'

const { beforeEach, afterEach } = test

let tempDir, adapter, handler, jobId, vdiId, basePath, relativePath
const rootPath = 'xo-vm-backups/VMUUID/'

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  adapter = new RemoteAdapter(handler)
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

async function generateVhd(path, opts = {}) {
  let vhd

  let dataPath = path
  if (opts.useAlias) {
    await handler.mkdir(dirname(path) + '/data/')
    dataPath = dirname(path) + '/data/' + basename(path)
  }
  if (opts.mode === 'directory') {
    await handler.mkdir(dataPath)
    vhd = new VhdDirectory(handler, dataPath)
  } else {
    const fd = await handler.openFile(dataPath, 'wx')
    vhd = new VhdFile(handler, fd)
  }

  vhd.header = { ...VHDHEADER, ...opts.header }
  vhd.footer = { ...VHDFOOTER, ...opts.footer, uuid: uniqueIdBuffer() }

  if (vhd.header.parentUuid) {
    vhd.footer.diskType = Constants.DISK_TYPES.DIFFERENCING
  } else {
    vhd.footer.diskType = Constants.DISK_TYPES.DYNAMIC
  }

  if (opts.useAlias === true) {
    await VhdAbstract.createAlias(handler, path + '.alias.vhd', dataPath)
  }

  if (opts.blocks) {
    for (const blockId of opts.blocks) {
      await vhd.writeEntireBlock({ id: blockId, buffer: Buffer.alloc(2 * 1024 * 1024 + 512, blockId) })
    }
  }
  await vhd.writeBlockAllocationTable()
  await vhd.writeHeader()
  await vhd.writeFooter()
  return vhd
}

test('mergeVhdChain merges a simple ancestor + child VHD', async () => {
  // Create ancestor (base) VHD
  const ancestor = await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1] })

  // Create children VHD
  await generateVhd(`${basePath}/child.vhd`, {
    header: {
      parentUnicodeName: 'ancestor.vhd',
      parentUuid: ancestor.footer.uuid,
    },
    blocks: [2],
  })

  const parent = new RemoteVhdDisk({handler, path: `${basePath}/ancestor.vhd`})
  await parent.init()
  const child = new RemoteVhdDisk({handler, path: `${basePath}/child.vhd`})
  await child.init()

  let progressCalls = 0
  const onProgress = () => {
    progressCalls++
  }

  const mergeRemoteDisk = new MergeRemoteDisk(handler, { onProgress, removeUnused: true })

  const result = await mergeRemoteDisk.merge(parent, child)

  assert.ok(result.finalDiskSize > 0, 'merged disks should have non-zero size')
  assert.ok(result.mergedDataSize > 0, 'merged data size should be > 0')
  assert.ok(progressCalls > 0, 'onProgress should have been called')

  // Check that ancestor was renamed to child
  const remainingDisks = await handler.list(basePath)
  assert.equal(remainingDisks.includes('child.vhd'), true)
  assert.equal(remainingDisks.includes('ancestor.vhd'), false)
})

test('mergeVhdChain merges a simple ancestor + child VHD chain', async () => {
  // Create ancestor (base) VHD
  const ancestor = await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1] })

  // Create children VHD
  await generateVhd(`${basePath}/child_1.vhd`, {
    header: {
      parentUnicodeName: 'ancestor.vhd',
      parentUuid: ancestor.footer.uuid,
    },
    blocks: [2],
  })

  await generateVhd(`${basePath}/child_2.vhd`, {
    header: {
      parentUnicodeName: 'ancestor.vhd',
      parentUuid: ancestor.footer.uuid,
    },
    blocks: [3],
  })

  const parent = new RemoteVhdDisk({handler, path: `${basePath}/ancestor.vhd`})
  await parent.init()
  const child1 = new RemoteVhdDisk({handler, path: `${basePath}/child_1.vhd`})
  await child1.init()
  const child2 = new RemoteVhdDisk({handler, path: `${basePath}/child_2.vhd`})

  const childDiskChain = new RemoteVhdDiskChain({disks: [child1, child2]})
  await childDiskChain.init()
  await child2.init()

  console.log(parent.getBlockIndexes(), child1.getBlockIndexes(), child2.getBlockIndexes(), childDiskChain.getBlockIndexes())

  let progressCalls = 0
  const onProgress = () => {
    progressCalls++
  }

  const mergeRemoteDisk = new MergeRemoteDisk(handler, { onProgress, removeUnused: true })

  const result = await mergeRemoteDisk.merge(parent, childDiskChain)

  console.log(result)

  console.log(parent.getBlockIndexes(), child1.getBlockIndexes())

  assert.ok(result.finalDiskSize > 0, 'merged disks should have non-zero size')
  assert.ok(result.mergedDataSize > 0, 'merged data size should be > 0')
  assert.ok(progressCalls > 0, 'onProgress should have been called')

  // Check that ancestor was renamed to child
  const remainingDisks = await handler.list(basePath)
  console.log(remainingDisks)
  assert.equal(remainingDisks.includes('child_1.vhd'), true)
  assert.equal(remainingDisks.includes('child_2.vhd'), false)
  assert.equal(remainingDisks.includes('ancestor.vhd'), false)
})
