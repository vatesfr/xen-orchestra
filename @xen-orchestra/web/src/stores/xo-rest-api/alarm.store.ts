import type { XoAlarm } from '@/types/xo/alarm.type.ts'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { createDateSorter } from '@core/utils/date-sorter.utils.ts'
import { defineStore } from 'pinia'

export const useAlarmStore = defineStore('alarm', () => {
  const config = createXoStoreConfig('alarm', {
    sortBy: createDateSorter<XoAlarm>('time'),
  })

  return createSubscribableStoreContext(config, {})
})
