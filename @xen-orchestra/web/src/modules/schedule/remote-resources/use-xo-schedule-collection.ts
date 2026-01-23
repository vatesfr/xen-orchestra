import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { AnyXoBackupJob, XoSchedule } from '@vates/types'
import { computed } from 'vue'

type FrontXoSchedule = Pick<XoSchedule, (typeof scheduleFields)[number]>

const scheduleFields = [
  'id',
  'jobId',
  'name',
  'enabled',
  'cron',
  'timezone',
] as const satisfies readonly (keyof XoSchedule)[]

export const useXoScheduleCollection = defineRemoteResource({
  url: `${BASE_URL}/schedules?fields=${scheduleFields.join(',')}`,
  initialData: () => [] as FrontXoSchedule[],
  state: (schedules, context) => {
    const state = useXoCollectionState(schedules, {
      context,
      baseName: 'schedule',
    })

    const schedulesByJobId = computed(() => {
      const schedulesByJobIdMap = new Map<AnyXoBackupJob['id'], FrontXoSchedule[]>()

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
