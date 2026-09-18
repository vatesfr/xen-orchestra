import { test } from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { normalize } from '@xen-orchestra/fs/path'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'
import { Constants, VhdAbstract, VhdDirectory } from 'vhd-lib'

import { VHDFOOTER, VHDHEADER } from './tests.fixtures.mjs'
// `RemoteDiskLineage` is a `.mts` module: this is the TS ESM spelling of the sibling import, which
// resolves at runtime because the `test` script runs the built `dist/` copy of this file. It must
// NOT go through `../dist/`, which would make `tsc` pull the emitted declarations back in as
// inputs (TS5055) — the `*.integ.mjs` files can only do that because tsconfig excludes them.
/* eslint-disable n/no-missing-import */
import { RemoteDiskLineage } from './RemoteDiskLineage.mjs'
/* eslint-enable n/no-missing-import */

const { beforeEach, afterEach, describe } = test

let handler, tempDir, vdiDir

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  // VmIncrementalBackupArchive passes a normalized path, and RemoteDiskLineage compares
  // #vdiDir against normalized paths, so the fixture has to match
  vdiDir = normalize(`xo-vm-backups/VMUUID/vdis/${uuid.v1()}/${uuid.v1()}`)
  await handler.mktree(`${vdiDir}/data`)
})

afterEach(async () => {
  await rimraf(tempDir)
  await handler.forget()
})

// Creates an aliased VHD directory in `vdiDir`, chained onto `parent` when given.
async function generateDisk(name, { parent } = {}) {
  const aliasPath = `${vdiDir}/${name}.alias.vhd`
  const dataPath = `${vdiDir}/data/${name}.vhd`

  await handler.mkdir(dataPath)
  const vhd = new VhdDirectory(handler, dataPath)
  vhd.header = { ...VHDHEADER }
  vhd.footer = { ...VHDFOOTER, uuid: uuid.v1({}, Buffer.alloc(16)) }
  if (parent !== undefined) {
    vhd.header.parentUnicodeName = `${parent.name}.alias.vhd`
    vhd.header.parentUuid = parent.vhd.footer.uuid
    vhd.footer.diskType = Constants.DISK_TYPES.DIFFERENCING
  } else {
    vhd.footer.diskType = Constants.DISK_TYPES.DYNAMIC
  }
  await vhd.writeEntireBlock({ id: 0, buffer: Buffer.alloc(2 * 1024 * 1024 + 512, 1) })
  await vhd.writeBlockAllocationTable()
  await vhd.writeHeader()
  await vhd.writeFooter()
  await VhdAbstract.createAlias(handler, aliasPath, dataPath)

  return { name, aliasPath, dataPath, vhd }
}

// Plants the merge state file a previous interrupted merge would have left on `parent`.
async function writeMergeState(parent, { chain, step = 'mergeBlocks' }) {
  const statePath = `${vdiDir}/.${parent.name}.alias.vhd.merge.json`
  await handler.writeFile(
    statePath,
    JSON.stringify({
      child: { uuid: uuid.v1() },
      parent: { uuid: uuid.v1() },
      chain: chain.map(name => `${name}.alias.vhd`),
      currentBlock: 0,
      mergedDataSize: 0,
      step,
      diskSize: 0,
    })
  )
  return statePath
}

async function cleanLineage({ activeDisks = [], lineageDir = vdiDir } = {}) {
  const warnings = []
  const lineage = new RemoteDiskLineage(handler, lineageDir, {
    remove: true,
    merge: false,
    logInfo: () => {},
    logWarn: (message, data) => warnings.push({ message, data }),
  })
  await lineage.init()
  for (const disk of activeDisks) {
    lineage.addActiveDiskPath(disk.aliasPath)
  }
  await lineage.clean({ remove: true, merge: false })
  return { warnings }
}

const exists = path => handler.list(vdiDir).then(files => files.includes(path.slice(vdiDir.length + 1)))

