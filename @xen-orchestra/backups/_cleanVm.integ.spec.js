'use strict'

/* eslint-env jest */

const rimraf = require('rimraf')
const tmp = require('tmp')
const fs = require('fs-extra')
const uuid = require('uuid')
const { getHandler } = require('@xen-orchestra/fs')
const { pFromCallback } = require('promise-toolbox')
const { RemoteAdapter } = require('./RemoteAdapter')
const { VHDFOOTER, VHDHEADER } = require('./tests.fixtures.js')
const { VhdFile, Constants, VhdDirectory, VhdAbstract } = require('vhd-lib')
const { checkAliases } = require('./_cleanVm')
const { dirname, basename } = require('path')

let tempDir, adapter, handler, jobId, vdiId, basePath

jest.setTimeout(60000)

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  adapter = new RemoteAdapter(handler)
  jobId = uniqueId()
  vdiId = uniqueId()
  basePath = `vdis/${jobId}/${vdiId}`
  await fs.mkdirp(`${tempDir}/${basePath}`)
})

afterEach(async () => {
  await pFromCallback(cb => rimraf(tempDir, cb))
  await handler.forget()
})

const uniqueId = () => uuid.v1()
const uniqueIdBuffer = () => Buffer.from(uniqueId(), 'utf-8')

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

  await vhd.writeBlockAllocationTable()
  await vhd.writeHeader()
  await vhd.writeFooter()
  return vhd
}

test('It remove broken vhd', async () => {
  // todo also tests a directory and an alias

  await handler.writeFile(`${basePath}/notReallyAVhd.vhd`, 'I AM NOT A VHD')
  expect((await handler.list(basePath)).length).toEqual(1)
  let loggued = ''
  const onLog = message => {
    loggued += message
  }
  await adapter.cleanVm('/', { remove: false, onLog })
  expect(loggued).toEqual(`error while checking the VHD with path /${basePath}/notReallyAVhd.vhd`)
  // not removed
  expect((await handler.list(basePath)).length).toEqual(1)
  // really remove it
  await adapter.cleanVm('/', { remove: true, onLog })
  expect((await handler.list(basePath)).length).toEqual(0)
})

test('it remove vhd with missing or multiple ancestors', async () => {
  // one with a broken parent, should be deleted
  await generateVhd(`${basePath}/abandonned.vhd`, {
    header: {
      parentUnicodeName: 'gone.vhd',
      parentUuid: uniqueIdBuffer(),
    },
  })

  // one orphan, which is a full vhd, no parent should stay
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
  const onLog = message => {
    loggued += message + '\n'
  }
  await adapter.cleanVm('/', { remove: true, onLog })

  const deletedOrphanVhd = loggued.match(/deleting orphan VHD/g) || []
  expect(deletedOrphanVhd.length).toEqual(1) // only one vhd should have been deleted
  const deletedAbandonnedVhd = loggued.match(/abandonned.vhd is missing/g) || []
  expect(deletedAbandonnedVhd.length).toEqual(1) // and it must be abandonned.vhd

  // we don't test the filew on disk, since they will all be marker as unused and deleted without a metadata.json file
})

