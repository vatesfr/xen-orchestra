import {
  type BulkEditBackupRepositoryPayloads,
  useXoBackupRepositoryBulkEditJob,
} from '@/modules/backup-repository/jobs/xo-backup-repository-bulk-edit.job.ts'
import type { EditBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createTwoBrs } from '@/test/create-br.ts'
import { t } from '@/test/i18n.ts'
import { itCannotRun, itReportsEachResult } from '@/test/job-cases.ts'
import { backupRepositoryPatchMock } from '@/test/mock-backup-repository-patch.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { patch, checkHealth } = backupRepositoryPatchMock

beforeEach(() => {
  vi.restoreAllMocks()
  backupRepositoryPatchMock.reset()
})

const [firstBr, secondBr] = createTwoBrs()

function createPayload(name: string): EditBackupRepositoryPayload {
  return { name, url: 'nfs://192.168.1.10:/exports/backups', options: null, proxy: null }
}

const PAYLOADS: BulkEditBackupRepositoryPayloads = new Map([
  [firstBr.id, createPayload('First')],
  [secondBr.id, createPayload('Second')],
])

function mountBulkEditJob(brs: FrontXoBackupRepository[], payloads?: BulkEditBackupRepositoryPayloads) {
  return mountComposable(() =>
    useXoBackupRepositoryBulkEditJob(
      () => brs,
      () => payloads
    )
  ).wrapper.vm
}

describe('run', () => {
  it('patches every repository with its own payload, then checks their health', async () => {
    await mountBulkEditJob([firstBr, secondBr], PAYLOADS).run()

    expect(patch.mock.calls).toEqual([
      [`backup-repositories/${firstBr.id}`, createPayload('First')],
      [`backup-repositories/${secondBr.id}`, createPayload('Second')],
    ])
    expect(checkHealth.mock.calls).toEqual([[firstBr.id], [secondBr.id]])
  })

  itReportsEachResult({
    subject: 'repository',
    request: patch,
    errorMessage: 'Backup repository unreachable',
    run: () => mountBulkEditJob([firstBr, secondBr], PAYLOADS).run(),
    expectAfter: () => expect(checkHealth.mock.calls).toEqual([[secondBr.id]]),
  })

  it('refuses to run without the payload of every repository', async () => {
    const job = mountBulkEditJob([firstBr, secondBr], new Map([[firstBr.id, createPayload('First')]]))

    await expect(job.run()).rejects.toThrow(t('job:backup-repository-bulk-edit:missing-payload'))
    expect(patch).not.toHaveBeenCalled()
  })
})

describe('validate', () => {
  // The payloads only exist once the drawer is confirmed
  it('can run with repositories, before the payloads exist', () => {
    expect(mountBulkEditJob([firstBr]).canRun).toBe(true)
  })

  itCannotRun([
    {
      name: 'cannot run without repository',
      mountJob: () => mountBulkEditJob([]),
      errorMessage: t('job:backup-repository-bulk-edit:missing-backup-repository'),
    },
  ])
})
