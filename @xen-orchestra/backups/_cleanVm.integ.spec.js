/* eslint-env jest */

const rimraf = require('rimraf')
const tmp = require('tmp')
const fs = require('fs-extra')
const { getHandler } = require('@xen-orchestra/fs')
const { pFromCallback } = require('promise-toolbox')
const crypto = require('crypto')
const { RemoteAdapter } = require('./RemoteAdapter')
const { VHDFOOTER, VHDHEADER } = require('./tests.fixtures.js')
const { VhdFile, Constants, VhdDirectory, VhdAbstract } = require('vhd-lib')

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

const uniqueId = () => crypto.randomBytes(16).toString('hex')

async function generateVhd(path, opts = {}) {
  let vhd

  const dataPath = opts.useAlias ? path + '.data' : path
  if (opts.mode === 'directory') {
    await handler.mkdir(dataPath)
    vhd = new VhdDirectory(handler, dataPath)
  } else {
    const fd = await handler.openFile(dataPath, 'wx')
    vhd = new VhdFile(handler, fd)
  }

  vhd.header = { ...VHDHEADER, ...opts.header }
  vhd.footer = { ...VHDFOOTER, ...opts.footer }
  vhd.footer.uuid = Buffer.from(crypto.randomBytes(16))

  if (vhd.header.parentUnicodeName) {
    vhd.footer.diskType = Constants.DISK_TYPE_DIFFERENCING
  } else {
    vhd.footer.diskType = Constants.DISK_TYPE_DYNAMIC
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
  // one with a broken parent
  await generateVhd(`${basePath}/abandonned.vhd`, {
    header: {
      parentUnicodeName: 'gone.vhd',
      parentUid: Buffer.from(crypto.randomBytes(16)),
    },
  })

  // one orphan, which is a full vhd, no parent
  const orphan = await generateVhd(`${basePath}/orphan.vhd`)
  // a child to the orphan
  await generateVhd(`${basePath}/child.vhd`, {
    header: {
      parentUnicodeName: 'orphan.vhd',
      parentUid: orphan.footer.uuid,
    },
  })

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
      parentUid: orphan.footer.uuid,
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
        // abandonned.json is not here
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
      size: 209920,
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
      parentUid: orphan.footer.uuid,
    },
  })
  // a grand child
  await generateVhd(`${basePath}/grandchild.vhd`, {
    header: {
      parentUnicodeName: 'child.vhd',
      parentUid: child.footer.uuid,
    },
  })

  let loggued = ''
  const onLog = message => {
    loggued += message + '\n'
  }
  await adapter.cleanVm('/', { remove: true, onLog })
  expect(loggued).toEqual(`the parent /${basePath}/orphan.vhd of the child /${basePath}/child.vhd is unused\n`)
  loggued = ''
  await adapter.cleanVm('/', { remove: true, merge: true, onLog })
  const [unused, merging] = loggued.split('\n')
  expect(unused).toEqual(`the parent /${basePath}/orphan.vhd of the child /${basePath}/child.vhd is unused`)
  expect(merging).toEqual(`merging /${basePath}/child.vhd into /${basePath}/orphan.vhd`)

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
      vhds: [
        `${basePath}/orphan.vhd`, // grand child should not be merged
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
      parentUid: orphan.footer.uuid,
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

  // a unfinished merging
  await adapter.cleanVm('/', { remove: true, merge: true })
  // merging is already tested in vhd-lib, don't retest it here (and theses vhd are as empty as my stomach at 12h12)

  // only check deletion
  const remainingVhds = await handler.list(basePath)
  expect(remainingVhds.length).toEqual(1)
  expect(remainingVhds.includes('child.vhd')).toEqual(true)
})

// each of the vhd can be a file, a directory, an alias to a file or an alias to a directory
// the message an resulting files should be identical to the output with vhd files which is tested independantly

describe('tests mulitple combination ', () => {
  for (const useAlias of [true, false]) {
    for (const vhdMode of ['file', 'directory']) {
      test(`alias : ${useAlias}, mode: ${vhdMode}`, async () => {
        // a broken VHD
        const brokenVhdDataPath = basePath + useAlias ? 'broken.data' : 'broken.vhd'
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
            parentUid: crypto.randomBytes(16),
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
            parentUid: ancestor.footer.uuid,
          },
        })
        // a grand child  vhd in metadata
        await generateVhd(`${basePath}/grandchild.vhd`, {
          useAlias,
          mode: vhdMode,
          header: {
            parentUnicodeName: 'child.vhd' + (useAlias ? '.alias.vhd' : ''),
            parentUid: child.footer.uuid,
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
            parentUid: cleanAncestor.footer.uuid,
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

        // broken vhd, non referenced, abandonned should be deleted ( alias and data)
        // ancestor and child should be merged
        // grand child and clean vhd should not have changed
        const survivors = await handler.list(basePath)
        // console.log(survivors)
        if (useAlias) {
          // the goal of the alias : do not move a full folder
          expect(survivors).toContain('ancestor.vhd.data')
          expect(survivors).toContain('grandchild.vhd.data')
          expect(survivors).toContain('cleanAncestor.vhd.data')
          expect(survivors).toContain('clean.vhd.alias.vhd')
          expect(survivors).toContain('child.vhd.alias.vhd')
          expect(survivors).toContain('grandchild.vhd.alias.vhd')
          expect(survivors.length).toEqual(6)
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
