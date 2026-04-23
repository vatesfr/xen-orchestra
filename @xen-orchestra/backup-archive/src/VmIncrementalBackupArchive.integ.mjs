import test from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
// eslint-disable-next-line n/no-missing-import
import { VmBackupDirectory } from '../dist/VmBackupDirectory.mjs'
import { VHDFOOTER, VHDHEADER } from './tests.fixtures.mjs'
import { VhdFile, Constants, VhdDirectory, VhdAbstract } from 'vhd-lib'
import { dirname, basename } from 'node:path'
import { rimraf } from 'rimraf'

const { beforeEach, afterEach, describe } = test

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
    (await handler.list(rootPath)).includes('cache.json.gz'),
    'cache.json.gz should be regenerated after metadata deletion'
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
  assert.equal(logged[0], `Disk chain needs merging`)

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
  assert.equal(metadata.size, 104448, 'metadata.size should be updated after merge')
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
        assert.deepEqual(metadata.size, 4404224)
        // cache.json.gz must be regenerated when metadata changes after a merge
        assert.ok(
          (await handler.list(rootPath)).includes('cache.json.gz'),
          'cache.json.gz should be regenerated after a merge'
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
