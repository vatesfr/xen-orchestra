import { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
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

  itReportsEachResult({
    subject: 'repository',
    request: patch,
    errorMessage: 'Backup repository unreachable',
    run: () => mountChangeStateJob([firstBr, secondBr], true).run(),
    expectAfter: () => expect(checkHealth.mock.calls).toEqual([[secondBr.id]]),
  })
})

describe('validate', () => {
  it('can run with repositories', () => {
    expect(mountChangeStateJob([firstBr], true).canRun).toBe(true)
  })

  itCannotRun([
    {
      name: 'cannot run without repository',
      mountJob: () => mountChangeStateJob([], true),
      errorMessage: t('job:backup-repository-change-state:missing-backup-repository'),
    },
  ])
})
