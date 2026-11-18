import type {
  FrontXoBackupLog,
  useXoBackupLogCollection as realUseXoBackupLogCollection,
} from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { groupBy } from '@/test/group-by.ts'
import { computed, ref } from 'vue'

// Shared state of the mocked backup log collection: a test sets the backup logs it needs, reset it in `beforeEach`
export const backupLogCollectionMock = {
  backupLogs: ref<FrontXoBackupLog[]>([]),
  areBackupLogsReady: ref(true),
  reset() {
    this.backupLogs.value = []
    this.areBackupLogsReady.value = true
  },
}

// As in the real collection, the latest backup logs come first
const sortedBackupLogs = computed(() =>
  [...backupLogCollectionMock.backupLogs.value].sort((log1, log2) => log2.start - log1.start)
)

const backupLogsByJobId = computed(() => groupBy(sortedBackupLogs.value, backupLog => backupLog.jobId))

// Use as `mockModule(import('@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'), () => import('@/test/mock-xo-backup-log-collection.ts'))`
export const useXoBackupLogCollection = (() => ({
  backupLogs: sortedBackupLogs,
  areBackupLogsReady: backupLogCollectionMock.areBackupLogsReady,
  backupLogsByJobId,
  getLastNBackupLogsByJobId: (jobId: FrontXoBackupLog['jobId'], limit = 3) =>
    backupLogsByJobId.value.get(jobId)?.slice(0, limit) ?? [],
})) as unknown as typeof realUseXoBackupLogCollection
