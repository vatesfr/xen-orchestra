'use strict'

const { beforeEach, afterEach, describe, it } = require('node:test')
const { strict: assert } = require('assert')

const { rimraf } = require('rimraf')
const tmp = require('tmp')
const fs = require('fs-extra')
const zlib = require('zlib')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { Disposable, pFromCallback } = require('promise-toolbox')

const { asyncEach } = require('@vates/async-each')
const { randomBytes } = require('node:crypto')

const { openVhd, VhdDirectory } = require('..')
const { createRandomFile, convertFromRawToVhd, convertToVhdDirectory, getFullSize } = require('../tests/utils')

let tempDir = null
let handler
let disposeHandler

// writes a compressed VhdDirectory at `path` in `targetHandler` from random data, and returns it
//
// the source VHD is always read through the unencrypted `handler`, the target can be on another (encrypted) handler
async function writeCompressedVhd(
  targetHandler,
  path,
  { compression = 'gzip', sizeMB = 4, blockIds, concurrency = 1, withSize = true } = {}
) {
  const rawFileName = `${tempDir}/${path}.raw`
  const sourceName = `${path}.source.vhd`
  await createRandomFile(rawFileName, sizeMB)
  await convertFromRawToVhd(rawFileName, `${tempDir}/${sourceName}`)

  return Disposable.use(openVhd(handler, sourceName), async source => {
    await source.readBlockAllocationTable()
    const { value: vhd } = await VhdDirectory.create(targetHandler, path, { compression })
    vhd.header = source.header
    vhd.footer = source.footer
    await vhd.readSizeOnDisk()
    await asyncEach(
      source.blocks(),
      async block => {
        if (blockIds === undefined || blockIds.includes(block.id)) {
          await vhd.writeEntireBlock(block)
        }
      },
      { concurrency }
    )
    await vhd.writeHeader()
    await vhd.writeFooter()
    await vhd.writeBlockAllocationTable()
    if (withSize) {
      await vhd.saveSize()
    }
    return vhd
  })
}

