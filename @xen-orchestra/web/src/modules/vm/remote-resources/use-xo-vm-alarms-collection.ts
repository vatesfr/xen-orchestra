import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { createDateSorter } from '@core/utils/date-sorter.utils.ts'
import type { XoAlarm } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { toValue } from 'vue'
import { alarmFields } from '../../alarm/remote-resources/use-xo-alarm-collection.ts'

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
