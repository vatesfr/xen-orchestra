import type { FrontAnyXoBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { safePushInMap } from '@/shared/utils/map.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoSchedule } from '@vates/types'
import { ref, watch } from 'vue'

export type FrontXoSchedule = Pick<XoSchedule, (typeof scheduleFields)[number]>

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

    const schedulesByJobId = ref(new Map<FrontAnyXoBackupJob['id'], FrontXoSchedule[]>())

    watch(schedules, _schedules => {
      const tmpSchedulesByJobId = new Map<FrontAnyXoBackupJob['id'], FrontXoSchedule[]>()

      _schedules.forEach(schedule => {
        safePushInMap(tmpSchedulesByJobId, schedule.jobId, schedule)
      })

      schedulesByJobId.value = tmpSchedulesByJobId
    })

    return {
      ...state,
      schedulesByJobId,
    }
  },
})
