<template>
  <div :class="uiStore.isMobile ? 'mobile' : undefined" class="vts-remote-console">
    <div ref="consoleContainer" class="console" />
  </div>
</template>

<script lang="ts" setup>
import { useUiStore } from '@core/stores/ui.store'
import VncClient from '@novnc/novnc/lib/rfb'
import { promiseTimeout } from '@vueuse/shared'
import { fibonacci } from 'iterable-backoff'
import { onBeforeUnmount, ref, watchEffect } from 'vue'

const props = defineProps<{
  url: URL
}>()

const N_TOTAL_TRIES = 8
const FIBONACCI_MS_ARRAY: number[] = Array.from(fibonacci().toMs().take(N_TOTAL_TRIES))

const consoleContainer = ref<HTMLDivElement | null>(null)

let vncClient: VncClient | undefined
let nConnectionAttempts = 0

function handleDisconnectionEvent() {
  clearVncClient()

  nConnectionAttempts++

  if (nConnectionAttempts > N_TOTAL_TRIES) {
    console.error('The number of reconnection attempts has been exceeded for:', props.url)
    return
  }

  console.error(
    `Connection lost for the remote console: ${props.url}. New attempt in ${
      FIBONACCI_MS_ARRAY[nConnectionAttempts - 1]
    }ms`
  )
  createVncConnection()
}

function handleConnectionEvent() {
  nConnectionAttempts = 0
}

function clearVncClient() {
  if (vncClient === undefined) {
    return
  }

  vncClient.removeEventListener('disconnect', handleDisconnectionEvent)
  vncClient.removeEventListener('connect', handleConnectionEvent)
  vncClient.disconnect()

  vncClient = undefined
}

async function createVncConnection() {
  if (nConnectionAttempts !== 0) {
    await promiseTimeout(FIBONACCI_MS_ARRAY[nConnectionAttempts - 1])

    if (vncClient !== undefined) {
      // New VNC Client may have been created in the meantime
      return
    }
  }

  vncClient = new VncClient(consoleContainer.value!, props.url.toString(), {
    wsProtocols: ['binary'],
  })
  vncClient.scaleViewport = true
  vncClient.background = 'transparent'

  vncClient.addEventListener('disconnect', handleDisconnectionEvent)
  vncClient.addEventListener('connect', handleConnectionEvent)
}

watchEffect(() => {
  if (consoleContainer.value === null) {
    return
  }

  nConnectionAttempts = 0

  clearVncClient()
  createVncConnection()
})

onBeforeUnmount(() => {
  clearVncClient()
})

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.vts-remote-console {
  padding: 0.8rem;
  height: 80rem;
  width: 100%;
  max-width: 100%;

  &.mobile {
    padding: 0.8rem 0;
    height: 100%;
    width: 95vw;
  }

  .console {
    height: 100%;
  }
}
</style>
