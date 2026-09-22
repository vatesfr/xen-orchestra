import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { dirname, join } from 'node:path'

import { formatJournalEvents, formatVmBackupAt, formatVmBackups } from './formatVmBackups.mjs'

const VM = '6ef7c0e6-1a1f-4ba1-9b1a-9a4a2ed1c001'
const REPOSITORY = 'a-repository-id'
const JOB_ID = 'c3a4f6d2-0e5c-4c2b-9a5f-3d6c0b0e0002'

const FILENAME = `/xo-vm-backups/${VM}/20260811T090000Z.json`
const DELTA_FILENAME = `/xo-vm-backups/${VM}/20250801T080832Z.json`

const metadataOf = props => ({
  jobId: 'a-job-id',
  mode: 'full',
  scheduleId: 'a-schedule-id',
  size: 1,
  timestamp: Date.parse('20260811T090000Z'),
  vm: { uuid: VM, name_label: 'a VM', name_description: '', tags: [] },
  ...props,
})

// shaped like what `IncrementalRemoteWriter` writes and `readVmBackupMetadata` reads back
const metadata = metadataOf({
  _filename: DELTA_FILENAME,
  id: DELTA_FILENAME,
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
})

describe('formatVmBackupAt()', () => {
  it('names a backup after the normalized path of its metadata', () => {
    // the journal entries and the on-repository cache don't agree on the leading slash
    for (const filename of [FILENAME, FILENAME.slice(1)]) {
      assert.equal(formatVmBackupAt(metadataOf(), filename, REPOSITORY).id, FILENAME)
    }
  })

  it('derives the disk ids from the normalized path', () => {
    const metadata = metadataOf({
      vhds: { 'vdi-ref': 'vdi.vhd' },
      vdis: { 'vdi-ref': { name_label: 'a disk', uuid: 'a-vdi-uuid' } },
    })

    for (const filename of [FILENAME, FILENAME.slice(1)]) {
      assert.deepEqual(formatVmBackupAt(metadata, filename, REPOSITORY).disks, [
        { id: `/xo-vm-backups/${VM}/vdi.vhd`, name: 'a disk', uuid: 'a-vdi-uuid' },
      ])
    }
  })

  it('ignores the id the metadata may already carry', () => {
    const metadata = metadataOf({ id: 'a-stale-id', _filename: 'a-stale-filename' })
    assert.equal(formatVmBackupAt(metadata, FILENAME, REPOSITORY).id, FILENAME)
  })

  it('exposes the repository the backup was read from', () => {
    assert.equal(formatVmBackupAt(metadataOf(), FILENAME, REPOSITORY).backupRepository, REPOSITORY)
  })
})

describe('formatVmBackups()', () => {
  const [backup] = formatVmBackups({ [VM]: [metadata] }, 'backup-repository-id')[VM]

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

  it('names the backups exactly like formatVmBackupAt()', () => {
    const metadata = metadataOf({ _filename: FILENAME, id: FILENAME })

    assert.deepEqual(formatVmBackups({ [VM]: [metadata] }, REPOSITORY), {
      [VM]: [formatVmBackupAt(metadata, FILENAME, REPOSITORY)],
    })
  })
})

describe('formatJournalEvents()', () => {
  it('resolves the backup of the events which carry a metadata', () => {
    const metadata = metadataOf()
    const [event] = formatJournalEvents([{ event: 'add', vmUuid: VM, filename: FILENAME, metadata }], REPOSITORY)

    assert.deepEqual(event, {
      event: 'add',
      vmUuid: VM,
      filename: FILENAME,
      backup: formatVmBackupAt(metadata, FILENAME, REPOSITORY),
    })
  })

  it('passes the other events through, without a backup', () => {
    // `del`, and the event kinds this version does not know about
    const events = [
      { event: 'del', vmUuid: VM, filename: FILENAME },
      { event: 'a-future-event', vmUuid: VM, filename: FILENAME },
    ]

    assert.deepEqual(formatJournalEvents(events, REPOSITORY), events)
  })
})
