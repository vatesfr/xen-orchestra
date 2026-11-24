import test from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
// `dist/` is built by the `test-integration` script, which starts by removing it: these imports
// cannot be resolved when linting a working tree that has not been built yet
/* eslint-disable n/no-missing-import */
import { VmBackupDirectory } from '../dist/VmBackupDirectory.mjs'
import { RemoteVhdDisk } from '../dist/disks/RemoteVhdDisk.mjs'
import { MergeRemoteDisk } from '../dist/disks/MergeRemoteDisk.mjs'
/* eslint-enable n/no-missing-import */
import { VHDFOOTER, VHDHEADER } from './tests.fixtures.mjs'
import { VhdFile, Constants, VhdDirectory, VhdAbstract } from 'vhd-lib'
import { dirname, basename } from 'node:path'
import { createHash } from 'node:crypto'
import { promisify } from 'node:util'
import zlib from 'node:zlib'
import { rimraf } from 'rimraf'

const { beforeEach, afterEach, describe } = test

const gunzip = promisify(zlib.gunzip)
const gzip = promisify(zlib.gzip)

let tempDir, handler, jobId, vdiId, basePath, relativePath, vdiId2, basePath2, relativePath2
const rootPath = 'xo-vm-backups/VMUUID/'

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  jobId = uniqueId()
  vdiId = uniqueId()
  relativePath = `vdis/${jobId}/${vdiId}`
  basePath = `${rootPath}/${relativePath}`
  vdiId2 = uniqueId()
  relativePath2 = `vdis/${jobId}/${vdiId2}`
  basePath2 = `${rootPath}/${relativePath2}`
  await fs.mkdirp(`${tempDir}/${basePath}`)
  await fs.mkdirp(`${tempDir}/${basePath2}`)
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

