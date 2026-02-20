import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoBackupLog } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { computed } from 'vue'

export type FrontXoBackupLog = Pick<XoBackupLog, (typeof backupLogFields)[number]>

const backupLogFields = [
  'id',
  'jobId',
  'status',
  'start',
  'end',
  'tasks',
] as const satisfies readonly (keyof XoBackupLog)[]

export const useXoBackupLogCollection = defineRemoteResource({
  url: `${BASE_URL}/backup-logs?fields=${backupLogFields.join(',')}`,
  initialData: () => [] as FrontXoBackupLog[],
  state: (rawBackupLogs, context) => {
    const backupLogs = useSorted(rawBackupLogs, (log1, log2) => log2.start - log1.start)

    const state = useXoCollectionState(backupLogs, {
      context,
      baseName: 'backupLog',
    })

    const backupLogsByJobId = computed(() => {
      const backupLogsByJobIdMap = new Map<XoBackupLog['jobId'], FrontXoBackupLog[]>()

      backupLogs.value.forEach(backupLog => {
        if (!backupLogsByJobIdMap.has(backupLog.jobId)) {
          backupLogsByJobIdMap.set(backupLog.jobId, [])
        }
        backupLogsByJobIdMap.get(backupLog.jobId)!.push(backupLog)
      })

      return backupLogsByJobIdMap
    })

    const getLastNBackupLogsByJobId = (jobId: XoBackupLog['jobId'], limit: number = 3): FrontXoBackupLog[] => {
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
