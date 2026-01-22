import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { useWatchCollection } from '@core/composables/watch-collection.composable.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoAlarm } from '@vates/types'
import { useSorted } from '@vueuse/core'

export const alarmFields: (keyof XoAlarm)[] = ['id', 'time', 'body', 'object', 'type'] as const

export const useXoAlarmCollection = defineRemoteResource({
  url: `/rest/v0/alarms?fields=${alarmFields.join(',')}`,
  initWatchCollection: () => useWatchCollection({ resource: 'alarm', fields: alarmFields }),
  initialData: () => [] as XoAlarm[],
  state: (rawAlarms, context) => {
    const alarms = useSorted(rawAlarms, (alarm1, alarm2) => alarm2.time - alarm1.time)

    return useXoCollectionState(alarms, {
      context,
      baseName: 'alarm',
    })
  },
})