test('It remove broken vhd', async () => {
  // todo also tests a directory and an alias

  await handler.writeFile(`${basePath}/notReallyAVhd.vhd`, 'I AM NOT A VHD')
  // metadata references a non-existent disk so the lineage is created for this vdiDir
  // and notReallyAVhd.vhd is treated as an unreferenced orphan
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath}/nonexistent.vhd`] })
  )
  assert.equal((await handler.list(basePath)).length, 1)
  let logged = ''
  const logInfo = message => {
    logged += message
  }
  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: false, logInfo, logWarn: logInfo })
  assert.ok(logged.includes('failed to open disk'))
  // not removed
  assert.deepEqual(await handler.list(basePath), ['notReallyAVhd.vhd'])
  // really remove it
  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, logInfo, logWarn: () => {} })
  assert.deepEqual(await handler.list(basePath), [])
})

test('it remove vhd with missing or multiple ancestors', async () => {
  // one with a broken parent, should be deleted
  await generateVhd(`${basePath}/abandoned.vhd`, {
    header: {
      parentUnicodeName: 'gone.vhd',
      parentUuid: uniqueIdBuffer(),
    },
  })

  // one orphan, which is a full vhd, no parent : should stay
  const orphan = await generateVhd(`${basePath}/orphan.vhd`)
  // a child to the orphan in the metadata : should stay
  await generateVhd(`${basePath}/child.vhd`, {
    header: {
      parentUnicodeName: 'orphan.vhd',
      parentUuid: orphan.footer.uuid,
    },
  })
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({
      mode: 'delta',
      vhds: [`${relativePath}/child.vhd`, `${relativePath}/abandoned.vhd`],
    })
  )
  // clean
  let logged = ''
  const logInfo = message => {
    logged += message + '\n'
  }
  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, logInfo, logWarn: logInfo })

  // abandoned has a missing parent, orphan and child have no active backup reference
  const detectedMissingParent = logged.match(/parent disk is missing/g) || []
  assert.equal(detectedMissingParent.length, 1)

  // we don't test the file on disk, since they will all be marked as unused and deleted without a metadata.json file
})

test('it remove backup metadata referencing a missing vhd in delta backup', async () => {
  // create a metadata file marking child and orphan as ok
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({
      mode: 'delta',
      vhds: [
        `${relativePath}/orphan.vhd`,
        `${relativePath}/child.vhd`,
        // abandoned.json is not here
      ],
    })
  )

  await generateVhd(`${basePath}/abandoned.vhd`)

  // one orphan, which is a full vhd, no parent
  const orphan = await generateVhd(`${basePath}/orphan.vhd`)

  // a child to the orphan
  await generateVhd(`${basePath}/child.vhd`, {
    header: {
      parentUnicodeName: 'orphan.vhd',
      parentUuid: orphan.footer.uuid,
    },
  })

  let logged = ''
  const logInfo = message => {
    logged += message + '\n'
  }
  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, logInfo, logWarn: logInfo })
  let matched = logged.match(/deleting unused disk/g) || []
  assert.equal(matched.length, 1) // only one vhd should have been deleted

  // a missing vhd cause clean to remove all vhds
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({
      mode: 'delta',
      vhds: [
        `${relativePath}/deleted.vhd`, // in metadata but missing from disk
        `${relativePath}/orphan.vhd`,
        `${relativePath}/child.vhd`,
        // abandoned.vhd is not here anymore
      ],
    }),
    { flags: 'w' }
  )
  logged = ''
  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, logInfo, logWarn: () => {} })
  matched = logged.match(/deleting unused disk/g) || []
  assert.equal(matched.length, 2) // all vhds (orphan and  child  ) should have been deleted

  assert.ok(
    !(await handler.list(rootPath)).includes('cache.json.gz'),
    'cache.json.gz should not be created when none existed before the clean'
  )
})

test('it removes metadata and broken vhd when an active backup references a corrupt disk', async () => {
  // A VHD that exists on disk but is corrupted, openDisk will fail during lineage init
  await handler.writeFile(`${basePath}/broken.vhd`, 'I AM NOT A VHD')

  // Metadata references the corrupt VHD as if it were a valid active disk
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({
      mode: 'delta',
      vhds: [`${relativePath}/broken.vhd`],
    })
  )

  let logged = ''
  const logInfo = message => {
    logged += message
  }
  await VmBackupDirectory.cleanVm(handler, rootPath, {
    remove: true,
    logInfo: () => {},
    logWarn: logInfo,
  })

  assert.ok(logged.includes('disk check error'), 'should warn that the disk is broken')
  assert.ok(logged.includes('incremental backup is incomplete'), 'backup should be flagged as incomplete')

  // metadata removed because backup is incomplete
  assert.ok(!(await handler.list(rootPath)).includes('metadata.json'), 'metadata should be deleted')

  // broken VHD removed via the orphan path in lineage.clean()
  assert.deepEqual(await handler.list(basePath), [], 'broken VHD should be deleted')
})

test('it preserves all disks when multiple backups reference the same VDI directory', async () => {
  // Three delta backups share the same VDI directory: snapshot1 ← snapshot2 ← snapshot3.
  // Each snapshot is the active disk for exactly one backup metadata file.
  //
  // Regression guard for a shared-lineage bug: each VmIncrementalBackupArchive creates its
  // own RemoteDiskLineage for the same vdiDir; only the first archive's lineage reaches
  // RemoteDiskLineage.clean(). The second and third archives mark their disks as active on
  // their own (dead) lineage instances, so snapshot2 and snapshot3 appear orphaned and are
  // deleted — destroying two live backups.

  const snapshot1 = await generateVhd(`${basePath}/snapshot1.vhd`)
  const snapshot2 = await generateVhd(`${basePath}/snapshot2.vhd`, {
    header: { parentUnicodeName: 'snapshot1.vhd', parentUuid: snapshot1.footer.uuid },
  })
  await generateVhd(`${basePath}/snapshot3.vhd`, {
    header: { parentUnicodeName: 'snapshot2.vhd', parentUuid: snapshot2.footer.uuid },
  })

  await handler.writeFile(
    `${rootPath}/metadata1.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath}/snapshot1.vhd`] })
  )
  await handler.writeFile(
    `${rootPath}/metadata2.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath}/snapshot2.vhd`] })
  )
  await handler.writeFile(
    `${rootPath}/metadata3.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath}/snapshot3.vhd`] })
  )

  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, logWarn: () => {} })

  const remaining = await handler.list(basePath)
  assert.ok(remaining.includes('snapshot1.vhd'), 'snapshot1.vhd must survive (referenced by metadata1)')
  assert.ok(remaining.includes('snapshot2.vhd'), 'snapshot2.vhd must survive (referenced by metadata2)')
  assert.ok(remaining.includes('snapshot3.vhd'), 'snapshot3.vhd must survive (referenced by metadata3)')
  assert.equal(remaining.length, 3, 'no extra files should remain')

  // All three metadata files must also survive (all backups are complete)
  const rootFiles = await handler.list(rootPath)
  assert.ok(rootFiles.includes('metadata1.json'), 'metadata1.json must survive')
  assert.ok(rootFiles.includes('metadata2.json'), 'metadata2.json must survive')
  assert.ok(rootFiles.includes('metadata3.json'), 'metadata3.json must survive')
})

test('it handles multiple VDI directories independently', async () => {
  // vdiDir1: diskA1 (base) <- diskA2, plus an orphan
  const diskA1 = await generateVhd(`${basePath}/diskA1.vhd`)
  await generateVhd(`${basePath}/diskA2.vhd`, {
    header: { parentUnicodeName: 'diskA1.vhd', parentUuid: diskA1.footer.uuid },
  })
  await generateVhd(`${basePath}/orphanA.vhd`)

  // vdiDir2: diskB1 (base) <- diskB2, plus an orphan
  const diskB1 = await generateVhd(`${basePath2}/diskB1.vhd`)
  await generateVhd(`${basePath2}/diskB2.vhd`, {
    header: { parentUnicodeName: 'diskB1.vhd', parentUuid: diskB1.footer.uuid },
  })
  await generateVhd(`${basePath2}/orphanB.vhd`)

  // archive1 covers both base disks, archive2 covers both child disks
  await handler.writeFile(
    `${rootPath}/metadata1.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath}/diskA1.vhd`, `${relativePath2}/diskB1.vhd`] })
  )
  await handler.writeFile(
    `${rootPath}/metadata2.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath}/diskA2.vhd`, `${relativePath2}/diskB2.vhd`] })
  )

  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, logWarn: () => {} })

  const remaining1 = await handler.list(basePath)
  assert.ok(remaining1.includes('diskA1.vhd'), 'diskA1.vhd must survive (metadata1)')
  assert.ok(remaining1.includes('diskA2.vhd'), 'diskA2.vhd must survive (metadata2)')
  assert.ok(!remaining1.includes('orphanA.vhd'), 'orphanA.vhd must be deleted')

  const remaining2 = await handler.list(basePath2)
  assert.ok(remaining2.includes('diskB1.vhd'), 'diskB1.vhd must survive (metadata1)')
  assert.ok(remaining2.includes('diskB2.vhd'), 'diskB2.vhd must survive (metadata2)')
  assert.ok(!remaining2.includes('orphanB.vhd'), 'orphanB.vhd must be deleted')
})

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
    blocks: [0, 1],
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
  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, logInfo, logWarn: logInfo })

  logged = []
  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, merge: true, logInfo, logWarn: () => {} })
  assert.equal(logged.includes(`merging disk chain`), true)

  // merging is already tested in vhd-lib, don't retest it here (and theses vhd are as empty as my stomach at 12h12)
  // only check deletion
  const remainingVhds = await handler.list(basePath)
  assert.equal(remainingVhds.length, 2)
  assert.equal(remainingVhds.includes('child.vhd'), true)
  assert.equal(remainingVhds.includes('grandchild.vhd'), true)

  const metadata = JSON.parse(await handler.readFile(`${rootPath}/metadata.json`))
  assert.equal(metadata.size, 4299776, 'metadata.size should be updated after merge')
})

test('it merges a chain of multiple consecutive orphan ancestors in one pass', async () => {
  // ancestor -> child -> grandchild
  // only grandchild is referenced in metadata: both ancestor and child are orphans
  // they must be merged as a single 3-disk chain, not processed separately
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({
      mode: 'delta',
      size: 12000,
      vhds: [`${relativePath}/grandchild.vhd`],
    })
  )

  const ancestor = await generateVhd(`${basePath}/ancestor.vhd`)
  const child = await generateVhd(`${basePath}/child.vhd`, {
    header: { parentUnicodeName: 'ancestor.vhd', parentUuid: ancestor.footer.uuid },
  })
  await generateVhd(`${basePath}/grandchild.vhd`, {
    header: { parentUnicodeName: 'child.vhd', parentUuid: child.footer.uuid },
  })

  const mergeChains = []
  const logInfo = (message, opts) => {
    if (message === 'merging disk chain') mergeChains.push(opts.chain)
  }
  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, merge: true, logInfo, logWarn: () => {} })

  // all three disks must be handled in exactly one merge, not two separate operations
  assert.equal(mergeChains.length, 1, 'exactly one merge should occur for the full chain')
  assert.equal(mergeChains[0].length, 3, 'merge chain must include ancestor, child and grandchild')

  const remainingVhds = await handler.list(basePath)
  assert.equal(remainingVhds.includes('grandchild.vhd'), true)
  assert.equal(remainingVhds.includes('ancestor.vhd'), false, 'ancestor should have been merged, not deleted directly')
  assert.equal(remainingVhds.includes('child.vhd'), false)
})

test('it resumes, through cleanVm, an interrupted merge whose ancestor lost its footer', async () => {
  // Reproduces the production "footer1 !== footer2" failure end-to-end via the full cleanVm
  // pipeline. ancestor (full) <- child (differencing, the active backup).
  const ancestor = await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1] })
  await generateVhd(`${basePath}/child.vhd`, {
    header: { parentUnicodeName: 'ancestor.vhd', parentUuid: ancestor.footer.uuid },
    blocks: [2, 3, 4, 5],
  })
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({ mode: 'delta', size: 12000, vhds: [`${relativePath}/child.vhd`] })
  )

  // Simulate a merge killed mid-transfer: write 2 of the 4 child blocks into the ancestor
  // (which overwrites its end footer) then throw before mergeMetadata() rewrites the footer.
  // This leaves the ancestor footerless AND a `.merge.json` state file — the exact post-crash
  // state that makes cleanVm take the resume path.
  const parent = new RemoteVhdDisk({ handler, path: `${basePath}/ancestor.vhd` })
  const child = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd` })
  await parent.init({ force: false })
  await child.init({ force: false })
  const merger = new MergeRemoteDisk(handler, { removeUnused: true, writeStateDelay: 0 })
  let written = 0
  const realWriteBlock = parent.writeBlock.bind(parent)
  parent.writeBlock = async diskBlock => {
    if (written === 2) {
      throw new Error('simulated interruption')
    }
    written++
    return realWriteBlock(diskBlock)
  }
  await assert.rejects(merger.merge(parent, child), /simulated interruption/)

  assert.ok(
    (await handler.list(basePath)).includes('.ancestor.vhd.merge.json'),
    'an interrupted-merge state file should remain'
  )

  // Full pipeline: cleanVm must recognize the interrupted merge and resume it — opening the
  // footerless ancestor through the chain without throwing "footer1 !== footer2".
  await VmBackupDirectory.cleanVm(handler, rootPath, {
    remove: true,
    merge: true,
    logInfo: () => {},
    logWarn: () => {},
  })

  // The merge completed: the ancestor was consolidated into child.vhd and the state file is gone.
  const remaining = await handler.list(basePath)
  assert.equal(remaining.includes('.ancestor.vhd.merge.json'), false, 'state file removed after successful resume')
  assert.equal(remaining.includes('ancestor.vhd'), false, 'ancestor consolidated into the merge target')
  assert.equal(remaining.includes('child.vhd'), true, 'merge target remains')

  // No blocks lost: the resumed merge wrote the blocks (4, 5) that were never written before
  // the crash, so the consolidated disk holds the full set.
  const merged = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd` })
  await merged.init({ force: false })
  try {
    assert.deepEqual(merged.getBlockIndexes(), [0, 1, 2, 3, 4, 5], 'all blocks present after resumed merge')
  } finally {
    await merged.close()
  }

  // The backup is consistent, so its metadata is preserved.
  assert.ok((await handler.list(rootPath)).includes('metadata.json'), 'metadata should be preserved')
})

test('it does not warn "missing target of alias" for aliases deleted by merge', async () => {
  // Regression: RemoteDiskLineage.#cleanOrphanDataFiles iterated #diskPaths entries just
  // deleted during the same clean() call's merge phase, producing false "missing target of
  // alias" warnings
  const orphan = await generateVhd(`${basePath}/orphan.vhd`, {
    useAlias: true,
    blocks: [0],
  })
  await generateVhd(`${basePath}/child.vhd`, {
    useAlias: true,
    header: {
      parentUnicodeName: 'orphan.vhd.alias.vhd',
      parentUuid: orphan.footer.uuid,
    },
    blocks: [1],
  })

  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({
      mode: 'delta',
      vhds: [`${relativePath}/child.vhd.alias.vhd`],
    })
  )

  const warnings = []
  await VmBackupDirectory.cleanVm(handler, rootPath, {
    remove: true,
    merge: true,
    logWarn: (message, data) => warnings.push({ message, data }),
    logInfo: () => {},
  })

  const missingTargetWarnings = warnings.filter(w => w.message === 'missing target of alias')
  assert.equal(
    missingTargetWarnings.length,
    0,
    `"missing target of alias" must not fire after merge; got: ${JSON.stringify(missingTargetWarnings)}`
  )

  const remaining = await handler.list(basePath)
  assert.ok(!remaining.includes('orphan.vhd.alias.vhd'), 'orphan alias must be deleted after merge')
  assert.ok(remaining.includes('child.vhd.alias.vhd'), 'child alias must survive as merge target')
})

test('it resumes an interrupted merge with chain field', async () => {
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath}/child.vhd`] })
  )

  const ancestor = await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1, 2, 3, 4] })
  const intermediate = await generateVhd(`${basePath}/intermediate.vhd`, {
    header: { parentUnicodeName: 'ancestor.vhd', parentUuid: ancestor.footer.uuid },
    blocks: [5, 6],
  })
  await generateVhd(`${basePath}/child.vhd`, {
    header: { parentUnicodeName: 'intermediate.vhd', parentUuid: intermediate.footer.uuid },
    blocks: [7, 8],
  })

  await handler.writeFile(
    `${basePath}/.ancestor.vhd.merge.json`,
    JSON.stringify({
      parent: { uuid: '0' },
      child: { uuid: '0' },
      chain: ['ancestor.vhd', 'intermediate.vhd', 'child.vhd'],
      currentBlock: 3,
      mergedDataSize: 3 * 2 * 1024 * 1024,
      step: 'mergeBlocks',
      diskSize: 0,
    })
  )

  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, merge: true, logWarn: () => {} })

  const files = await handler.list(basePath)
  assert.ok(!files.some(f => f.endsWith('.merge.json')), 'merge state file should be deleted after successful resume')
  assert.ok(!files.includes('ancestor.vhd'), 'ancestor should be removed after merge')
  assert.ok(!files.includes('intermediate.vhd'), 'intermediate should be removed after merge')
  assert.ok(files.includes('child.vhd'), 'child (merge target) should survive')
})

