import { strict as assert } from 'node:assert'
import test from 'node:test'

import {
  diskIsAlreadyImported,
  findPreviouslyImportedIndex,
  VDI_DISK_PATH_KEY,
  VDI_LEGACY_CID_KEY,
} from './_diskIdentity.mjs'

const { describe, it } = test

// the chain of a running VM, right after XO took its own snapshot: the base disk went
// read-only and the delta became the active disk.
// both advertise the same CID, as observed on ESXi 7: VMware creates the delta with
// `CID = parentCID` and only rewrites it when the disk is closed after being written to
const BASE_DISK = {
  diskPath: 'Linux-AR/Linux-AR.vmdk',
  uid: 'b4cf9e4e',
  parentId: 'ffffffff',
  isFull: true,
}
const DELTA_DISK = {
  diskPath: 'Linux-AR/Linux-AR-000001.vmdk',
  uid: 'b4cf9e4e',
  parentId: 'b4cf9e4e',
  isFull: false,
}
const CHAIN = [BASE_DISK, DELTA_DISK]

const vdi = other_config => ({ $ref: 'OpaqueRef:vdi', other_config })
const importedVdi = disk => vdi({ [VDI_DISK_PATH_KEY]: disk.diskPath, [VDI_LEGACY_CID_KEY]: disk.uid })

describe('diskIsAlreadyImported', function () {
  it('matches the disk the VDI was imported from', function () {
    assert.notEqual(diskIsAlreadyImported([importedVdi(BASE_DISK)], BASE_DISK), undefined)
  })

  it('does not match another disk of the chain sharing its CID', function () {
    // the regression: matching on the CID alone made the delta look already imported, and
    // the data written since the snapshot was silently left on the VMware side
    assert.equal(diskIsAlreadyImported([importedVdi(BASE_DISK)], DELTA_DISK), undefined)
  })

  it('returns undefined when no VDI holds this disk', function () {
    assert.equal(diskIsAlreadyImported([vdi({})], BASE_DISK), undefined)
    assert.equal(diskIsAlreadyImported([], BASE_DISK), undefined)
  })

  it('ignores a VDI without other_config', function () {
    assert.equal(diskIsAlreadyImported([undefined, vdi(undefined)], BASE_DISK), undefined)
  })

  it('ignores a VDI that XO did not import, even for a disk without a CID', function () {
    // `undefined === undefined` would report the disk as imported and skip its transfer
    const foreignVdi = vdi({ name: 'attached by the user' })

    assert.equal(diskIsAlreadyImported([foreignVdi], { diskPath: 'Linux-AR/no-cid.vmdk' }), undefined)
  })

  it('tells the disks of a multi-disk VM apart', function () {
    const otherBase = { diskPath: 'Linux-AR/Linux-AR_1.vmdk', uid: 'b4cf9e4e' }
    const vdis = [importedVdi(BASE_DISK), importedVdi(otherBase)]

    assert.equal(diskIsAlreadyImported(vdis, BASE_DISK).other_config[VDI_DISK_PATH_KEY], BASE_DISK.diskPath)
    assert.equal(diskIsAlreadyImported(vdis, otherBase).other_config[VDI_DISK_PATH_KEY], otherBase.diskPath)
  })

  describe('VDI imported by an XO that did not store the disk path', function () {
    it('falls back to the CID', function () {
      assert.notEqual(diskIsAlreadyImported([vdi({ [VDI_LEGACY_CID_KEY]: 'b4cf9e4e' })], BASE_DISK), undefined)
    })

    it('does not fall back to the CID once the disk path is known', function () {
      const staleCid = vdi({ [VDI_DISK_PATH_KEY]: 'Linux-AR/Linux-AR_1.vmdk', [VDI_LEGACY_CID_KEY]: 'b4cf9e4e' })

      assert.equal(diskIsAlreadyImported([staleCid], BASE_DISK), undefined)
    })

    it('never matches a delta still carrying the CID of its parent', function () {
      const legacyVdi = vdi({ [VDI_LEGACY_CID_KEY]: 'b4cf9e4e' })

      assert.equal(diskIsAlreadyImported([legacyVdi], DELTA_DISK), undefined)
      // so the transfer restarts from the base disk instead of being skipped altogether
      assert.equal(findPreviouslyImportedIndex([legacyVdi], CHAIN), 0)
    })
  })
})

describe('findPreviouslyImportedIndex', function () {
  it('returns -1 when nothing of the chain has been imported', function () {
    assert.equal(findPreviouslyImportedIndex([], CHAIN), -1)
  })

  it('points at the base disk after the cold transfer, so the delta is still imported', function () {
    // with a CID-based match this returned 1 (the length of the chain minus one), which
    // importDiskChain() reads as 'nothing to import' and returns early
    assert.equal(findPreviouslyImportedIndex([importedVdi(BASE_DISK)], CHAIN), 0)
  })

  it('points at the active disk once the whole chain has been imported', function () {
    assert.equal(findPreviouslyImportedIndex([importedVdi(DELTA_DISK)], CHAIN), CHAIN.length - 1)
  })

  it('returns the deepest imported disk', function () {
    assert.equal(findPreviouslyImportedIndex([importedVdi(DELTA_DISK), importedVdi(BASE_DISK)], CHAIN), 1)
  })
})
