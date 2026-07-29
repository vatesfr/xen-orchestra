import test from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'
/* eslint-disable n/no-missing-import */
import { VmFullBackupArchive } from '../VmFullBackupArchive.mjs'
import { VmIncrementalBackupArchive } from '../VmIncrementalBackupArchive.mjs'
/* eslint-enable n/no-missing-import */
import { createMinimalXva, generateVhd } from './tests.fixtures.mjs'

const { beforeEach, afterEach, describe } = test

let tempDir, handler, openedDisks
const vmUuid = 'test-vm-uuid'
const rootPath = `xo-vm-backups/${vmUuid}`
const vdiDir = `${rootPath}/vdis/job/vdi`

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  await fs.mkdirp(`${tempDir}/${vdiDir}`)
  openedDisks = []
})

afterEach(async () => {
  for (const disk of openedDisks) {
    await disk.close()
  }
  await rimraf(tempDir)
  await handler.forget()
})

describe('readFullVmBackup', () => {
  test('streams the XVA of the backup', async () => {
    const xva = await createMinimalXva()
    await handler.outputFile(`${rootPath}/20240102T030405Z.xva`, xva)

    const stream = await VmFullBackupArchive.readFullVmBackup(handler, {
      // the xva path is relative to the metadata file
      _filename: `/${rootPath}/20240102T030405Z.json`,
      xva: './20240102T030405Z.xva',
    })

    const chunks = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    assert.deepEqual(Buffer.concat(chunks), xva)
  })
})

describe('readIncrementalVmBackup', () => {
  // block 0 only exists in the parent, block 1 only in the child
  async function createIncrementalBackup() {
    const parent = await generateVhd(handler, `${vdiDir}/parent.vhd`, { blocks: [0] })
    await generateVhd(handler, `${vdiDir}/child.vhd`, {
      header: { parentUnicodeName: 'parent.vhd', parentUuid: parent.footer.uuid },
      blocks: [1],
    })

    return {
      _filename: `/${rootPath}/20240102T030405Z.json`,
      mode: 'delta',
      vhds: { 'OpaqueRef:vdi-1': `vdis/job/vdi/child.vhd` },
      vdis: { 'OpaqueRef:vdi-1': { uuid: 'vdi-1-uuid', baseVdi: 'OpaqueRef:base' } },
      vbds: { 'OpaqueRef:vbd-1': { VDI: 'OpaqueRef:vdi-1' } },
      vifs: { 'OpaqueRef:vif-1': {} },
      vtpms: {},
      vm: { uuid: vmUuid },
      vmSnapshot: { suspend_VDI: 'OpaqueRef:NULL' },
    }
  }

  const open = async (metadata, ignoredVdis, opts) => {
    const backup = await VmIncrementalBackupArchive.readIncrementalVmBackup(handler, metadata, ignoredVdis, opts)
    openedDisks.push(...Object.values(backup.disks))
    return backup
  }

  test('returns the import payload with one disk per VDI', async () => {
    const metadata = await createIncrementalBackup()
    const backup = await open(metadata)

    assert.equal(backup.version, '1.0.0')
    assert.deepEqual(Object.keys(backup.disks), ['OpaqueRef:vdi-1'])
    assert.deepEqual(Object.keys(backup.vdis), ['OpaqueRef:vdi-1'])
    assert.deepEqual(backup.vbds, metadata.vbds)
    assert.deepEqual(backup.vifs, metadata.vifs)
    assert.deepEqual(backup.vm, { uuid: vmUuid, suspend_VDI: 'OpaqueRef:NULL' })
    // baseVdi only makes sense while the backup is being created
    assert.equal('baseVdi' in backup.vdis['OpaqueRef:vdi-1'], false)
  })

  test('filters out the ignored VDIs', async () => {
    const metadata = await createIncrementalBackup()
    const backup = await open(metadata, new Set(['vdi-1-uuid']))

    assert.deepEqual(backup.disks, {})
    assert.deepEqual(backup.vdis, {})
  })

  test('reads through the parents by default', async () => {
    const metadata = await createIncrementalBackup()
    const backup = await open(metadata)
    const disk = backup.disks['OpaqueRef:vdi-1']

    // block 0 comes from the parent VHD
    assert.deepEqual(disk.getBlockIndexes(), [0, 1])
    assert.equal((await disk.readBlock(0)).data.length, 2 * 1024 * 1024)
  })

  test('reads only the given VHD with useChain: false', async () => {
    const metadata = await createIncrementalBackup()
    const backup = await open(metadata, undefined, { useChain: false })

    // the parent is not opened, so its blocks are not readable
    assert.deepEqual(backup.disks['OpaqueRef:vdi-1'].getBlockIndexes(), [1])
  })
})
