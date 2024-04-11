import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { useFetch, useIntervalFn } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'

type DemoUser = { first_name: string; last_name: string }

export const useDemoUserStore = defineStore('demo-user', () => {
  const { data, canAbort, abort, execute } = useFetch('https://random-data-api.com/api/v2/users', { immediate: false })
    .get()
    .json<DemoUser>()

  const context = {
    user: data,
    fullName: computed(() => (data.value ? `${data.value.first_name} ${data.value.last_name}` : undefined)),
  }

  const onSubscribe = () => {
    // eslint-disable-next-line no-console
    console.log('Subscribing to user store')
    useIntervalFn(() => execute(), 10000, {
      immediateCallback: true,
    })
  }

  const onUnsubscribe = () => {
    // eslint-disable-next-line no-console
    console.log('Unsubscribing from user store')
    if (canAbort.value) {
      abort()
    }
  }

  return createSubscribableStoreContext({ context, onSubscribe, onUnsubscribe }, {})
})
