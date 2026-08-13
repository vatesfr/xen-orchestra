import assert from 'node:assert/strict'
import Disposable from 'promise-toolbox/Disposable'
import { describe, it } from 'node:test'

import BackupNg from './index.mjs'

const REMOTE_ID = 'a-remote-id'
const VM = 'a-vm-uuid'

const filenameOf = name => `xo-vm-backups/${VM}/${name}.json`

const metadataOf = name => ({
  _filename: filenameOf(name),
  jobId: 'a-job-id',
  mode: 'full',
  scheduleId: 'a-schedule-id',
  size: 1,
  timestamp: Date.parse(`${name}Z`),
  vm: { uuid: VM, name_label: 'a VM', name_description: '', tags: [] },
})

// mock of the subset of `RemoteAdapter` used to list and delete the backups
class Repository {
  metadataByFilename = new Map()
  journal = []

  nListings = 0

  constructor(metadata) {
    metadata.forEach(_ => this.metadataByFilename.set(_._filename, _))
  }

  get adapter() {
    return {
      deleteVmBackups: async filenames => {
        for (const filename of filenames) {
          this.metadataByFilename.delete(filename)
          this.journal.push({ event: 'del', filename, vmUuid: VM, date: Date.now() })
        }
      },
      listAllVmBackups: async () => {
        this.nListings++
        return { [VM]: [...this.metadataByFilename.values()] }
      },
      readBackupJournal: async since => this.journal.filter(_ => _.date > since),
      readVmBackupMetadata: async filename => this.metadataByFilename.get(filename),
    }
  }
}

// instantiates the mixin with the minimum an `Xo` app provides to it
const createBackupNg = repository => {
  const app = {
    config: { getDuration: () => 60e3 },
    getBackupsRemoteAdapter: () => new Disposable(() => {}, repository.adapter),
    getRemoteWithCredentials: async id => {
      assert.equal(id, REMOTE_ID)
      return { id: REMOTE_ID, url: 'file:///media/backup' }
    },
    hooks: { on() {} },
  }
  return new BackupNg(app)
}

const idsOf = backupsByVmByRemote => backupsByVmByRemote[REMOTE_ID][VM].map(_ => _.id)

describe('deleteVmBackupsNg', () => {
  it('makes the deletion visible at once, without listing the repository again', async () => {
    const repository = new Repository([metadataOf('20260811T090000'), metadataOf('20260811T093000')])
    const backupNg = createBackupNg(repository)

    assert.deepEqual(idsOf(await backupNg.listVmBackupsNg([REMOTE_ID])), [
      `${REMOTE_ID}/${filenameOf('20260811T090000')}`,
      `${REMOTE_ID}/${filenameOf('20260811T093000')}`,
    ])

    await backupNg.deleteVmBackupsNg([`${REMOTE_ID}/${filenameOf('20260811T093000')}`])

    // the deletion is replayed from the journal, well before the end of the refresh window
    assert.deepEqual(idsOf(await backupNg.listVmBackupsNg([REMOTE_ID])), [
      `${REMOTE_ID}/${filenameOf('20260811T090000')}`,
    ])
    assert.equal(repository.nListings, 1)
  })
})

describe('purgeVmBackupsCache', () => {
  it('makes the next listing read the repository from scratch', async () => {
    const repository = new Repository([metadataOf('20260811T090000')])
    const backupNg = createBackupNg(repository)

    await backupNg.listVmBackupsNg([REMOTE_ID])
    assert.equal(repository.nListings, 1)

    // as the `remotes` mixin does when the repository is gone or has been reconfigured
    backupNg.purgeVmBackupsCache(REMOTE_ID)

    await backupNg.listVmBackupsNg([REMOTE_ID])
    assert.equal(repository.nListings, 2)
  })
})
