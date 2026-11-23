import { checkBackupRepositoryHealth } from '@/modules/backup-repository/utils/xo-backup-repository-health.util.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

// The requests of a job changing backup repositories: each `fetchPatch`, then the health check of the repository it
// changed, settle with no result after a reset. Reset it in `beforeEach`
export const backupRepositoryPatchMock = {
  patch: mockedExport(fetchPatch),
  checkHealth: mockedExport(checkBackupRepositoryHealth),
  reset() {
    this.patch.mockResolvedValue(undefined)
    this.checkHealth.mockResolvedValue(undefined)
  },
}
