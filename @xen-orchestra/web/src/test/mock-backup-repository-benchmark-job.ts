import { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import { createJobStub } from '@/test/create-job-result.ts'

// The benchmark job subscribes to server events, unavailable in tests: a test sets its state, reset it in `beforeEach`
export const benchmarkJobMock = createJobStub(useXoBackupRepositoryBenchmarkJob)