describe('VhdDirectory', async () => {
  beforeEach(async () => {
    tempDir = await pFromCallback(cb => tmp.dir(cb))
    const d = await getSyncedHandler({ url: `file://${tempDir}` })
    handler = d.value
    disposeHandler = d.dispose
  })

  afterEach(async () => {
    await rimraf(tempDir)
    disposeHandler()
  })

  it('Can coalesce block', async () => {
    const initalSize = 4
    const parentrawFileName = `${tempDir}/randomfile`
    const parentFileName = `${tempDir}/parent.vhd`
    const parentDirectoryName = `${tempDir}/parent.dir.vhd`

    await createRandomFile(parentrawFileName, initalSize)
    await convertFromRawToVhd(parentrawFileName, parentFileName)
    await convertToVhdDirectory(parentrawFileName, parentFileName, parentDirectoryName)

    const childrawFileName = `${tempDir}/randomfile`
    const childFileName = `${tempDir}/childFile.vhd`
    await createRandomFile(childrawFileName, initalSize)
    await convertFromRawToVhd(childrawFileName, childFileName)
    const childRawDirectoryName = `${tempDir}/randomFile2.vhd`
    const childDirectoryFileName = `${tempDir}/childDirFile.vhd`
    const childDirectoryName = `${tempDir}/childDir.vhd`
    await createRandomFile(childRawDirectoryName, initalSize)
    await convertFromRawToVhd(childRawDirectoryName, childDirectoryFileName)
    await convertToVhdDirectory(childRawDirectoryName, childDirectoryFileName, childDirectoryName)

    await Disposable.use(async function* () {
      const parentVhd = yield openVhd(handler, 'parent.dir.vhd', { flags: 'w' })
      await parentVhd.readBlockAllocationTable()
      const childFileVhd = yield openVhd(handler, 'childFile.vhd')
      await childFileVhd.readBlockAllocationTable()
      const childDirectoryVhd = yield openVhd(handler, 'childDir.vhd')
      await childDirectoryVhd.readBlockAllocationTable()

      let childBlockData = (await childDirectoryVhd.readBlock(0)).data
      await parentVhd.mergeBlock(childDirectoryVhd, 0)
      await parentVhd.writeFooter()
      await parentVhd.writeBlockAllocationTable()
      let parentBlockData = (await parentVhd.readBlock(0)).data
      // block should be present in parent
      assert.equal(parentBlockData.equals(childBlockData), true)
      // block should not be in child since it's a rename  for vhd directory
      await assert.rejects(childDirectoryVhd.readBlock(0))

      childBlockData = (await childFileVhd.readBlock(1)).data
      await parentVhd.mergeBlock(childFileVhd, 1)
      await parentVhd.writeFooter()
      await parentVhd.writeBlockAllocationTable()
      parentBlockData = (await parentVhd.readBlock(1)).data
      // block should be present in parent in case of mixed vhdfile/vhddirectory
      assert.equal(parentBlockData.equals(childBlockData), true)
      // block should still be child
      await childFileVhd.readBlock(1)
    })
  })

  // zstd is only available since Node 22.15
  for (const compression of ['gzip', ...(zlib.zstdCompress === undefined ? [] : ['zstd']), 'zeros']) {
    it(`compresses blocks and metadata works (compression: ${compression})`, async () => {
      const initalSize = 4
      const rawFileName = `${tempDir}/randomfile`
      const vhdName = `${tempDir}/parent.vhd`

      await createRandomFile(rawFileName, initalSize)
      await convertFromRawToVhd(rawFileName, vhdName)
      await Disposable.use(async function* () {
        const vhd = yield openVhd(handler, 'parent.vhd')
        await vhd.readBlockAllocationTable()
        const compressedVhd = yield VhdDirectory.create(handler, 'compressed.vhd', { compression })
        compressedVhd.header = vhd.header
        compressedVhd.footer = vhd.footer
        for await (const block of vhd.blocks()) {
          await compressedVhd.writeEntireBlock(block)
        }
        await Promise.all[
          (await compressedVhd.writeHeader(),
          await compressedVhd.writeFooter(),
          await compressedVhd.writeBlockAllocationTable())
        ]

        // compressed vhd have a metadata file
        assert.equal(await fs.exists(`${tempDir}/compressed.vhd/chunk-filters.json`), true)
        const metadata = JSON.parse(await handler.readFile('compressed.vhd/chunk-filters.json'))
        assert.equal(metadata[0], compression)

        // compressed vhd should not be broken
        await compressedVhd.readHeaderAndFooter()
        await compressedVhd.readBlockAllocationTable()

        // check that footer and header are not modified
        assert.deepEqual(compressedVhd.footer, vhd.footer)
        assert.deepEqual(compressedVhd.header, vhd.header)

        // their block content should not have changed
        let counter = 0
        for await (const block of compressedVhd.blocks()) {
          const source = await vhd.readBlock(block.id)
          assert.equal(source.data.equals(block.data), true)
          counter++
        }
        // neither the number of blocks
        assert.equal(counter, 2)
      })
    })

    it(`computes the correct size (compression: ${compression})`, async () => {
      const initalSize = 4
      const rawFileName = `${tempDir}/randomfile`
      const vhdName = `${tempDir}/parent.vhd`

      await createRandomFile(rawFileName, initalSize)
      await convertFromRawToVhd(rawFileName, vhdName)
      await Disposable.use(async function* () {
        const vhd = yield openVhd(handler, 'parent.vhd')
        await vhd.readBlockAllocationTable()
        const compressedVhd = yield VhdDirectory.create(handler, 'compressed.vhd', { compression })
        compressedVhd.header = vhd.header
        compressedVhd.footer = vhd.footer
        for await (const block of vhd.blocks()) {
          await compressedVhd.writeEntireBlock(block)
        }
        await compressedVhd.writeHeader()
        await compressedVhd.writeFooter()
        await compressedVhd.writeBlockAllocationTable()

        await compressedVhd.saveSize()

        const fullSize = await getFullSize(handler, 'compressed.vhd')

        assert.equal(await compressedVhd.readSizeOnDisk(), fullSize)
        assert.notEqual(await compressedVhd.readSizeOnDisk(), compressedVhd.streamSize())

        const reopenedVhd = yield openVhd(handler, 'compressed.vhd')

        assert.equal(await reopenedVhd.readSizeOnDisk(), fullSize)
      })
    })
  }

  describe('readSizeOnDisk', () => {
    it('counts the encryption overhead', async () => {
      await Disposable.use(
        getSyncedHandler({ url: `file://${tempDir}/encrypted?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd00"` }),
        async encryptedHandler => {
          const vhd = await writeCompressedVhd(encryptedHandler, 'compressed.vhd')
          const fullSize = await getFullSize(encryptedHandler, 'compressed.vhd')

          assert.equal(await vhd.readSizeOnDisk(), fullSize)

          await Disposable.use(openVhd(encryptedHandler, 'compressed.vhd'), async reopenedVhd => {
            assert.equal(await reopenedVhd.readSizeOnDisk(), fullSize)
          })
        }
      )
    })

    it('does not count twice a rewritten block or BAT', async () => {
      await writeCompressedVhd(handler, 'compressed.vhd')
      const initialSize = await getFullSize(handler, 'compressed.vhd')

      await Disposable.use(openVhd(handler, 'compressed.vhd', { flags: 'r+' }), async vhd => {
        await vhd.readBlockAllocationTable()
        await vhd.readSizeOnDisk()
        assert.equal(vhd.containsBlock(0), true)

        // zeroes compress much better than the random data they replace: the size must go down
        await vhd.writeBlockData(0, Buffer.alloc(vhd.header.blockSize))
        await vhd.writeBlockAllocationTable()
        await vhd.writeFooter()
        await vhd.saveSize()

        const fullSize = await getFullSize(handler, 'compressed.vhd')
        assert.ok(fullSize < initialSize, 'the test must actually shrink the disk')
        assert.equal(await vhd.readSizeOnDisk(), fullSize)
      })
    })

    it('counts the blocks moved from a child', async () => {
      await writeCompressedVhd(handler, 'parent.vhd', { blockIds: [0] })
      const childVhd = await writeCompressedVhd(handler, 'child.vhd', { blockIds: [0, 1] })

      // like a merge, the parent is reopened to be modified
      await Disposable.use(openVhd(handler, 'parent.vhd', { flags: 'r+' }), async parentVhd => {
        await parentVhd.readBlockAllocationTable()
        await parentVhd.readSizeOnDisk()
        assert.equal(parentVhd.containsBlock(1), false)

        // block 0 replaces the parent one, block 1 is new in the parent
        await parentVhd.moveBlockFrom(0, childVhd.getFullBlockPath(0))
        await parentVhd.moveBlockFrom(1, childVhd.getFullBlockPath(1))
        await parentVhd.writeBlockAllocationTable()
        await parentVhd.saveSize()

        assert.equal(parentVhd.containsBlock(1), true)
        // the block must be moved, not copied
        await assert.rejects(handler.getSizeOnDisk(childVhd.getFullBlockPath(0)), { code: 'ENOENT' })
        assert.equal(await parentVhd.readSizeOnDisk(), await getFullSize(handler, 'parent.vhd'))
      })
    })

    it('is unknown, not 0, for a disk written without size.json', async () => {
      await writeCompressedVhd(handler, 'compressed.vhd', { withSize: false })

      await Disposable.use(openVhd(handler, 'compressed.vhd'), async vhd => {
        assert.strictEqual(await vhd.readSizeOnDisk(), undefined)

        const savedSize = await vhd.saveSize()
        assert.equal(savedSize, undefined)
        await assert.rejects(handler.readFile('compressed.vhd/size.json'), { code: 'ENOENT' })
      })
    })

    it('does not lose updates when blocks are written concurrently', async () => {
      // 16 MiB is 8 blocks: enough for concurrent writes to interleave
      const vhd = await writeCompressedVhd(handler, 'compressed.vhd', { sizeMB: 16, concurrency: 4 })

      assert.equal(await vhd.readSizeOnDisk(), await getFullSize(handler, 'compressed.vhd'))
    })

    it('is known for a disk without any block', async () => {
      await writeCompressedVhd(handler, 'compressed.vhd', { blockIds: [] })
      assert.equal(JSON.parse(await handler.readFile('compressed.vhd/size.json')).blocks, 0)

      // `blocks: 0` must not be considered as malformed
      await Disposable.use(openVhd(handler, 'compressed.vhd'), async vhd => {
        assert.equal(await vhd.readSizeOnDisk(), await getFullSize(handler, 'compressed.vhd'))
      })
    })

    it('is unknown, without preventing the disk to be opened, when size.json is invalid', async () => {
      await writeCompressedVhd(handler, 'compressed.vhd')
      const sizeFilePath = 'compressed.vhd/size.json'
      const validSizeFile = JSON.parse(await handler.readFile(sizeFilePath))

      const invalidContents = {
        'not JSON (interrupted write)': JSON.stringify(validSizeFile).slice(0, 10),
        empty: '',
        null: 'null',
        'empty object': '{}',
        'unknown version': JSON.stringify({ ...validSizeFile, version: 2 }),
        'chunks is null': JSON.stringify({ ...validSizeFile, chunks: null }),
        'blocks is not a number': JSON.stringify({ ...validSizeFile, blocks: '1234' }),
      }

      for (const [label, content] of Object.entries(invalidContents)) {
        await handler.writeFile(sizeFilePath, content, { flags: 'w' })

        await Disposable.use(openVhd(handler, 'compressed.vhd'), async vhd => {
          assert.strictEqual(await vhd.readSizeOnDisk(), undefined, label)

          // the disk itself is still usable
          await vhd.readBlockAllocationTable()
          await vhd.readBlock(0)
        })
      }
    })

    it('is unknown when the footer UUID changed since size.json was written', async () => {
      await writeCompressedVhd(handler, 'compressed.vhd')

      // like a merge done by a version which does not know size.json: the parent takes the UUID of the child, and
      // its size.json is not updated
      await Disposable.use(openVhd(handler, 'compressed.vhd', { flags: 'r+' }), async vhd => {
        assert.notStrictEqual(await vhd.readSizeOnDisk(), undefined)

        vhd.footer.uuid = randomBytes(16)
        await vhd.writeFooter()
      })

      await Disposable.use(openVhd(handler, 'compressed.vhd'), async vhd => {
        assert.strictEqual(await vhd.readSizeOnDisk(), undefined)
      })
    })

    it('is known again once rewritten after a footer UUID change', async () => {
      await writeCompressedVhd(handler, 'compressed.vhd')

      await Disposable.use(openVhd(handler, 'compressed.vhd', { flags: 'r+' }), async vhd => {
        await vhd.readSizeOnDisk()
        vhd.footer.uuid = randomBytes(16)
        await vhd.writeFooter()
        await vhd.saveSize()
      })

      await Disposable.use(openVhd(handler, 'compressed.vhd'), async vhd => {
        assert.equal(await vhd.readSizeOnDisk(), await getFullSize(handler, 'compressed.vhd'))
      })
    })

    it('is unknown when the disk is modified before its size is loaded', async () => {
      await writeCompressedVhd(handler, 'compressed.vhd')

      await Disposable.use(openVhd(handler, 'compressed.vhd', { flags: 'r+' }), async vhd => {
        await vhd.readBlockAllocationTable()

        // the size has not been loaded: the change of size of this block cannot be accounted for
        await vhd.writeBlockData(0, Buffer.alloc(vhd.header.blockSize))
        await vhd.writeBlockAllocationTable()

        assert.strictEqual(await vhd.readSizeOnDisk(), undefined)

        // an unknown size is not saved
        const savedSize = await vhd.saveSize()
        assert.equal(savedSize, undefined)
      })
    })
  })
})
