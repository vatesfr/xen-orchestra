import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { watchCollectionWrapper } from '@/utils/sse.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { createDateSorter } from '@core/utils/date-sorter.utils.ts'
import type { XoAlarm } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { toValue } from 'vue'
import { alarmFields } from './use-xo-alarm-collection'

export const useXoVmAlarmsCollection = defineRemoteResource({
  url: (vmId: string) => `/rest/v0/vms/${vmId}/alarms?fields=${alarmFields.join(',')}`,
  initialData: () => [] as XoAlarm[],
  watchCollection: watchCollectionWrapper<XoAlarm>({
    collectionId: 'vmAlarm',
    resource: 'alarm',
    fields: alarmFields,
    predicate(alarm, context) {
      if (context === undefined || context.args === undefined || Array.isArray(alarm)) {
        return true
      }

      const [id] = context.args
      const vmId = toValue(id)

      return alarm.object.uuid === vmId
    },
  }),
  state: (rawVmAlarms, context) => {
    const vmAlarms = useSorted(rawVmAlarms, createDateSorter('time'))

    return useXoCollectionState(vmAlarms, {
      context,
      baseName: 'vmAlarm',
    })
  },
})
