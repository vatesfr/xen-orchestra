<template>
  <div :class="uiStore.isMobile ? 'mobile' : undefined" class="vts-remote-console">
    <VtsLoadingHero :disabled="isReady" type="panel" />
    <div ref="console-container" class="console" />
  </div>
</template>

<script lang="ts" setup>
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import { useUiStore } from '@core/stores/ui.store'
import VncClient from '@novnc/novnc/lib/rfb'
import { promiseTimeout } from '@vueuse/shared'
import { fibonacci } from 'iterable-backoff'
import { onBeforeUnmount, ref, useTemplateRef, watchEffect } from 'vue'

const props = defineProps<{
  url: URL
  isConsoleAvailable: boolean
}>()

const uiStore = useUiStore()

const N_TOTAL_TRIES = 8
const FIBONACCI_MS_ARRAY: number[] = Array.from(fibonacci().toMs().take(N_TOTAL_TRIES))

const consoleContainer = useTemplateRef<HTMLDivElement | null>('console-container')
const isReady = ref(false)

let vncClient: VncClient | undefined
let nConnectionAttempts = 0

function handleDisconnectionEvent() {
  clearVncClient()
  if (props.isConsoleAvailable) {
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
}

function handleConnectionEvent() {
  nConnectionAttempts = 0
  isReady.value = true
}

function clearVncClient() {
  isReady.value = false
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
  const canvas = consoleContainer.value?.querySelector('canvas') as HTMLCanvasElement | null
  if (canvas !== null) {
    // Todo: See with Clémence to specify the desired focus behavior
    canvas.setAttribute('tabindex', '0')
    canvas.addEventListener('focus', () => {
      canvas.classList.add('focused')
    })

    canvas.addEventListener('blur', () => {
      canvas.classList.remove('focused')
    })
  }
}

watchEffect(() => {
  if (consoleContainer.value === null || !props.isConsoleAvailable) {
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
.vts-remote-console {
  flex-grow: 1;
  max-width: 100%;

  &.mobile {
    padding: 0.8rem 0;
    height: 100%;
    width: 95vw;
  }

  .console {
    height: 100%;
  }

  /* Required because the library adds "margin: auto" to the canvas which makes the canvas centered in space and not aligned to the rest of the layout */
  :deep(canvas) {
    margin: 0 auto !important;
    cursor: default !important;
    border: 6px solid transparent;

    &.focused {
      border: var(--color-success-txt-base) 6px solid;
    }
  }
}
</style>