describe('RemoteDiskLineage.clean() interrupted merges', { concurrency: 1 }, () => {
  test('drops the merge state and the disks when no descendant is still referenced', async () => {
    const base = await generateDisk('base')
    const child = await generateDisk('child', { parent: base })
    const statePath = await writeMergeState(base, { chain: ['base', 'child'] })

    // no active disk: the whole lineage is out of retention
    const { warnings } = await cleanLineage()

    assert.equal(await exists(statePath), false, 'merge state should be deleted')
    assert.equal(await exists(base.aliasPath), false, 'base should be deleted')
    assert.equal(await exists(child.aliasPath), false, 'child should be deleted')
    assert.ok(
      warnings.some(({ message }) => message === 'merge state on a fully orphaned lineage'),
      'the dropped chain should be reported'
    )
  })

  test('refuses to resume, and keeps everything, when the chain lost a disk before its cleanup step', async () => {
    const base = await generateDisk('base')
    const child = await generateDisk('child', { parent: base })
    // `missing` was recorded in the chain but is no longer on the remote: merging base + child
    // and renaming onto the tip would silently drop its blocks
    const statePath = await writeMergeState(base, { chain: ['base', 'missing', 'child'] })

    const { warnings } = await cleanLineage({ activeDisks: [child] })

    assert.equal(await exists(statePath), true, 'merge state should be kept as evidence')
    assert.equal(await exists(base.aliasPath), true, 'base should be kept')
    assert.equal(await exists(child.aliasPath), true, 'child should be kept')

    const warning = warnings.find(
      ({ message }) => message === 'merge chain lost disks before its cleanup step, refusing to resume'
    )
    assert.notEqual(warning, undefined, 'the incomplete chain should be reported')
    assert.deepEqual(warning.data.missing, [`${vdiDir}/missing.alias.vhd`])
  })

  test('drops a merge state whose chain no longer has two disks to merge, during cleanup', async () => {
    const base = await generateDisk('base')
    // the cleanup step unlinks the children as it goes, so a gap there is expected
    const statePath = await writeMergeState(base, { chain: ['base', 'alreadyUnlinked'], step: 'cleanup' })

    const { warnings } = await cleanLineage({ activeDisks: [base] })

    assert.equal(await exists(statePath), false, 'merge state should be deleted')
    assert.equal(await exists(base.aliasPath), true, 'the active disk should be kept')
    assert.ok(
      warnings.some(({ message }) => message === 'merge state without a resumable chain'),
      'the unresumable state should be reported'
    )
  })

  test('keeps a resumable merge state and its disks', async () => {
    const base = await generateDisk('base')
    const child = await generateDisk('child', { parent: base })
    const statePath = await writeMergeState(base, { chain: ['base', 'child'] })

    const { warnings } = await cleanLineage({ activeDisks: [child] })

    assert.equal(await exists(statePath), true, 'merge state should be kept')
    assert.equal(await exists(base.aliasPath), true, 'base should be kept')
    assert.equal(await exists(child.aliasPath), true, 'child should be kept')
    assert.deepEqual(warnings, [], 'a resumable merge should not warn')
  })

  test('behaves the same when built with a non-normalized VDI directory', async () => {
    const base = await generateDisk('base')
    const child = await generateDisk('child', { parent: base })
    const statePath = await writeMergeState(base, { chain: ['base', 'child'] })

    // the constructor must normalize: otherwise #cleanOrphanDataFiles fails to exclude the VDI
    // directory from the data directories it sweeps and deletes every unclaimed file in it,
    // starting with the merge state
    const { warnings } = await cleanLineage({ activeDisks: [child], lineageDir: vdiDir.replace(/^\//, '') })

    assert.equal(await exists(statePath), true, 'merge state should be kept')
    assert.equal(await exists(base.aliasPath), true, 'base should be kept')
    assert.equal(await exists(child.aliasPath), true, 'child should be kept')
    assert.deepEqual(warnings, [], 'nothing should be reported as orphaned')
  })
})
