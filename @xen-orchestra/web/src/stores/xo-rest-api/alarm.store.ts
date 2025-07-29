import type { XoAlarm } from '@/types/xo/alarm.type.ts'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useAlarmStore = defineStore('alarm', () => {
  const config = createXoStoreConfig('alarm', {
    sortBy: sortByDate,
  })

  return createSubscribableStoreContext(config, {})
})

function sortByDate(alarm1: XoAlarm, alarm2: XoAlarm) {
  return new Date(alarm2.time).getTime() - new Date(alarm1.time).getTime()
}
