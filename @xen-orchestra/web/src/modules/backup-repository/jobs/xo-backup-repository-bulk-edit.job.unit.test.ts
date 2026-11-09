import {
  type BulkEditBackupRepositoryPayloads,
  useXoBackupRepositoryBulkEditJob,
} from '@/modules/backup-repository/jobs/xo-backup-repository-bulk-edit.job.ts'
import type { EditBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { checkBackupRepositoryHealth } from '@/modules/backup-repository/utils/xo-backup-repository-health.util.ts'
import type { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { createBr } from '@/test/create-br.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { patch, checkHealth } = vi.hoisted(() => ({
  patch: vi.fn(),
  checkHealth: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPatch: patch as unknown as typeof fetchPatch,
}))

vi.mock(import('@/modules/backup-repository/utils/xo-backup-repository-health.util.ts'), () => ({
  checkBackupRepositoryHealth: checkHealth as unknown as typeof checkBackupRepositoryHealth,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  patch.mockReset()
  checkHealth.mockReset()

  patch.mockResolvedValue(undefined)
  checkHealth.mockResolvedValue(undefined)
})

const firstBr = createBr({ id: 'backup-repository-1' as FrontXoBackupRepository['id'] })
const secondBr = createBr({ id: 'backup-repository-2' as FrontXoBackupRepository['id'] })

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

  it('reports each repository result, without stopping at the first failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Backup repository unreachable')
    patch.mockRejectedValueOnce(error)

    const results = await mountBulkEditJob([firstBr, secondBr], PAYLOADS).run()

    expect(results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'fulfilled', value: undefined },
    ])
    expect(checkHealth.mock.calls).toEqual([[secondBr.id]])
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

  it('cannot run without repository', () => {
    const job = mountBulkEditJob([])

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-repository-bulk-edit:missing-backup-repository'))
  })
})
