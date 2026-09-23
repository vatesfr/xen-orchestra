import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'

import { formatVmBackups } from './formatVmBackups.mjs'

const VM_UUID = '6ef7c0e6-1a1f-4ba1-9b1a-9a4a2ed1c001'
const JOB_ID = 'c3a4f6d2-0e5c-4c2b-9a5f-3d6c0b0e0002'

// shaped like what `IncrementalRemoteWriter` writes and `readVmBackupMetadata` reads back
const metadata = {
  _filename: `/xo-vm-backups/${VM_UUID}/20250801T080832Z.json`,
  id: `/xo-vm-backups/${VM_UUID}/20250801T080832Z.json`,
  jobId: JOB_ID,
  mode: 'delta',
  timestamp: 1754035712000,
  vdis: {
    'OpaqueRef:2f7a': { uuid: 'snapshot-vdi-uuid-1', name_label: 'system' },
    'OpaqueRef:9c1b': { uuid: 'snapshot-vdi-uuid-2', name_label: 'data' },
  },
  vhds: {
    'OpaqueRef:2f7a': `vdis/${JOB_ID}/live-vdi-uuid-1/20250801T080832Z.vhd`,
    'OpaqueRef:9c1b': `vdis/${JOB_ID}/live-vdi-uuid-2/20250801T080832Z.alias.vhd`,
  },
  vm: { uuid: VM_UUID, name_label: 'a vm', name_description: '', tags: [] },
}

describe('formatVmBackups()', () => {
  const [backup] = formatVmBackups({ [VM_UUID]: [metadata] }, 'backup-repository-id')[VM_UUID]

  it('exposes a disk per VHD, keyed by the uuid stored in the backup', () => {
    assert.deepEqual(
      backup.disks.map(disk => disk.uuid),
      ['snapshot-vdi-uuid-1', 'snapshot-vdi-uuid-2']
    )
  })

  // a live mounted disk is designated by this id, which `ImportVmBackup` builds on its side with
  // `join`, while the listing builds it by interpolation: a divergence would only show up at mount
  // time, as a confusing "disk does not belong to backup archive"
  it('builds a disk id equal to the path ImportVmBackup computes', () => {
    const metadataDir = dirname(metadata._filename)
    for (const disk of backup.disks) {
      const [vdiRef] = Object.entries(metadata.vdis).find(([, vdi]) => vdi.uuid === disk.uuid)
      assert.equal(disk.id, join(metadataDir, metadata.vhds[vdiRef]))
    }
  })
})
