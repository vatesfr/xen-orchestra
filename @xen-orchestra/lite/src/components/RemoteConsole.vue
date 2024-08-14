<template>
  <div ref="vmConsoleContainer" class="vm-console" />
</template>

<script lang="ts" setup>
import { useXenApiStore } from '@/stores/xen-api.store'
import VncClient from '@novnc/novnc/lib/rfb'
import { promiseTimeout } from '@vueuse/shared'
import { fibonacci } from 'iterable-backoff'
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue'

const props = defineProps<{
  location: string
  isConsoleAvailable: boolean
}>()

const N_TOTAL_TRIES = 8
const FIBONACCI_MS_ARRAY: number[] = Array.from(fibonacci().toMs().take(N_TOTAL_TRIES))

const vmConsoleContainer = ref<HTMLDivElement>()
const xenApiStore = useXenApiStore()
const url = computed(() => {
  if (xenApiStore.currentSessionId == null) {
    return
  }
  const _url = new URL(props.location)
  _url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  _url.searchParams.set('session_id', xenApiStore.currentSessionId)
  return _url
})

let vncClient: VncClient | undefined
let nConnectionAttempts = 0

const handleDisconnectionEvent = () => {
  clearVncClient()

  if (props.isConsoleAvailable) {
    nConnectionAttempts++

    if (nConnectionAttempts > N_TOTAL_TRIES) {
      console.error('The number of reconnection attempts has been exceeded for:', props.location)
      return
    }

    console.error(
      `Connection lost for the remote console: ${props.location}. New attempt in ${
        FIBONACCI_MS_ARRAY[nConnectionAttempts - 1]
      }ms`
    )
    createVncConnection()
  }
}
const handleConnectionEvent = () => (nConnectionAttempts = 0)

const clearVncClient = () => {
  if (vncClient === undefined) {
    return
  }

  vncClient.removeEventListener('disconnect', handleDisconnectionEvent)
  vncClient.removeEventListener('connect', handleConnectionEvent)

  vncClient.disconnect()

  vncClient = undefined
}

const createVncConnection = async () => {
  if (nConnectionAttempts !== 0) {
    await promiseTimeout(FIBONACCI_MS_ARRAY[nConnectionAttempts - 1])

    if (vncClient !== undefined) {
      // New VNC Client may have been created in the meantime
      return
    }
  }

  vncClient = new VncClient(vmConsoleContainer.value!, url.value!.toString(), {
    wsProtocols: ['binary'],
  })
  vncClient.scaleViewport = true

  vncClient.addEventListener('disconnect', handleDisconnectionEvent)
  vncClient.addEventListener('connect', handleConnectionEvent)
}

watchEffect(() => {
  if (url.value === undefined || vmConsoleContainer.value === undefined || !props.isConsoleAvailable) {
    return
  }

  nConnectionAttempts = 0

  clearVncClient()
  createVncConnection()
})

onBeforeUnmount(() => {
  clearVncClient()
})

defineExpose({
  sendCtrlAltDel: () => vncClient?.sendCtrlAltDel(),
})
</script>

<style lang="postcss" scoped>
.vm-console {
  height: 80rem;

  & > :deep(div) {
    background-color: transparent !important;
  }
}
</style>