test('it resumes an interrupted merge without chain field', async () => {
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({
      mode: 'delta',
      size: 209920,
      vhds: [`${relativePath}/orphan.vhd`, `${relativePath}/child.vhd`],
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
  // a merge in progress file
  await handler.writeFile(
    `${basePath}/.orphan.vhd.merge.json`,
    JSON.stringify({
      parent: {
        header: orphan.header.checksum,
      },
      child: {
        header: child.header.checksum,
      },
    })
  )

  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, merge: true, logWarn: () => {} })
  // merging is already tested in vhd-lib, don't retest it here (and theses vhd are as empty as my stomach at 12h12)

  // only check deletion
  const remainingVhds = await handler.list(basePath)
  assert.equal(remainingVhds.length, 1)
  assert.equal(remainingVhds.includes('child.vhd'), true)
})

// each of the vhd can be a file, a directory, an alias to a file or an alias to a directory
// the message and resulting files should be identical to the output with vhd files which is tested independently
describe('tests multiple combination ', { concurrency: 1 }, () => {
  for (const useAlias of [true, false]) {
    for (const vhdMode of ['file', 'directory']) {
      test(`alias : ${useAlias}, mode: ${vhdMode}`, async () => {
        // a broken VHD
        if (useAlias) {
          await handler.mkdir(basePath + '/data')
        }

        const brokenVhdDataPath = basePath + (useAlias ? '/data/broken.vhd' : '/broken.vhd')

        if (vhdMode === 'directory') {
          await handler.mkdir(brokenVhdDataPath)
        } else {
          await handler.writeFile(brokenVhdDataPath, 'notreallyavhd')
        }
        if (useAlias) {
          await VhdAbstract.createAlias(handler, 'broken.alias.vhd', brokenVhdDataPath)
        }

        // a vhd non referenced in metadata
        await generateVhd(`${basePath}/nonreference.vhd`, { useAlias, mode: vhdMode })
        // an abandoned delta vhd without its parent
        await generateVhd(`${basePath}/abandoned.vhd`, {
          useAlias,
          mode: vhdMode,
          header: {
            parentUnicodeName: 'gone.vhd',
            parentUuid: uniqueIdBuffer(),
          },
        })

        // an ancestor of a vhd present in metadata
        const ancestor = await generateVhd(`${basePath}/ancestor.vhd`, {
          useAlias,
          mode: vhdMode,
          blocks: [1, 3],
        })
        const child = await generateVhd(`${basePath}/child.vhd`, {
          useAlias,
          mode: vhdMode,
          header: {
            parentUnicodeName: 'ancestor.vhd' + (useAlias ? '.alias.vhd' : ''),
            parentUuid: ancestor.footer.uuid,
          },
          blocks: [1, 2],
        })
        // a grand child  vhd in metadata
        await generateVhd(`${basePath}/grandchild.vhd`, {
          useAlias,
          mode: vhdMode,
          header: {
            parentUnicodeName: 'child.vhd' + (useAlias ? '.alias.vhd' : ''),
            parentUuid: child.footer.uuid,
          },
          blocks: [2, 3],
        })

        // an older parent that was merging in clean
        const cleanAncestor = await generateVhd(`${basePath}/cleanAncestor.vhd`, {
          useAlias,
          mode: vhdMode,
        })
        // a clean  vhd in metadata
        const clean = await generateVhd(`${basePath}/clean.vhd`, {
          useAlias,
          mode: vhdMode,
          header: {
            parentUnicodeName: 'cleanAncestor.vhd' + (useAlias ? '.alias.vhd' : ''),
            parentUuid: cleanAncestor.footer.uuid,
          },
        })

        await handler.writeFile(
          `${basePath}/.cleanAncestor.vhd${useAlias ? '.alias.vhd' : ''}.merge.json`,
          JSON.stringify({
            parent: {
              header: cleanAncestor.header.checksum,
            },
            child: {
              header: clean.header.checksum,
            },
          })
        )

        // the metadata file
        await handler.writeFile(
          `${rootPath}/metadata.json`,
          JSON.stringify({
            mode: 'delta',
            vhds: [
              `${relativePath}/grandchild.vhd` + (useAlias ? '.alias.vhd' : ''), // grand child should not be merged
              `${relativePath}/child.vhd` + (useAlias ? '.alias.vhd' : ''),
              `${relativePath}/clean.vhd` + (useAlias ? '.alias.vhd' : ''),
            ],
          })
        )
        if (!useAlias && vhdMode === 'directory') {
          try {
            await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, merge: true, logWarn: () => {} })
          } catch (err) {
            assert.strictEqual(
              err.code,
              'NOT_SUPPORTED',
              'Merging directory without alias should raise a not supported error'
            )
            return
          }
          assert.strictEqual(true, false, 'Merging directory without alias should raise an error')
        }
        await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, merge: true, logWarn: () => {} })

        const metadata = JSON.parse(await handler.readFile(`${rootPath}/metadata.json`))
        // size should be the size of children + grand children + clean after the merge
        assert.deepEqual(metadata.size, 6501888)
        // no cache.json.gz existed before this run, so a merge must not create one
        assert.ok(
          !(await handler.list(rootPath)).includes('cache.json.gz'),
          'cache.json.gz should not be created when none existed before the merge'
        )

        // broken vhd, non referenced, abandoned should be deleted ( alias and data)
        // ancestor and child should be merged
        // grand child and clean vhd should not have changed
        const survivors = await handler.list(basePath)
        if (useAlias) {
          const dataSurvivors = await handler.list(basePath + '/data')
          // the goal of the alias : do not move a full folder
          assert.equal(dataSurvivors.includes('ancestor.vhd'), true)
          assert.equal(dataSurvivors.includes('grandchild.vhd'), true)
          assert.equal(dataSurvivors.includes('cleanAncestor.vhd'), true)
          assert.equal(survivors.includes('clean.vhd.alias.vhd'), true)
          assert.equal(survivors.includes('child.vhd.alias.vhd'), true)
          assert.equal(survivors.includes('grandchild.vhd.alias.vhd'), true)
          assert.equal(survivors.length, 4) // the 3 ok + data
          assert.equal(dataSurvivors.length, 3)
        } else {
          assert.equal(survivors.includes('clean.vhd'), true)
          assert.equal(survivors.includes('child.vhd'), true)
          assert.equal(survivors.includes('grandchild.vhd'), true)
          assert.equal(survivors.length, 3)
        }
      })
    }
  }
})
test('it cleans orphan merge states ', async () => {
  await handler.writeFile(`${basePath}/.orphan.vhd.merge.json`, '')
  // metadata is needed so the lineage is created for basePath (otherwise cleanOrphanDiskDirs deletes the whole dir)
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath}/nonexistent.vhd`] })
  )

  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, logWarn: () => {} })

  assert.deepEqual(await handler.list(basePath), [])
})

test('check all types of aliases, corrupted, missing or not', async () => {
  // valid alias pointing to an existing data file
  await handler.mkdir(`${basePath}/data`)
  await generateVhd(`${basePath}/data/ok.vhd`)
  await VhdAbstract.createAlias(handler, `${basePath}/ok.alias.vhd`, `${basePath}/data/ok.vhd`)

  // broken alias pointing to a missing data file
  await VhdAbstract.createAlias(handler, `${basePath}/missingData.alias.vhd`, `${basePath}/data/nonexistent.vhd`)

  // alias pointing to an existing but corrupt data file
  await handler.writeFile(`${basePath}/data/corrupt.vhd`, 'I AM NOT A VHD')
  await VhdAbstract.createAlias(handler, `${basePath}/corrupt.alias.vhd`, `${basePath}/data/corrupt.vhd`)

  // data file without alias
  await generateVhd(`${basePath}/data/missingalias.vhd`)

  // only the valid alias is referenced by a complete backup
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath}/ok.alias.vhd`] })
  )

  await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, logWarn: () => {}, logInfo: () => {} })

  // only ok.alias.vhd has survived
  const aliases = (await handler.list(basePath)).filter(f => f.endsWith('.vhd'))
  assert.equal(aliases.length, 1)
  assert.equal(aliases[0], 'ok.alias.vhd')

  // corrupt.vhd and missingalias.vhd must be gone
  const data = await handler.list(`${basePath}/data`)
  assert.equal(data.length, 1)
  assert.equal(data[0], 'ok.vhd')
})

