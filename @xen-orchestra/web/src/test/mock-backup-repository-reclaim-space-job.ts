import { useXoBackupRepositoryReclaimSpaceJob } from '@/modules/backup-repository/jobs/xo-backup-repository-reclaim-space.job.ts'
import { createJobStub } from '@/test/create-job-result.ts'

// The reclaim space job subscribes to server events, unavailable in tests: a test sets its state, reset it in `beforeEach`
export const reclaimSpaceJobMock = createJobStub(useXoBackupRepositoryReclaimSpaceJob)
