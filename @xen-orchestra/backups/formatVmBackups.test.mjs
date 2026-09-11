import test from 'node:test'
import { strict as assert } from 'node:assert'

import { formatJournalEvents, formatVmBackupAt, formatVmBackups } from './formatVmBackups.mjs'

const { describe } = test

const VM = 'a-vm-uuid'
const REPOSITORY = 'a-repository-id'

const FILENAME = `/xo-vm-backups/${VM}/20260811T090000Z.json`

const metadataOf = props => ({
  jobId: 'a-job-id',
  mode: 'full',
  scheduleId: 'a-schedule-id',
  size: 1,
  timestamp: Date.parse('20260811T090000Z'),
  vm: { uuid: VM, name_label: 'a VM', name_description: '', tags: [] },
  ...props,
})

describe('formatVmBackupAt()', () => {
  test('names a backup after the normalized path of its metadata', () => {
    // the journal entries and the on-repository cache don't agree on the leading slash
    for (const filename of [FILENAME, FILENAME.slice(1)]) {
      assert.equal(formatVmBackupAt(metadataOf(), filename, REPOSITORY).id, FILENAME)
    }
  })

  test('derives the disk ids from the normalized path', () => {
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

  test('ignores the id the metadata may already carry', () => {
    const metadata = metadataOf({ id: 'a-stale-id', _filename: 'a-stale-filename' })
    assert.equal(formatVmBackupAt(metadata, FILENAME, REPOSITORY).id, FILENAME)
  })

  test('exposes the repository the backup was read from', () => {
    assert.equal(formatVmBackupAt(metadataOf(), FILENAME, REPOSITORY).backupRepository, REPOSITORY)
  })
})

describe('formatVmBackups()', () => {
  test('names the backups exactly like formatVmBackupAt()', () => {
    const metadata = metadataOf({ _filename: FILENAME, id: FILENAME })

    assert.deepEqual(formatVmBackups({ [VM]: [metadata] }, REPOSITORY), {
      [VM]: [formatVmBackupAt(metadata, FILENAME, REPOSITORY)],
    })
  })
})

describe('formatJournalEvents()', () => {
  test('resolves the backup of the events which carry a metadata', () => {
    const metadata = metadataOf()
    const [event] = formatJournalEvents([{ event: 'add', vmUuid: VM, filename: FILENAME, metadata }], REPOSITORY)

    assert.deepEqual(event, {
      event: 'add',
      vmUuid: VM,
      filename: FILENAME,
      backup: formatVmBackupAt(metadata, FILENAME, REPOSITORY),
    })
  })

  test('passes the other events through, without a backup', () => {
    // `del`, and the event kinds this version does not know about
    const events = [
      { event: 'del', vmUuid: VM, filename: FILENAME },
      { event: 'a-future-event', vmUuid: VM, filename: FILENAME },
    ]

    assert.deepEqual(formatJournalEvents(events, REPOSITORY), events)
  })
})
