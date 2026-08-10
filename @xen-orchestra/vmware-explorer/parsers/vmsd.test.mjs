import { strict as assert } from 'node:assert'
import test from 'node:test'

import parseVmsd from './vmsd.mjs'

const { describe, it } = test

// a real .vmsd, as written by ESXi for a VM with 4 snapshots
const VMSD_4_SNAPSHOTS = `.encoding = "UTF-8"
snapshot.lastUID = "4"
snapshot.current = "4"
snapshot0.uid = "1"
snapshot0.filename = "test flo-Snapshot1.vmsn"
snapshot0.displayName = "SNAPSHOT POST INSTALL"
snapshot0.description = "blablabla"
snapshot0.createTimeHigh = "388745"
snapshot0.createTimeLow = "1991180826"
snapshot0.numDisks = "1"
snapshot0.disk0.fileName = "test flo_0.vmdk"
snapshot0.disk0.node = "scsi0:0"
snapshot.numSnapshots = "4"
snapshot1.uid = "2"
snapshot1.filename = "test flo-Snapshot2.vmsn"
snapshot1.parent = "1"
snapshot1.displayName = "SECOND"
snapshot1.description = "small"
snapshot1.numDisks = "1"
snapshot1.disk0.fileName = "test flo_0-000001.vmdk"
snapshot1.disk0.node = "scsi0:0"
snapshot2.uid = "3"
snapshot2.filename = "test flo-Snapshot3.vmsn"
snapshot2.parent = "2"
snapshot2.displayName = "third"
snapshot2.numDisks = "1"
snapshot2.disk0.fileName = "test flo_0-000002.vmdk"
snapshot2.disk0.node = "scsi0:0"
snapshot3.uid = "4"
snapshot3.filename = "test flo-Snapshot4.vmsn"
snapshot3.parent = "3"
snapshot3.displayName = "from cli"
snapshot3.numDisks = "1"
snapshot3.disk0.fileName = "test flo_0-000003.vmdk"
snapshot3.disk0.node = "scsi0:0"
`

// VMware allows up to 32 snapshots per VM, so the `snapshotN` index is not limited to one digit
function buildVmsd(nSnapshots, nDisksPerSnapshot = 1) {
  const lines = ['.encoding = "UTF-8"', `snapshot.lastUID = "${nSnapshots}"`, `snapshot.current = "${nSnapshots}"`]
  for (let index = 0; index < nSnapshots; index++) {
    const uid = index + 1
    lines.push(
      `snapshot${index}.uid = "${uid}"`,
      `snapshot${index}.filename = "vm-Snapshot${uid}.vmsn"`,
      `snapshot${index}.displayName = "snapshot ${uid}"`,
      `snapshot${index}.numDisks = "${nDisksPerSnapshot}"`
    )
    if (index > 0) {
      lines.push(`snapshot${index}.parent = "${index}"`)
    }
    for (let diskIndex = 0; diskIndex < nDisksPerSnapshot; diskIndex++) {
      lines.push(
        `snapshot${index}.disk${diskIndex}.fileName = "vm_${diskIndex}-${String(uid).padStart(6, '0')}.vmdk"`,
        `snapshot${index}.disk${diskIndex}.node = "scsi0:${diskIndex}"`
      )
    }
  }
  lines.push(`snapshot.numSnapshots = "${nSnapshots}"`)
  return lines.join('\n') + '\n'
}

describe('parseVmsd', function () {
  it('returns undefined when the VM has no current snapshot', function () {
    assert.equal(parseVmsd('.encoding = "UTF-8"\nsnapshot.lastUID = "0"\nsnapshot.numSnapshots = "0"\n'), undefined)
  })

  it('parses a VM with less than 10 snapshots', function () {
    const { current, lastUID, numSnapshots, snapshots } = parseVmsd(VMSD_4_SNAPSHOTS)

    assert.equal(current, '4')
    assert.equal(lastUID, '4')
    assert.equal(numSnapshots, '4')
    assert.deepEqual(
      snapshots.map(({ uid }) => uid),
      ['1', '2', '3', '4']
    )
    assert.deepEqual(snapshots[3], {
      uid: '4',
      filename: 'test flo-Snapshot4.vmsn',
      parent: '3',
      displayName: 'from cli',
      numDisks: '1',
      disks: [{ fileName: 'test flo_0-000003.vmdk', node: 'scsi0:0' }],
    })
  })

  it('parses a VM with 10 snapshots or more', function () {
    const { current, snapshots } = parseVmsd(buildVmsd(12))

    assert.equal(current, '12')
    assert.equal(snapshots.length, 12)
    // snapshot10 and snapshot11 must not be mistaken for an index of snapshot1
    assert.deepEqual(
      snapshots.map(({ uid }) => uid),
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    )
    assert.deepEqual(snapshots[10], {
      uid: '11',
      filename: 'vm-Snapshot11.vmsn',
      parent: '10',
      displayName: 'snapshot 11',
      numDisks: '1',
      disks: [{ fileName: 'vm_0-000011.vmdk', node: 'scsi0:0' }],
    })
  })

  it('keeps the snapshot referenced by `current` findable by its uid', function () {
    // buildDiskChainByNode() looks the current snapshot up by uid, and dereferences its disks
    const { current, snapshots } = parseVmsd(buildVmsd(12))
    const currentSnapshot = snapshots.find(({ uid }) => uid === current)

    assert.notEqual(currentSnapshot, undefined)
    assert.equal(currentSnapshot.disks.length, 1)
  })

  it('parses a snapshot with 10 disks or more', function () {
    const { snapshots } = parseVmsd(buildVmsd(1, 11))

    assert.equal(snapshots.length, 1)
    assert.equal(snapshots[0].disks.length, 11)
    // disk10 must not be mistaken for an index of disk1
    assert.deepEqual(snapshots[0].disks[10], { fileName: 'vm_10-000001.vmdk', node: 'scsi0:10' })
  })
})
