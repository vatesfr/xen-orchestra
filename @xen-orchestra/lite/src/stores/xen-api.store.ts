import XapiStats from '@/libs/xapi-stats'
import XenApi from '@/libs/xen-api/xen-api'
import { useLocalStorage, useSessionStorage, whenever } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const HOST_URL = import.meta.env.PROD ? window.origin : import.meta.env.VITE_XO_HOST

enum STATUS {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
}

export const useXenApiStore = defineStore('xen-api', () => {
  // undefined not correctly handled. See https://github.com/vueuse/vueuse/issues/3595
  const masterSessionStorage = useSessionStorage<null | string>('master', null)
  const router = useRouter()
  const route = useRoute()

  whenever(
    () => route.query.master,
    async newMaster => {
      masterSessionStorage.value = newMaster as string
      await router.replace({ query: { ...route.query, master: undefined } })
      window.location.reload()
    }
  )

  const hostUrl = new URL(HOST_URL)
  if (masterSessionStorage.value !== null) {
    hostUrl.hostname = masterSessionStorage.value
  }

  const isPoolOverridden = hostUrl.origin !== new URL(HOST_URL).origin
  const xenApi = new XenApi(hostUrl.origin)
  const xapiStats = new XapiStats(xenApi)
  const storedSessionId = useLocalStorage<string | undefined>('sessionId', undefined)
  const currentSessionId = ref(storedSessionId.value)
  const rememberMe = useLocalStorage('rememberMe', false)
  const status = ref(STATUS.DISCONNECTED)
  const isConnected = computed(() => status.value === STATUS.CONNECTED)
  const isConnecting = computed(() => status.value === STATUS.CONNECTING)
  const getXapi = () => xenApi
  const getXapiStats = () => xapiStats

  watchEffect(() => {
    storedSessionId.value = rememberMe.value ? currentSessionId.value : undefined
  })

  const connect = async (username: string, password: string) => {
    status.value = STATUS.CONNECTING

    try {
      currentSessionId.value = await xenApi.connectWithPassword(username, password)
      const success = currentSessionId.value !== undefined
      status.value = success ? STATUS.CONNECTED : STATUS.DISCONNECTED
      return success
    } catch (error) {
      status.value = STATUS.DISCONNECTED
      throw error
    }
  }

  const reconnect = async () => {
    if (currentSessionId.value === undefined) {
      return false
    }

    status.value = STATUS.CONNECTING

    try {
      const success = await xenApi.connectWithSessionId(currentSessionId.value)
      status.value = success ? STATUS.CONNECTED : STATUS.DISCONNECTED
      return success
    } catch (error) {
      status.value = STATUS.DISCONNECTED
      throw error
    }
  }

  async function disconnect() {
    await xenApi.disconnect()
    currentSessionId.value = undefined
    status.value = STATUS.DISCONNECTED
  }

  function resetPoolMasterIp() {
    masterSessionStorage.value = null
    window.location.reload()
  }

  return {
    isConnected,
    isConnecting,
    isPoolOverridden,
    connect,
    reconnect,
    disconnect,
    getXapi,
    getXapiStats,
    currentSessionId,
    resetPoolMasterIp,
  }
})