test('it preserves VDI directory when handler.list() throws during lineage init', async () => {
  // Regression: when handler.list(vdiDir) threw (e.g. S3 404), the lineage
  // was never added to #uniqueLineages, so cleanOrphanDiskDirs treated the directory
  // as an orphan and deleted it with rmtree()
  await generateVhd(`${basePath}/snapshot.vhd`)
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath}/snapshot.vhd`] })
  )

  const originalList = handler.list.bind(handler)
  handler.list = async (path, opts) => {
    if (typeof path === 'string' && path.includes(vdiId)) {
      throw Object.assign(new Error('Simulated transient storage error'), { code: 'ENOENT' })
    }
    return originalList(path, opts)
  }

  try {
    await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, logWarn: () => {}, logInfo: () => {} })
  } finally {
    handler.list = originalList
  }

  const remaining = await handler.list(basePath)
  assert.ok(remaining.includes('snapshot.vhd'), 'VHD must survive when handler.list() throws during lineage init')
})

test('it does not create nor warn about the cache when none existed, even with a count mismatch', async () => {
  // a referenced disk + its metadata, but no cache.json.gz on disk
  await generateVhd(`${basePath}/diskA1.vhd`)
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath}/diskA1.vhd`] })
  )
  await assert.rejects(handler.readFile(`${rootPath}/cache.json.gz`), { code: 'ENOENT' })

  const logged = []
  // remove/merge both false: cacheNeedsRegen stays false and no merge happens,
  // so only a pre-existing cache's count mismatch could trigger regeneration
  await VmBackupDirectory.cleanVm(handler, rootPath, {
    remove: false,
    merge: false,
    logInfo: () => {},
    logWarn: message => logged.push(message),
  })

  assert.ok(!logged.includes('unexpected number of entries in backup cache'), 'no cache to be mismatched, no warning')
  await assert.rejects(handler.readFile(`${rootPath}/cache.json.gz`), { code: 'ENOENT' })
})

