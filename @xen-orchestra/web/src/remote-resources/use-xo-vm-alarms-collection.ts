import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoAlarm } from '@/types/xo/alarm.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { createDateSorter } from '@core/utils/date-sorter.utils.ts'
import { useSorted } from '@vueuse/core'

export const useXoVmAlarmsCollection = defineRemoteResource({
  url: (vmId: string) => `/rest/v0/vms/${vmId}/alarms?fields=id,time,body,object`,
  initialData: () => [] as XoAlarm[],
  state: (rawVmAlarms, context) => {
    const vmAlarms = useSorted(rawVmAlarms, createDateSorter('time'))

    return useXoCollectionState(vmAlarms, {
      context,
      baseName: 'vmAlarm',
    })
  },
})
