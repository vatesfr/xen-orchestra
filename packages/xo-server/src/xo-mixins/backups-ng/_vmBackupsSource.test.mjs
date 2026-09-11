import assert from 'node:assert/strict'
import Disposable from 'promise-toolbox/Disposable'
import { describe, it } from 'node:test'

import { VmBackupsSource } from './_vmBackupsSource.mjs'

const REPOSITORY = { id: 'a-repository-id', url: 'file:///media/backup' }
const VM = 'a-vm-uuid'

// `RemoteAdapter` lists and writes the metadata with a leading slash
const filenameOf = name => `/xo-vm-backups/${VM}/${name}.json`

const metadataOf = (name, props) => ({
  _filename: filenameOf(name),
  jobId: 'a-job-id',
  mode: 'full',
  scheduleId: 'a-schedule-id',
  size: 1,
  timestamp: Date.parse(`${name}Z`),
  vm: { uuid: VM, name_label: 'a VM', name_description: '', tags: [] },
  ...props,
})

// instantiates the source with the minimum an `Xo` app provides to it
const createSource = adapter =>
  new VmBackupsSource({
    getBackupsRemoteAdapter(repository) {
      assert.equal(repository.id, REPOSITORY.id)
      return new Disposable(() => {}, adapter)
    },
  })

describe('listAll()', () => {
  it('keys the backups of each VM by the name of their metadata', async () => {
    const metadata = metadataOf('20260811T090000')
    const source = createSource({ listAllVmBackups: async () => ({ [VM]: [metadata] }) })

    const backupsByVm = await source.listAll(REPOSITORY)

    assert.deepEqual(Object.keys(backupsByVm[VM]), [metadata._filename])
    const backup = backupsByVm[VM][metadata._filename]
    assert.equal(backup.id, metadata._filename)
    assert.equal(backup.backupRepository, REPOSITORY.id)
    assert.equal(backup.size, 1)
  })
})

describe('listOneVm()', () => {
  it('lists a single VM, keyed like a full listing', async () => {
    const metadata = metadataOf('20260811T090000')
    const source = createSource({
      listVmBackups: async vmUuid => {
        assert.equal(vmUuid, VM)
        return [metadata]
      },
    })

    assert.deepEqual(Object.keys(await source.listOneVm(REPOSITORY, VM)), [metadata._filename])
  })
})

describe('readJournal()', () => {
  it('resolves the backups the events are about and passes the deletions through', async () => {
    const metadata = metadataOf('20260811T090000')
    const source = createSource({
      readBackupJournalEvents: async (cursor, opts) => {
        assert.equal(cursor, 'a-cursor')
        assert.deepEqual(opts, { mustExist: false })
        return {
          cursor: 'the-next-cursor',
          events: [
            { event: 'change', vmUuid: VM, filename: metadata._filename, metadata },
            { event: 'del', vmUuid: VM, filename: filenameOf('20260811T093000') },
          ],
        }
      },
    })

    const { events, cursor } = await source.readJournal(REPOSITORY, 'a-cursor', { mustExist: false })

    assert.equal(cursor, 'the-next-cursor', 'the cursor of the read must be forwarded untouched')
    assert.equal(events[0].backup.id, metadata._filename)
    assert.equal(events[0].backup.backupRepository, REPOSITORY.id)
    assert.equal(events[1].backup, undefined, 'a deletion carries no backup')
    assert.equal(events[1].filename, filenameOf('20260811T093000'))
  })
})
