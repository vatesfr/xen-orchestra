import { messageToAlarm } from '@/libs/alarm'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useAlarmStore = defineStore('xen-api-alarm', () => {
  const config = createXapiStoreConfig('message', {
    beforeAdd: message => messageToAlarm(message),
  })

  return createSubscribableStoreContext(config, {})
})