test('it regenerates a pre-existing cache after a merge', async () => {
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({
      mode: 'delta',
      size: 12000, // a size too small, the merge will fix it
      vhds: [`${relativePath}/grandchild.vhd`, `${relativePath}/child.vhd`],
    })
  )

  // one orphan, which is a full vhd, no parent
  const orphan = await generateVhd(`${basePath}/orphan.vhd`)
  // a child to the orphan, orphan will be merged into it
  const child = await generateVhd(`${basePath}/child.vhd`, {
    header: {
      parentUnicodeName: 'orphan.vhd',
      parentUuid: orphan.footer.uuid,
    },
    blocks: [0, 1],
  })
  await generateVhd(`${basePath}/grandchild.vhd`, {
    header: {
      parentUnicodeName: 'child.vhd',
      parentUuid: child.footer.uuid,
    },
  })

  // a cache with the expected number of entries: it is not out of sync, only the merge can trigger the regeneration
  await handler.writeFile(
    `${rootPath}/cache.json.gz`,
    await gzip(JSON.stringify({ [`/${rootPath}metadata.json`]: { size: 12000 } }))
  )

  const result = await VmBackupDirectory.cleanVm(handler, rootPath, {
    remove: true,
    merge: true,
    logInfo: () => {},
    logWarn: () => {},
  })

  const metadata = JSON.parse(await handler.readFile(`${rootPath}/metadata.json`))
  // size of child + grandchild after orphan has been merged into child
  assert.equal(metadata.size, 4299776, 'metadata.size should be updated after merge')
  assert.deepEqual(result.changedFiles, [`/${rootPath}metadata.json`], 'the rewritten metadata should be reported')

  const cache = JSON.parse((await gunzip(await handler.readFile(`${rootPath}/cache.json.gz`))).toString())
  assert.equal(Object.keys(cache).length, 1)
  assert.equal(Object.values(cache)[0].size, metadata.size, 'cache entry should carry the post-merge size')
})

