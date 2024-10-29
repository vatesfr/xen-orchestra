import test from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { RemoteAdapter } from './RemoteAdapter.mjs'
import { VHDFOOTER, VHDHEADER } from './tests.fixtures.mjs'
import { VhdFile, Constants, VhdDirectory, VhdAbstract } from 'vhd-lib'
import { checkAliases } from './_cleanVm.mjs'
import { dirname, basename } from 'node:path'
import { rimraf } from 'rimraf'

const { beforeEach, afterEach, describe } = test

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

test('It remove broken vhd', async () => {
  // todo also tests a directory and an alias

  await handler.writeFile(`${basePath}/notReallyAVhd.vhd`, 'I AM NOT A VHD')
  assert.equal((await handler.list(basePath)).length, 1)
  let loggued = ''
  const logInfo = message => {
    loggued += message
  }
  await adapter.cleanVm(rootPath, { remove: false, logInfo, logWarn: logInfo, lock: false })
  assert.equal(loggued, `VHD check error`)
  // not removed
  assert.deepEqual(await handler.list(basePath), ['notReallyAVhd.vhd'])
  // really remove it
  await adapter.cleanVm(rootPath, { remove: true, logInfo, logWarn: () => {}, lock: false })
  assert.deepEqual(await handler.list(basePath), [])
})

test('it remove vhd with missing or multiple ancestors', async () => {
  // one with a broken parent, should be deleted
  await generateVhd(`${basePath}/abandonned.vhd`, {
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
    `metadata.json`,
    JSON.stringify({
      mode: 'delta',
      vhds: [`${basePath}/child.vhd`, `${basePath}/abandonned.vhd`],
    }),
    { flags: 'w' }
  )
  // clean
  let loggued = ''
  const logInfo = message => {
    loggued += message + '\n'
  }
  await adapter.cleanVm(rootPath, { remove: true, logInfo, logWarn: logInfo, lock: false })

  const deletedOrphanVhd = loggued.match(/deleting orphan VHD/g) || []
  assert.equal(deletedOrphanVhd.length, 1) // only one vhd should have been deleted

  // we don't test the filew on disk, since they will all be marker as unused and deleted without a metadata.json file
})

test('it remove backup meta data referencing a missing vhd in delta backup', async () => {
  // create a metadata file marking child and orphan as ok
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({
      mode: 'delta',
      vhds: [
        `${relativePath}/orphan.vhd`,
        `${relativePath}/child.vhd`,
        // abandonned.json is not here
      ],
    })
  )

  await generateVhd(`${basePath}/abandonned.vhd`)

  // one orphan, which is a full vhd, no parent
  const orphan = await generateVhd(`${basePath}/orphan.vhd`)

  // a child to the orphan
  await generateVhd(`${basePath}/child.vhd`, {
    header: {
      parentUnicodeName: 'orphan.vhd',
      parentUuid: orphan.footer.uuid,
    },
  })

  let loggued = ''
  const logInfo = message => {
    loggued += message + '\n'
  }
  await adapter.cleanVm(rootPath, { remove: true, logInfo, logWarn: logInfo, lock: false })
  let matched = loggued.match(/deleting unused VHD/g) || []
  assert.equal(matched.length, 1) // only one vhd should have been deleted

  // a missing vhd cause clean to remove all vhds
  await handler.writeFile(
    `${rootPath}/metadata.json`,
    JSON.stringify({
      mode: 'delta',
      vhds: [
        `deleted.vhd`, // in metadata but not in vhds
        `orphan.vhd`,
        `child.vhd`,
        // abandonned.vhd is not here anymore
      ],
    }),
    { flags: 'w' }
  )
  loggued = ''
  await adapter.cleanVm(rootPath, { remove: true, logInfo, logWarn: () => {}, lock: false })
  matched = loggued.match(/deleting unused VHD/g) || []
  assert.equal(matched.length, 2) // all vhds (orphan and  child  ) should have been deleted
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

  let loggued = []
  const logInfo = message => {
    loggued.push(message)
  }
  await adapter.cleanVm(rootPath, { remove: true, logInfo, logWarn: logInfo, lock: false })
  assert.equal(loggued[0], `unexpected number of entries in backup cache`)

  loggued = []
  await adapter.cleanVm(rootPath, { remove: true, merge: true, logInfo, logWarn: () => {}, lock: false })
  const [merging] = loggued
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

test('it finish unterminated merge ', async () => {
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

  await adapter.cleanVm(rootPath, { remove: true, merge: true, logWarn: () => {}, lock: false })
  // merging is already tested in vhd-lib, don't retest it here (and theses vhd are as empty as my stomach at 12h12)

  // only check deletion
  const remainingVhds = await handler.list(basePath)
  assert.equal(remainingVhds.length, 1)
  assert.equal(remainingVhds.includes('child.vhd'), true)
})

// each of the vhd can be a file, a directory, an alias to a file or an alias to a directory
// the message an resulting files should be identical to the output with vhd files which is tested independantly

describe('tests multiple combination ', () => {
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

        // a vhd non referenced in metada
        await generateVhd(`${basePath}/nonreference.vhd`, { useAlias, mode: vhdMode })
        // an abandonded delta vhd without its parent
        await generateVhd(`${basePath}/abandonned.vhd`, {
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
            await adapter.cleanVm(rootPath, { remove: true, merge: true, logWarn: () => {}, lock: false })
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
        await adapter.cleanVm(rootPath, { remove: true, merge: true, logWarn: () => {}, lock: false })

        const metadata = JSON.parse(await handler.readFile(`${rootPath}/metadata.json`))
        // size should be the size of children + grand children + clean after the merge
        assert.deepEqual(metadata.size, vhdMode === 'file' ? 6502400 : 6501888)

        // broken vhd, non referenced, abandonned should be deleted ( alias and data)
        // ancestor and child should be merged
        // grand child and clean vhd should not have changed
        const survivors = await handler.list(basePath)
        // console.log(survivors)
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

  await adapter.cleanVm(rootPath, { remove: true, logWarn: () => {}, lock: false })

  assert.deepEqual(await handler.list(basePath), [])
})

test('check Aliases should work alone', async () => {
  await handler.mkdir('vhds')
  await handler.mkdir('vhds/data')
  await generateVhd(`vhds/data/ok.vhd`)
  await VhdAbstract.createAlias(handler, 'vhds/ok.alias.vhd', 'vhds/data/ok.vhd')

  await VhdAbstract.createAlias(handler, 'vhds/missingData.alias.vhd', 'vhds/data/nonexistent.vhd')

  await generateVhd(`vhds/data/missingalias.vhd`)

  await checkAliases(['vhds/missingData.alias.vhd', 'vhds/ok.alias.vhd'], 'vhds/data', {
    remove: true,
    handler,
    logWarn: () => {},
  })

  // only ok have suvived
  const alias = (await handler.list('vhds')).filter(f => f.endsWith('.vhd'))
  assert.equal(alias.length, 1)

  const data = await handler.list('vhds/data')
  assert.equal(data.length, 1)
})
