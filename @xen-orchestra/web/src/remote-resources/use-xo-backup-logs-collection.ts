import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoBackupLog } from '@/types/xo/backup-log.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { useSorted } from '@vueuse/core'
import { computed } from 'vue'

export const useXoBackupLogsCollection = defineRemoteResource({
  url: '/rest/v0/backup/logs/?fields=id,jobId,status,end',
  initialData: () => [] as XoBackupLog[],
  state: (rawBackupLogs, context) => {
    const backupLogs = useSorted(rawBackupLogs, (log1, log2) => log2.end - log1.end)

    const state = useXoCollectionState(backupLogs, {
      context,
      baseName: 'backupLog',
    })

    const backupLogsByJobId = computed(() => {
      const backupLogsByJobId = new Map<XoBackupLog['jobId'], XoBackupLog[]>()

      backupLogs.value.forEach(backupLog => {
        if (!backupLogsByJobId.has(backupLog.jobId)) {
          backupLogsByJobId.set(backupLog.jobId, [])
        }
        backupLogsByJobId.get(backupLog.jobId)!.push(backupLog)
      })

      return backupLogsByJobId
    })

    const getLastNBackupLogsByJobId = (jobId: XoBackupLog['jobId'], limit: number = 3): XoBackupLog[] => {
      const logs = backupLogsByJobId.value.get(jobId)

      return logs ? logs.slice(0, limit) : []
    }

    return {
      ...state,
      backupLogsByJobId,
      getLastNBackupLogsByJobId,
    }
  },
})
