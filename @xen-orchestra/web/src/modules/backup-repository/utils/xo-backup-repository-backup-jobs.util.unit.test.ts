import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { getBackupJobsUsingBackupRepository } from '@/modules/backup-repository/utils/xo-backup-repository-backup-jobs.util.ts'
import { createBr } from '@/test/create-br.ts'

describe('getBackupJobsUsingBackupRepository', () => {
  // createBr() has the id backup-repository-123
  const br = createBr()

  function createBackupJob(overrides: Record<string, unknown>) {
    return { id: 'backup-job-1', name: 'Backup job', type: 'backup', ...overrides } as unknown as FrontAnyXoBackupJob
  }

  it('finds the jobs targeting the repository', () => {
    const singleTarget = createBackupJob({ id: 'single', remotes: { id: 'backup-repository-123' } })
    const multipleTargets = createBackupJob({
      id: 'multiple',
      remotes: { id: { __or: ['backup-repository-456', 'backup-repository-123'] } },
    })

    expect(getBackupJobsUsingBackupRepository(br.id, [singleTarget, multipleTargets])).toEqual([
      singleTarget,
      multipleTargets,
    ])
  })

  it('finds the mirror jobs using the repository as source', () => {
    const mirrorJob = createBackupJob({
      type: 'mirrorBackup',
      sourceRemote: 'backup-repository-123',
      remotes: { id: 'backup-repository-456' },
    })

    expect(getBackupJobsUsingBackupRepository(br.id, [mirrorJob])).toEqual([mirrorJob])
  })

  it('ignores the jobs using other repositories only', () => {
    const otherTarget = createBackupJob({ remotes: { id: 'backup-repository-456' } })
    const otherSource = createBackupJob({
      type: 'mirrorBackup',
      sourceRemote: 'backup-repository-789',
      remotes: { id: 'backup-repository-456' },
    })

    expect(getBackupJobsUsingBackupRepository(br.id, [otherTarget, otherSource])).toEqual([])
  })
})
