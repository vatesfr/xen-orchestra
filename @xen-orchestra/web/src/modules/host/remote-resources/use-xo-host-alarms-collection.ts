import { alarmFields, type FrontXoAlarm } from '@/modules/alarm/remote-resources/use-xo-alarm-collection.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { useWatchCollection } from '@core/composables/watch-collection.composable.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { createDateSorter } from '@core/utils/date-sorter.utils.ts'
import { useSorted } from '@vueuse/core'
import { toValue } from 'vue'

export const useXoHostAlarmsCollection = defineRemoteResource({
  url: (hostId: string) => `${BASE_URL}/hosts/${hostId}/alarms?fields=${alarmFields.join(',')}`,
  initialData: () => [] as FrontXoAlarm[],
  initWatchCollection: () =>
    useWatchCollection<FrontXoAlarm>({
      collectionId: 'hostAlarm',
      resource: 'alarm',
      fields: alarmFields,
      predicate(alarm, context) {
        if (context === undefined || context.args === undefined || Array.isArray(alarm)) {
          return true
        }

        const [id] = context.args
        const hostId = toValue(id)

        return alarm.object.uuid === hostId
      },
    }),
  state: (rawHostAlarms, context) => {
    const hostAlarms = useSorted(rawHostAlarms, createDateSorter('time'))

    return useXoCollectionState(hostAlarms, {
      context,
      baseName: 'hostAlarm',
    })
  },
})
