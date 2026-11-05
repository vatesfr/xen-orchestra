import { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
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

function mountChangeStateJob(brs: FrontXoBackupRepository[], enabled: boolean) {
  return mountComposable(() =>
    useXoBackupRepositoryChangeStateJob(
      () => brs,
      () => enabled
    )
  ).wrapper.vm
}

describe('run', () => {
  it('connects every repository, then checks their health', async () => {
    await mountChangeStateJob([firstBr, secondBr], true).run()

    expect(patch.mock.calls).toEqual([
      [`backup-repositories/${firstBr.id}`, { enabled: true }],
      [`backup-repositories/${secondBr.id}`, { enabled: true }],
    ])
    expect(checkHealth.mock.calls).toEqual([[firstBr.id], [secondBr.id]])
  })

  it('disables every repository without checking their health', async () => {
    await mountChangeStateJob([firstBr, secondBr], false).run()

    expect(patch.mock.calls).toEqual([
      [`backup-repositories/${firstBr.id}`, { enabled: false }],
      [`backup-repositories/${secondBr.id}`, { enabled: false }],
    ])
    expect(checkHealth).not.toHaveBeenCalled()
  })

  it('reports each repository result, without stopping at the first failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Backup repository unreachable')
    patch.mockRejectedValueOnce(error)

    const results = await mountChangeStateJob([firstBr, secondBr], true).run()

    expect(results).toEqual([
      { status: 'rejected', reason: error },
      { status: 'fulfilled', value: undefined },
    ])
    expect(checkHealth.mock.calls).toEqual([[secondBr.id]])
  })
})

describe('validate', () => {
  it('can run with repositories', () => {
    expect(mountChangeStateJob([firstBr], true).canRun).toBe(true)
  })

  it('cannot run without repository', () => {
    const job = mountChangeStateJob([], true)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:backup-repository-change-state:missing-backup-repository'))
  })
})