test('it regenerates a pre-existing cache when its entry count is out of sync, even with nothing to merge/remove', async () => {
  // a referenced disk + its metadata, and a pre-existing cache with the wrong entry count
  await generateVhd(`${basePath}/diskA1.vhd`)
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath}/diskA1.vhd`] })
  )
  await handler.writeFile(`${rootPath}/cache.json.gz`, await gzip(JSON.stringify({})))

  const logged = []
  // remove/merge both false: cacheNeedsRegen stays false and no merge happens,
  // so only the cache-count mismatch can trigger the regeneration
  await VmBackupDirectory.cleanVm(handler, rootPath, {
    remove: false,
    merge: false,
    logInfo: () => {},
    logWarn: message => logged.push(message),
  })

  assert.ok(logged.includes('unexpected number of entries in backup cache'), 'mismatch should be reported')

  const cache = JSON.parse((await gunzip(await handler.readFile(`${rootPath}/cache.json.gz`))).toString())
  assert.equal(Object.keys(cache).length, 1, 'cache should be regenerated to match the archives on disk')
})

test('it regenerates a pre-existing cache after a metadata removal', async () => {
  // two backups, each on its own VDI directory, so removing one does not touch the other's disks
  await generateVhd(`${basePath}/diskA1.vhd`)
  await handler.writeFile(
    `${rootPath}/metadata1.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath}/diskA1.vhd`] })
  )
  // metadata2 references a vhd missing from disk: clean() removes it
  await handler.writeFile(
    `${rootPath}/metadata2.json`,
    JSON.stringify({ mode: 'delta', vhds: [`${relativePath2}/deleted.vhd`] })
  )

  // a cache with the expected number of entries: only the removal can trigger the regeneration
  await handler.writeFile(
    `${rootPath}/cache.json.gz`,
    await gzip(
      JSON.stringify({
        [`/${rootPath}metadata1.json`]: { stale: true },
        [`/${rootPath}metadata2.json`]: { stale: true },
      })
    )
  )

  const logged = []
  await VmBackupDirectory.cleanVm(handler, rootPath, {
    remove: true,
    merge: false,
    logInfo: () => {},
    logWarn: message => logged.push(message),
  })

  const rootFiles = await handler.list(rootPath)
  assert.ok(rootFiles.includes('metadata1.json'), 'the complete backup must survive')
  assert.ok(!rootFiles.includes('metadata2.json'), 'the backup with a missing vhd must be removed')
  assert.ok(rootFiles.includes('cache.json.gz'), 'an existing cache.json.gz must not be dropped by a remove')
  assert.ok(
    !logged.includes('unexpected number of entries in backup cache'),
    'the cache matched the archives before the clean: the removal alone must trigger the regeneration'
  )

  const cache = JSON.parse((await gunzip(await handler.readFile(`${rootPath}/cache.json.gz`))).toString())
  assert.deepEqual(
    Object.keys(cache),
    [`/${rootPath}metadata1.json`],
    'the removed backup must be gone from the regenerated cache'
  )
  assert.equal(cache[`/${rootPath}metadata1.json`].stale, undefined, 'the entry must come from the archive on disk')
})

// ---------------------------------------------------------------------------------------------
// abort of the clean and of the merge (XO-3353)
//
// `signal` stops `cleanVm()` and `MergeRemoteDisk` between two operations. An aborted merge keeps its
// state file, and the next clean resumes it: the result must be the one of a merge never interrupted.

const MERGE_FORMATS = [
  { name: 'VHD files', opts: {} },
  { name: 'VHD directories with alias', opts: { mode: 'directory', useAlias: true } },
]

// a merge between two VHD directories moves the blocks out of the child instead of copying them
const isMovingBlocks = opts => opts.mode === 'directory'

// ancestor (blocks 0, 1) <- child (blocks 2 to 5), the child being the only backup listed in metadata. `prefix`
// names the disks of a second chain in the same directory
async function createMergeChain(root, relative, { mode, useAlias, prefix = '' } = {}) {
  const base = `${root}/${relative}`
  await fs.mkdirp(`${tempDir}/${base}`)
  const ext = useAlias ? '.alias.vhd' : ''
  const ancestor = await generateVhd(`${base}/${prefix}ancestor.vhd`, { mode, useAlias, blocks: [0, 1] })
  await generateVhd(`${base}/${prefix}child.vhd`, {
    mode,
    useAlias,
    header: { parentUnicodeName: `${prefix}ancestor.vhd` + ext, parentUuid: ancestor.footer.uuid },
    blocks: [2, 3, 4, 5],
  })
  return {
    base,
    ancestorPath: `${base}/${prefix}ancestor.vhd${ext}`,
    childPath: `${base}/${prefix}child.vhd${ext}`,
    listed: `${relative}/${prefix}child.vhd${ext}`,
    stateFile: `${base}/.${prefix}ancestor.vhd${ext}.merge.json`,
  }
}

const exists = async path => (await handler.list(dirname(path))).includes(basename(path))

async function writeMetadata(root, chains) {
  await handler.writeFile(
    `${root}/metadata.json`,
    JSON.stringify({ mode: 'delta', size: 12000, vhds: chains.map(_ => _.listed) })
  )
}

async function openMergeDisks({ ancestorPath, childPath }, { force = false } = {}) {
  const parent = new RemoteVhdDisk({ handler, path: ancestorPath })
  const child = new RemoteVhdDisk({ handler, path: childPath })
  await parent.init({ force })
  await child.init({ force })
  return { parent, child }
}

// the aborts the merge after `n` blocks have been merged into the parent
function abortAfterBlocks(parent, n, controller) {
  const mergeBlock = parent.mergeBlock.bind(parent)
  let merged = 0
  parent.mergeBlock = async (...args) => {
    const size = await mergeBlock(...args)
    if (++merged === n) {
      controller.abort()
    }
    return size
  }
}

async function digestBlocks(disks, indexes) {
  const digest = {}
  for (const index of indexes) {
    const disk = disks.find(disk => disk.hasBlock(index))
    if (disk !== undefined) {
      digest[index] = createHash('md5')
        .update((await disk.readBlock(index)).data)
        .digest('hex')
    }
  }
  return digest
}

// what a restore of the backup reads: each block comes from the child, or else from its ancestor
async function readChain({ ancestorPath, childPath }) {
  const { parent, child } = await openMergeDisks({ ancestorPath, childPath }, { force: true })
  try {
    return await digestBlocks([child, parent], [0, 1, 2, 3, 4, 5])
  } finally {
    await parent.close()
    await child.close()
  }
}

async function readMerged(childPath) {
  const merged = new RemoteVhdDisk({ handler, path: childPath })
  await merged.init({ force: false })
  try {
    assert.deepEqual(merged.getBlockIndexes(), [0, 1, 2, 3, 4, 5])
    return await digestBlocks([merged], [0, 1, 2, 3, 4, 5])
  } finally {
    await merged.close()
  }
}

// the data of a merge never interrupted, on a chain of the same shape
async function referenceDigest(format) {
  const root = 'xo-vm-backups/REFERENCE'
  const chain = await createMergeChain(root, `vdis/${jobId}/${uniqueId()}`, format)
  await writeMetadata(root, [chain])
  await VmBackupDirectory.cleanVm(handler, root, { remove: true, merge: true, logInfo: () => {}, logWarn: () => {} })
  return readMerged(chain.childPath)
}

async function assertMergeCompleted(chain, expected) {
  const files = await handler.list(chain.base)
  assert.equal(files.includes(basename(chain.stateFile)), false, 'the merge state is removed')
  assert.equal(await exists(chain.ancestorPath), false, 'the ancestor is consolidated in the child')
  assert.deepEqual(await readMerged(chain.childPath), expected, 'same data as a merge never interrupted')
}

const resumeMerge = () =>
  VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, merge: true, logInfo: () => {}, logWarn: () => {} })

for (const { name, opts } of MERGE_FORMATS) {
  describe(`MergeRemoteDisk, abort (${name})`, () => {
    test('stops before the first block and changes nothing', async () => {
      const chain = await createMergeChain(rootPath, relativePath, opts)
      await writeMetadata(rootPath, [chain])
      const before = await readChain(chain)

      const controller = new AbortController()
      controller.abort()
      const { parent, child } = await openMergeDisks(chain)
      const merger = new MergeRemoteDisk(handler, { removeUnused: true, writeStateDelay: 0, signal: controller.signal })
      await assert.rejects(merger.merge(parent, child), { name: 'AbortError' })
      await parent.close()
      await child.close()

      assert.equal(await exists(chain.stateFile), false, 'no state is written: nothing was merged')
      assert.deepEqual(await readChain(chain), before)
    })

    for (const concurrency of isMovingBlocks(opts) ? [] : [1, 2]) {
      for (const blocks of [1, 2]) {
        test(`stops after ${blocks} block(s) with a concurrency of ${concurrency}, keeps its state, resumes`, async () => {
          const expected = await referenceDigest(opts)
          const chain = await createMergeChain(rootPath, relativePath, opts)
          await writeMetadata(rootPath, [chain])
          const before = await readChain(chain)

          const controller = new AbortController()
          const { parent, child } = await openMergeDisks(chain)
          abortAfterBlocks(parent, blocks, controller)
          const progress = []
          const merger = new MergeRemoteDisk(handler, {
            removeUnused: true,
            writeStateDelay: 0,
            mergeBlockConcurrency: concurrency,
            signal: controller.signal,
            onProgress: _ => progress.push(_),
          })
          await assert.rejects(merger.merge(parent, child), { name: 'AbortError' })

          const { done, total } = progress.at(-1)
          assert.ok(done < total, `the progress of a stopped merge is not 100% (${done} / ${total})`)

          const state = JSON.parse(await handler.readFile(chain.stateFile))
          assert.equal(state.step, 'mergeBlocks')
          assert.equal(typeof state.currentBlock, 'number')
          assert.equal(await exists(chain.ancestorPath), true, 'the ancestor is not removed')
          assert.deepEqual(await readChain(chain), before, 'the backup is still restorable before the resume')

          await resumeMerge()
          await assertMergeCompleted(chain, expected)
        })
      }
    }

    // the blocks are moved out of the child, the disk of the listed backup, which cannot be read until the merge has
    // completed: the merge is not stopped once a block has moved, including after the last one
    for (const concurrency of isMovingBlocks(opts) ? [1, 2] : []) {
      for (const blocks of [1, 2, 4]) {
        test(`does not stop after ${blocks} block(s) with a concurrency of ${concurrency}, completes`, async () => {
          const expected = await referenceDigest(opts)
          const chain = await createMergeChain(rootPath, relativePath, opts)
          await writeMetadata(rootPath, [chain])

          const controller = new AbortController()
          const { parent, child } = await openMergeDisks(chain)
          abortAfterBlocks(parent, blocks, controller)
          const merger = new MergeRemoteDisk(handler, {
            removeUnused: true,
            writeStateDelay: 0,
            mergeBlockConcurrency: concurrency,
            signal: controller.signal,
          })
          await merger.merge(parent, child)

          assert.equal(controller.signal.aborted, true)
          await assertMergeCompleted(chain, expected)
        })
      }
    }

    // what the abort leaves behind is what a failure in the middle of the blocks leaves: the abort adds no new state
    for (const concurrency of [1, 2]) {
      for (const blocks of [1, 2, 3]) {
        test(`resumes a merge that failed after ${blocks} block(s) with a concurrency of ${concurrency}`, async () => {
          const expected = await referenceDigest(opts)
          const chain = await createMergeChain(rootPath, relativePath, opts)
          await writeMetadata(rootPath, [chain])

          const { parent, child } = await openMergeDisks(chain)
          const mergeBlock = parent.mergeBlock.bind(parent)
          let merged = 0
          parent.mergeBlock = async (...args) => {
            if (merged === blocks) {
              throw new Error('simulated interruption')
            }
            ++merged
            return mergeBlock(...args)
          }
          const merger = new MergeRemoteDisk(handler, {
            removeUnused: true,
            writeStateDelay: 0,
            mergeBlockConcurrency: concurrency,
          })
          await assert.rejects(merger.merge(parent, child), /simulated interruption/)

          await resumeMerge()
          await assertMergeCompleted(chain, expected)
        })
      }
    }

    test('stops after the last block, before the metadata, and resumes', { skip: isMovingBlocks(opts) }, async () => {
      const expected = await referenceDigest(opts)
      const chain = await createMergeChain(rootPath, relativePath, opts)
      await writeMetadata(rootPath, [chain])

      const controller = new AbortController()
      const { parent, child } = await openMergeDisks(chain)
      abortAfterBlocks(parent, 4, controller)
      const merger = new MergeRemoteDisk(handler, { removeUnused: true, writeStateDelay: 0, signal: controller.signal })
      await assert.rejects(merger.merge(parent, child), { name: 'AbortError' })

      assert.equal(JSON.parse(await handler.readFile(chain.stateFile)).step, 'mergeBlocks')
      assert.equal(await exists(chain.ancestorPath), true)

      await resumeMerge()
      await assertMergeCompleted(chain, expected)
    })

    test('does not stop once the metadata of the parent is written', async () => {
      const expected = await referenceDigest(opts)
      const chain = await createMergeChain(rootPath, relativePath, opts)
      await writeMetadata(rootPath, [chain])

      const controller = new AbortController()
      const { parent, child } = await openMergeDisks(chain)
      // the parent now carries the uuid of the child while the state still says `mergeBlocks`: the next clean would
      // not resume the merge but remove the parent
      const mergeMetadata = parent.mergeMetadata.bind(parent)
      parent.mergeMetadata = async (...args) => {
        await mergeMetadata(...args)
        controller.abort()
      }
      const merger = new MergeRemoteDisk(handler, { removeUnused: true, writeStateDelay: 0, signal: controller.signal })
      await merger.merge(parent, child)

      await assertMergeCompleted(chain, expected)
    })

    test('does not stop inside its final step', async () => {
      const expected = await referenceDigest(opts)
      const chain = await createMergeChain(rootPath, relativePath, opts)
      await writeMetadata(rootPath, [chain])

      const controller = new AbortController()
      const { parent, child } = await openMergeDisks(chain)
      // the signal is aborted while the merged disks are removed and the result renamed
      const unlink = child.unlink.bind(child)
      child.unlink = async (...args) => {
        controller.abort()
        return unlink(...args)
      }
      const merger = new MergeRemoteDisk(handler, { removeUnused: true, writeStateDelay: 0, signal: controller.signal })
      await merger.merge(parent, child)

      await assertMergeCompleted(chain, expected)
    })

    test('resumes after two aborts at different points', { skip: isMovingBlocks(opts) }, async () => {
      const expected = await referenceDigest(opts)
      const chain = await createMergeChain(rootPath, relativePath, opts)
      await writeMetadata(rootPath, [chain])

      for (const force of [false, true]) {
        const controller = new AbortController()
        const { parent, child } = await openMergeDisks(chain, { force })
        abortAfterBlocks(parent, 1, controller)
        const merger = new MergeRemoteDisk(handler, {
          removeUnused: true,
          writeStateDelay: 0,
          mergeBlockConcurrency: 1,
          signal: controller.signal,
        })
        await assert.rejects(merger.merge(parent, child), { name: 'AbortError' })
      }

      await resumeMerge()
      await assertMergeCompleted(chain, expected)
    })
  })
}

describe('cleanVm, abort', () => {
  test('with an already aborted signal removes and merges nothing', async () => {
    const chain = await createMergeChain(rootPath, relativePath)
    await generateVhd(`${chain.base}/abandoned.vhd`, {
      header: { parentUnicodeName: 'gone.vhd', parentUuid: uniqueIdBuffer() },
    })
    await writeMetadata(rootPath, [chain])
    const before = (await handler.list(chain.base)).sort()

    const controller = new AbortController()
    controller.abort()
    await assert.rejects(
      VmBackupDirectory.cleanVm(handler, rootPath, {
        remove: true,
        merge: true,
        signal: controller.signal,
        logInfo: () => {},
        logWarn: () => {},
      }),
      { name: 'AbortError' }
    )

    assert.deepEqual((await handler.list(chain.base)).sort(), before)
  })

  test('stops removing the unused disks once aborted', async () => {
    const chain = await createMergeChain(rootPath, relativePath)
    const abandoned = []
    for (let i = 0; i < 8; i++) {
      abandoned.push(`abandoned${i}.vhd`)
      await generateVhd(`${chain.base}/abandoned${i}.vhd`, {
        header: { parentUnicodeName: 'gone.vhd', parentUuid: uniqueIdBuffer() },
      })
    }
    await writeMetadata(rootPath, [chain])

    const controller = new AbortController()
    const logInfo = message => {
      if (message === 'deleting unused disk') {
        controller.abort()
      }
    }
    // slow removals: the clean must not reject, and its caller release the lock, while one of them still runs
    const events = []
    const unlink = handler.unlink.bind(handler)
    handler.unlink = async (...args) => {
      await new Promise(resolve => setTimeout(resolve, 20))
      await unlink(...args)
      events.push('removed')
    }
    await assert.rejects(
      VmBackupDirectory.cleanVm(handler, rootPath, {
        remove: true,
        signal: controller.signal,
        logInfo,
        logWarn: () => {},
      }).finally(() => events.push('rejected')),
      { name: 'AbortError' }
    )
    // leaves a removal still running the time to end
    await new Promise(resolve => setTimeout(resolve, 100))
    handler.unlink = unlink
    assert.equal(events.at(-1), 'rejected', 'no removal ends after the clean has rejected')

    const remaining = (await handler.list(chain.base)).filter(file => abandoned.includes(file))
    assert.ok(remaining.length > 0, 'the disks not yet removed are left to the next clean')

    // the next clean, not aborted, removes the leftovers
    await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, logInfo: () => {}, logWarn: () => {} })
    assert.deepEqual(
      (await handler.list(chain.base)).filter(file => abandoned.includes(file)),
      []
    )
  })

  test('does not merge the chains that were still to be merged, and the next clean does', async () => {
    const chain1 = await createMergeChain(rootPath, relativePath)
    const chain2 = await createMergeChain(rootPath, relativePath2)
    await writeMetadata(rootPath, [chain1, chain2])

    const controller = new AbortController()
    const merged = []
    const logInfo = (message, data) => {
      if (message === 'merging disk chain') {
        merged.push(data.chain)
        controller.abort()
      }
    }
    await assert.rejects(
      VmBackupDirectory.cleanVm(handler, rootPath, {
        remove: true,
        merge: true,
        signal: controller.signal,
        logInfo,
        logWarn: () => {},
      }),
      { name: 'AbortError' }
    )
    assert.equal(merged.length, 1, 'only the merge that was running is started')

    // the chain whose merge never started is untouched
    const untouched = merged[0].some(path => path.includes(vdiId2)) ? chain1 : chain2
    assert.equal(await exists(untouched.ancestorPath), true)
    assert.equal(await exists(untouched.stateFile), false)

    await resumeMerge()
    for (const chain of [chain1, chain2]) {
      assert.equal(await exists(chain.ancestorPath), false)
      assert.equal(await exists(chain.stateFile), false)
    }
  })

  test('stops between two backups while it loads them', async () => {
    for (const name of ['a', 'b', 'c']) {
      await handler.writeFile(`${rootPath}/${name}.xva`, 'xva')
      await handler.writeFile(`${rootPath}/${name}.json`, JSON.stringify({ mode: 'full', xva: `./${name}.xva` }))
    }
    const before = (await handler.list(rootPath)).sort()

    const controller = new AbortController()
    let read = 0
    const readFile = handler.readFile.bind(handler)
    handler.readFile = async (path, ...args) => {
      if (String(path).endsWith('.json')) {
        ++read
        controller.abort()
      }
      return readFile(path, ...args)
    }
    await assert.rejects(
      VmBackupDirectory.cleanVm(handler, rootPath, {
        remove: true,
        merge: true,
        signal: controller.signal,
        logInfo: () => {},
        logWarn: () => {},
      }),
      { name: 'AbortError' }
    )
    handler.readFile = readFile

    assert.equal(read, 1, 'the other backups are not loaded')
    assert.deepEqual((await handler.list(rootPath)).sort(), before)
  })

  test('does not stop once it removes the incomplete backups, so that the cache does not list them', async () => {
    const chain = await createMergeChain(rootPath, relativePath)
    await writeMetadata(rootPath, [chain])
    // an incomplete backup: its disk is missing
    await handler.writeFile(
      `${rootPath}/incomplete.json`,
      JSON.stringify({ mode: 'delta', vhds: [`${relativePath2}/gone.vhd`] })
    )
    await handler.writeFile(
      `${rootPath}/cache.json.gz`,
      await gzip(JSON.stringify({ [`/${rootPath}metadata.json`]: {}, [`/${rootPath}incomplete.json`]: {} }))
    )

    const controller = new AbortController()
    const unlink = handler.unlink.bind(handler)
    handler.unlink = async (path, ...args) => {
      await unlink(path, ...args)
      if (String(path).endsWith('incomplete.json')) {
        controller.abort()
      }
    }
    const result = await VmBackupDirectory.cleanVm(handler, rootPath, {
      remove: true,
      merge: true,
      signal: controller.signal,
      logInfo: () => {},
      logWarn: () => {},
    })
    handler.unlink = unlink

    assert.equal(controller.signal.aborted, true)
    assert.ok(
      result.removedFiles.some(file => file.endsWith('incomplete.json')),
      'the removal is reported'
    )
    const cache = JSON.parse((await gunzip(await handler.readFile(`${rootPath}/cache.json.gz`))).toString())
    assert.deepEqual(Object.keys(cache), [`/${rootPath}metadata.json`])
  })
})

describe('cleanVm, abort during a merge of VHD directories', () => {
  test('completes the merge once a block has moved, the backup stays restorable', async () => {
    const opts = { mode: 'directory', useAlias: true }
    const expected = await referenceDigest(opts)
    const chain = await createMergeChain(rootPath, relativePath, opts)
    await writeMetadata(rootPath, [chain])

    const controller = new AbortController()
    const rename = handler.rename.bind(handler)
    handler.rename = async (from, ...args) => {
      await rename(from, ...args)
      if (String(from).includes('/blocks/')) {
        controller.abort()
      }
    }
    await VmBackupDirectory.cleanVm(handler, rootPath, {
      remove: true,
      merge: true,
      signal: controller.signal,
      logInfo: () => {},
      logWarn: () => {},
    }).finally(() => {
      handler.rename = rename
    })

    assert.equal(controller.signal.aborted, true)
    await assertMergeCompleted(chain, expected)
  })
})

// A merge that completes after the signal is aborted has removed its state: the next clean would not know about it,
// so the clean that ran it must update the metadata of its backup (size, disks no longer differencing)

// the metadata of a delta backup of one VDI per chain, before any merge
async function writeDeltaMetadata(path, chains) {
  const vhds = {}
  const vdis = {}
  const isVhdDifferencing = {}
  chains.forEach((chain, i) => {
    vhds[`vdi${i}`] = chain.listed
    vdis[`vdi${i}`] = {}
    isVhdDifferencing[`vdi${i}`] = true
  })
  await handler.writeFile(path, JSON.stringify({ mode: 'delta', size: 12000, vhds, vdis, isVhdDifferencing }))
}

const readMetadata = async path => JSON.parse(await handler.readFile(path))

// aborts the signal when a merge starts its final step (removal of the merged disks, rename of the result), which is
// not stopped: the merge completes
function abortAtFinalStep(controller) {
  const writeFile = handler.writeFile.bind(handler)
  handler.writeFile = async (path, data, ...args) => {
    if (String(path).endsWith('.merge.json') && JSON.parse(data).step === 'cleanup') {
      controller.abort()
    }
    return writeFile(path, data, ...args)
  }
  return () => {
    handler.writeFile = writeFile
  }
}

const cleanWithSignal = signal =>
  VmBackupDirectory.cleanVm(handler, rootPath, {
    remove: true,
    merge: true,
    signal,
    logInfo: () => {},
    logWarn: () => {},
  })

for (const { name, opts } of MERGE_FORMATS) {
  describe(`cleanVm, abort once a merge has completed (${name})`, () => {
    test('updates the metadata of the merged backup', async () => {
      // the metadata of a merge never interrupted, on a backup of the same shape
      const referenceRoot = 'xo-vm-backups/REFERENCE'
      const reference = await createMergeChain(referenceRoot, `vdis/${jobId}/${uniqueId()}`, opts)
      await writeDeltaMetadata(`${referenceRoot}/metadata.json`, [reference])
      await VmBackupDirectory.cleanVm(handler, referenceRoot, {
        remove: true,
        merge: true,
        logInfo: () => {},
        logWarn: () => {},
      })
      const expected = await readMetadata(`${referenceRoot}/metadata.json`)

      const chain = await createMergeChain(rootPath, relativePath, opts)
      await writeDeltaMetadata(`${rootPath}/metadata.json`, [chain])

      const controller = new AbortController()
      const restore = abortAtFinalStep(controller)
      await cleanWithSignal(controller.signal).finally(restore)

      assert.equal(controller.signal.aborted, true)
      assert.equal(await exists(chain.stateFile), false, 'the merge has completed')
      const metadata = await readMetadata(`${rootPath}/metadata.json`)
      assert.deepEqual(metadata.isVhdDifferencing, { vdi0: false })
      assert.equal(metadata.size, expected.size)
    })

    test('does not update a backup whose other disk has its merge left, the next clean does', async () => {
      const chains = [
        await createMergeChain(rootPath, relativePath, opts),
        await createMergeChain(rootPath, relativePath2, opts),
      ]
      await writeDeltaMetadata(`${rootPath}/metadata.json`, chains)

      const controller = new AbortController()
      const restore = abortAtFinalStep(controller)
      await cleanWithSignal(controller.signal).finally(restore)

      const left = []
      for (const chain of chains) {
        if (await exists(chain.ancestorPath)) {
          left.push(chain)
        }
      }
      assert.equal(left.length, 1, 'the merge running completes, the other one does not start')
      // updated now, it would mark the disk still to merge as not differencing
      const metadata = await readMetadata(`${rootPath}/metadata.json`)
      assert.equal(metadata.size, 12000)
      assert.deepEqual(metadata.isVhdDifferencing, { vdi0: true, vdi1: true })

      await resumeMerge()
      assert.equal(await exists(left[0].ancestorPath), false)
      assert.deepEqual((await readMetadata(`${rootPath}/metadata.json`)).isVhdDifferencing, {
        vdi0: false,
        vdi1: false,
      })
    })

    test('updates the backup whose merge has completed, not the one whose merge is left', async () => {
      // two backups whose disks are in the same VDI directory
      const chains = [
        await createMergeChain(rootPath, relativePath, opts),
        await createMergeChain(rootPath, relativePath, { ...opts, prefix: 'other-' }),
      ]
      await writeDeltaMetadata(`${rootPath}/metadata0.json`, [chains[0]])
      await writeDeltaMetadata(`${rootPath}/metadata1.json`, [chains[1]])

      const controller = new AbortController()
      const restore = abortAtFinalStep(controller)
      await cleanWithSignal(controller.signal).finally(restore)

      const merged = []
      for (const [i, chain] of chains.entries()) {
        const isMerged = !(await exists(chain.ancestorPath))
        if (isMerged) {
          merged.push(i)
        }
        assert.deepEqual(
          (await readMetadata(`${rootPath}/metadata${i}.json`)).isVhdDifferencing,
          { vdi0: !isMerged },
          `backup ${i}`
        )
      }
      assert.equal(merged.length, 1, 'the merge running completes, the other one does not start')

      await resumeMerge()
      for (const i of [0, 1]) {
        assert.deepEqual((await readMetadata(`${rootPath}/metadata${i}.json`)).isVhdDifferencing, { vdi0: false })
      }
    })
  })
}
