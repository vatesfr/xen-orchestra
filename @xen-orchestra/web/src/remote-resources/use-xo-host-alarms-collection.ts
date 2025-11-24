import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { createDateSorter } from '@core/utils/date-sorter.utils.ts'
import type { XoAlarm } from '@vates/types'
import { useSorted } from '@vueuse/core'

export const useXoHostAlarmsCollection = defineRemoteResource({
  url: (hostId: string) => `/rest/v0/hosts/${hostId}/alarms?fields=id,time,body,object`,
  initialData: () => [] as XoAlarm[],
  state: (rawHostAlarms, context) => {
    const hostAlarms = useSorted(rawHostAlarms, createDateSorter('time'))

    return useXoCollectionState(hostAlarms, {
      context,
      baseName: 'hostAlarm',
    })
  },
})
