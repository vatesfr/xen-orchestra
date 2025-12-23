import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { AnyXoBackupJob, XoSchedule } from '@vates/types'
import { computed } from 'vue'

export const useXoScheduleCollection = defineRemoteResource({
  url: '/rest/v0/schedules?fields=id,jobId,name,enabled,cron,timezone',
  initialData: () => [] as XoSchedule[],
  state: (schedules, context) => {
    const state = useXoCollectionState(schedules, {
      context,
      baseName: 'schedule',
    })

    const schedulesByJobId = computed(() => {
      const schedulesByJobIdMap = new Map<AnyXoBackupJob['id'], XoSchedule[]>()

      schedules.value.forEach(schedule => {
        if (!schedulesByJobIdMap.has(schedule.jobId)) {
          schedulesByJobIdMap.set(schedule.jobId, [])
        }
        schedulesByJobIdMap.get(schedule.jobId)!.push(schedule)
      })

      return schedulesByJobIdMap
    })

    return {
      ...state,
      schedulesByJobId,
    }
  },
})
