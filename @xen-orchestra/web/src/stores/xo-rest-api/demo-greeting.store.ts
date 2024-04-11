import { useDemoUserStore } from '@/stores/xo-rest-api/demo-user.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { useIntervalFn } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useDemoGreetingStore = defineStore('demo-greeting', () => {
  const deps = {
    user: useDemoUserStore(),
  }

  const greeting = ref('    Hello')
  const greetingUser = computed(() =>
    deps.user.$context.fullName ? `${greeting.value} ${deps.user.$context.fullName}` : undefined
  )

  const context = {
    greeting,
    greetingUser,
  }

  let index = 0

  const { pause, resume } = useIntervalFn(
    () => {
      // eslint-disable-next-line no-console
      console.log('Updating greeting')
      // Update to a random greeting
      greeting.value = ['    Hello', '       Hi', '      Hey', 'Greetings'][++index % 4]
    },
    2500,
    { immediate: false }
  )

  const onSubscribe = () => resume()

  const onUnsubscribe = () => pause()

  return createSubscribableStoreContext({ context, onSubscribe, onUnsubscribe }, deps)
})
