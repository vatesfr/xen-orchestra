import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoAlarm } from '@vates/types'
import { useSorted } from '@vueuse/core'

export type FrontXoAlarm = Pick<XoAlarm, (typeof alarmFields)[number]>

export const alarmFields = ['id', 'time', 'body', 'object', 'type'] as const satisfies readonly (keyof XoAlarm)[]

export const useXoAlarmCollection = defineRemoteResource({
  url: `${BASE_URL}/alarms?fields=${alarmFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'alarm', fields: alarmFields }),
  initialData: () => [] as FrontXoAlarm[],
  state: (rawAlarms, context) => {
    const alarms = useSorted(rawAlarms, (alarm1, alarm2) => alarm2.time - alarm1.time)

    return useXoCollectionState(alarms, {
      context,
      baseName: 'alarm',
    })
  },
})
