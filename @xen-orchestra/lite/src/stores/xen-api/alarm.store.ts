import { messageToAlarm } from '@/libs/alarm.ts'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const useAlarmStore = defineStore('xen-api-alarm', () => {
  const config = createXapiStoreConfig('message', {
    beforeAdd: message => messageToAlarm(message),
  })

  return createSubscribableStoreContext(config, {})
})
