import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoAlarm } from '@/types/xo/alarm.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { createDateSorter } from '@core/utils/date-sorter.utils.ts'
import { useSorted } from '@vueuse/core'

export const useXoAlarmCollection = defineRemoteResource({
  url: '/rest/v0/alarms?fields=id,time,body,object',
  initialData: () => [] as XoAlarm[],
  state: (rawAlarms, context) => {
    const alarms = useSorted(rawAlarms, createDateSorter('time'))

    return useXoCollectionState(alarms, {
      context,
      baseName: 'alarm',
    })
  },
})
