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
import { mergeVhdChain } from 'vhd-lib/merge.js'
import { dirname, basename } from 'node:path'
import { rimraf } from 'rimraf'

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

test('it merges delta of non destroyed chain', async () => {
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({
      mode: 'delta',
      size: 12000, // a size too small
      vhds: [
        `${relativePath}/grandchild.vhd`, // grand child should not be merged
        `${relativePath}/child.vhd`,
        // orphan is not here, he should be merged in child
      ],
    })
  )

  // one orphan, which is a full vhd, no parent
  const orphan = await generateVhd(`${basePath}/orphan.vhd`)
  // a child to the orphan
  const child = await generateVhd(`${basePath}/child.vhd`, {
    header: {
      parentUnicodeName: 'orphan.vhd',
      parentUuid: orphan.footer.uuid,
    },
  })
  // a grand child
  await generateVhd(`${basePath}/grandchild.vhd`, {
    header: {
      parentUnicodeName: 'child.vhd',
      parentUuid: child.footer.uuid,
    },
  })

  let logged = []
  const logInfo = message => {
    logged.push(message)
  }
  await adapter.cleanVm(rootPath, { remove: true, logInfo, logWarn: logInfo, lock: false })
  assert.equal(logged[0], `unexpected number of entries in backup cache`)

  logged = []
  await adapter.cleanVm(rootPath, { remove: true, merge: true, logInfo, logWarn: () => {}, lock: false })
  const [merging] = logged
  assert.equal(merging, `merging VHD chain`)

  const metadata = JSON.parse(await handler.readFile(`${rootPath}/metadata.json`))
  // size should be the size of children + grand children after the merge
  assert.equal(metadata.size, 104960)

  // merging is already tested in vhd-lib, don't retest it here (and theses vhd are as empty as my stomach at 12h12)
  // only check deletion
  const remainingVhds = await handler.list(basePath)
  assert.equal(remainingVhds.length, 2)
  assert.equal(remainingVhds.includes('child.vhd'), true)
  assert.equal(remainingVhds.includes('grandchild.vhd'), true)
})

test('mergeVhdChain merges a simple ancestor + child VHD', async () => {
  // Create ancestor (base) VHD
  const ancestor = await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1] })

  // Create child VHD
  await generateVhd(`${basePath}/child.vhd`, {
    header: {
      parentUnicodeName: 'ancestor.vhd',
      parentUuid: ancestor.footer.uuid,
    },
    blocks: [2],
  })

  // Merge chain: [ancestor, child]
  const chain = [`${basePath}/ancestor.vhd`, `${basePath}/child.vhd`]

  let progressCalls = 0
  const onProgress = () => {
    progressCalls++
  }

  const result = await mergeVhdChain(handler, chain, { onProgress, removeUnused: true })

  // console.log(result)

  assert.ok(result.finalVhdSize > 0, 'merged VHD should have non-zero size')
  assert.ok(result.mergedDataSize > 0, 'merged data size should be > 0')
  assert.ok(progressCalls > 0, 'onProgress should have been called')

  // Check that ancestor was renamed to child
  const remainingVhds = await handler.list(basePath)
  assert.equal(remainingVhds.includes('child.vhd'), true)
  assert.equal(remainingVhds.includes('ancestor.vhd'), false)
})