test('it remove backup meta data referencing a missing vhd in delta backup', async () => {
  // create a metadata file marking child and orphan as ok
  await handler.writeFile(
    `metadata.json`,
    JSON.stringify({
      mode: 'delta',
      vhds: [
        `${basePath}/orphan.vhd`,
        `${basePath}/child.vhd`,
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
  const onLog = message => {
    loggued += message + '\n'
  }
  await adapter.cleanVm('/', { remove: true, onLog })
  let matched = loggued.match(/deleting unused VHD /g) || []
  expect(matched.length).toEqual(1) // only one vhd should have been deleted
  matched = loggued.match(/abandonned.vhd is unused/g) || []
  expect(matched.length).toEqual(1) // and it must be abandonned.vhd

  // a missing vhd cause clean to remove all vhds
  await handler.writeFile(
    `metadata.json`,
    JSON.stringify({
      mode: 'delta',
      vhds: [
        `${basePath}/deleted.vhd`, // in metadata but not in vhds
        `${basePath}/orphan.vhd`,
        `${basePath}/child.vhd`,
        // abandonned.vhd is not here anymore
      ],
    }),
    { flags: 'w' }
  )
  loggued = ''
  await adapter.cleanVm('/', { remove: true, onLog })
  matched = loggued.match(/deleting unused VHD /g) || []
  expect(matched.length).toEqual(2) // all vhds (orphan and  child  ) should have been deleted
})

test('it merges delta of non destroyed chain', async () => {
  await handler.writeFile(
    `metadata.json`,
    JSON.stringify({
      mode: 'delta',
      size: 12000, // a size too small
      vhds: [
        `${basePath}/grandchild.vhd`, // grand child should not be merged
        `${basePath}/child.vhd`,
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
  const onLog = message => {
    loggued.push(message)
  }
  await adapter.cleanVm('/', { remove: true, onLog })
  expect(loggued[0]).toEqual(`incorrect size in metadata: 12000 instead of 209920`)

  loggued = []
  await adapter.cleanVm('/', { remove: true, merge: true, onLog })
  const [merging] = loggued
  expect(merging).toEqual(`merging 1 children into /${basePath}/orphan.vhd`)

  const metadata = JSON.parse(await handler.readFile(`metadata.json`))
  // size should be the size of children + grand children after the merge
  expect(metadata.size).toEqual(209920)

  // merging is already tested in vhd-lib, don't retest it here (and theses vhd are as empty as my stomach at 12h12)
  // only check deletion
  const remainingVhds = await handler.list(basePath)
  expect(remainingVhds.length).toEqual(2)
  expect(remainingVhds.includes('child.vhd')).toEqual(true)
  expect(remainingVhds.includes('grandchild.vhd')).toEqual(true)
})

test('it finish unterminated merge ', async () => {
  await handler.writeFile(
    `metadata.json`,
    JSON.stringify({
      mode: 'delta',
      size: 209920,
      vhds: [`${basePath}/orphan.vhd`, `${basePath}/child.vhd`],
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

  await adapter.cleanVm('/', { remove: true, merge: true })
  // merging is already tested in vhd-lib, don't retest it here (and theses vhd are as empty as my stomach at 12h12)

  // only check deletion
  const remainingVhds = await handler.list(basePath)
  expect(remainingVhds.length).toEqual(1)
  expect(remainingVhds.includes('child.vhd')).toEqual(true)
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
        })
        const child = await generateVhd(`${basePath}/child.vhd`, {
          useAlias,
          mode: vhdMode,
          header: {
            parentUnicodeName: 'ancestor.vhd' + (useAlias ? '.alias.vhd' : ''),
            parentUuid: ancestor.footer.uuid,
          },
        })
        // a grand child  vhd in metadata
        await generateVhd(`${basePath}/grandchild.vhd`, {
          useAlias,
          mode: vhdMode,
          header: {
            parentUnicodeName: 'child.vhd' + (useAlias ? '.alias.vhd' : ''),
            parentUuid: child.footer.uuid,
          },
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
          `metadata.json`,
          JSON.stringify({
            mode: 'delta',
            vhds: [
              `${basePath}/grandchild.vhd` + (useAlias ? '.alias.vhd' : ''), // grand child should not be merged
              `${basePath}/child.vhd` + (useAlias ? '.alias.vhd' : ''),
              `${basePath}/clean.vhd` + (useAlias ? '.alias.vhd' : ''),
            ],
          })
        )

        await adapter.cleanVm('/', { remove: true, merge: true })

        const metadata = JSON.parse(await handler.readFile(`metadata.json`))
        // size should be the size of children + grand children + clean after the merge
        expect(metadata.size).toEqual(vhdMode === 'file' ? 314880 : undefined)

        // broken vhd, non referenced, abandonned should be deleted ( alias and data)
        // ancestor and child should be merged
        // grand child and clean vhd should not have changed
        const survivors = await handler.list(basePath)
        // console.log(survivors)
        if (useAlias) {
          const dataSurvivors = await handler.list(basePath + '/data')
          // the goal of the alias : do not move a full folder
          expect(dataSurvivors).toContain('ancestor.vhd')
          expect(dataSurvivors).toContain('grandchild.vhd')
          expect(dataSurvivors).toContain('cleanAncestor.vhd')
          expect(survivors).toContain('clean.vhd.alias.vhd')
          expect(survivors).toContain('child.vhd.alias.vhd')
          expect(survivors).toContain('grandchild.vhd.alias.vhd')
          expect(survivors.length).toEqual(4) // the 3 ok + data
          expect(dataSurvivors.length).toEqual(3) // the 3 ok + data
        } else {
          expect(survivors).toContain('clean.vhd')
          expect(survivors).toContain('child.vhd')
          expect(survivors).toContain('grandchild.vhd')
          expect(survivors.length).toEqual(3)
        }
      })
    }
  }
})

test('it cleans orphan merge states ', async () => {
  await handler.writeFile(`${basePath}/.orphan.vhd.merge.json`, '')

  await adapter.cleanVm('/', { remove: true })

  expect(await handler.list(basePath)).toEqual([])
})

test('check Aliases should work alone', async () => {
  await handler.mkdir('vhds')
  await handler.mkdir('vhds/data')
  await generateVhd(`vhds/data/ok.vhd`)
  await VhdAbstract.createAlias(handler, 'vhds/ok.alias.vhd', 'vhds/data/ok.vhd')

  await VhdAbstract.createAlias(handler, 'vhds/missingData.alias.vhd', 'vhds/data/nonexistent.vhd')

  await generateVhd(`vhds/data/missingalias.vhd`)

  await checkAliases(['vhds/missingData.alias.vhd', 'vhds/ok.alias.vhd'], 'vhds/data', { remove: true, handler })

  // only ok have suvived
  const alias = (await handler.list('vhds')).filter(f => f.endsWith('.vhd'))
  expect(alias.length).toEqual(1)

  const data = await handler.list('vhds/data')
  expect(data.length).toEqual(1)
})
