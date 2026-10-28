<template>
  <div :class="uiStore.isSmall ? 'mobile' : undefined" class="vts-remote-console">
    <VtsStateHero v-if="!isReady" format="page" type="busy" size="medium">{{ t('loading') }}</VtsStateHero>
    <div ref="console-container" class="console" />
  </div>
</template>

<script lang="ts" setup>
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { KeyboardLayoutId } from '@core/types/keyboard-layout.type.ts'
import { getKeyboardLayout, getKeysymKeyStrokes, typeText } from '@core/utils/keyboard-layout.util.ts'
import type NoVncClient from '@novnc/novnc/lib/rfb'
import _RFB from '@novnc/novnc/lib/rfb'
import { whenever } from '@vueuse/core'
import { promiseTimeout } from '@vueuse/shared'
import { fibonacci } from 'iterable-backoff'
import { onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type RemoteConsoleTypeText = (text: string, layoutId?: KeyboardLayoutId) => Promise<string[]> | undefined

export type RemoteConsoleExposed = {
  isConnected: boolean
  sendCtrlAltDel: () => void
  typeText: RemoteConsoleTypeText
}

const { url, isConsoleAvailable } = defineProps<{
  url: URL
  isConsoleAvailable: boolean
}>()

const emit = defineEmits<{
  clipboard: [text: string]
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const N_TOTAL_TRIES = 8
const FIBONACCI_MS_ARRAY: number[] = Array.from(fibonacci().toMs().take(N_TOTAL_TRIES))

const consoleContainer = useTemplateRef<HTMLDivElement | null>('console-container')
const isReady = ref(false)

// See https://rolldown.rs/in-depth/bundling-cjs#ambiguous-default-import-from-cjs-modules
const VncClient = typeof _RFB === 'object' && _RFB !== null && (_RFB as any).__esModule ? (_RFB as any).default : _RFB

let vncClient: NoVncClient | undefined
let nConnectionAttempts = 0

function handleDisconnectionEvent() {
  clearVncClient()
  if (isConsoleAvailable) {
    nConnectionAttempts++

    if (nConnectionAttempts > N_TOTAL_TRIES) {
      console.error('The number of reconnection attempts has been exceeded for:', url)
      return
    }

    console.error(
      `Connection lost for the remote console: ${url}. New attempt in ${FIBONACCI_MS_ARRAY[nConnectionAttempts - 1]}ms`
    )
    createVncConnection()
  }
}

function handleConnectionEvent() {
  nConnectionAttempts = 0
  isReady.value = true
}

function handleClipboardEvent(event: CustomEvent<{ text: string }>) {
  emit('clipboard', event.detail.text)
}

function clearVncClient() {
  isReady.value = false
  if (vncClient === undefined) {
    return
  }

  vncClient.removeEventListener('clipboard', handleClipboardEvent)
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

  vncClient = new VncClient(consoleContainer.value!, url.toString(), {
    wsProtocols: ['binary'],
  }) as NoVncClient
  vncClient.scaleViewport = true
  vncClient.background = 'transparent'

  vncClient.addEventListener('disconnect', handleDisconnectionEvent)
  vncClient.addEventListener('connect', handleConnectionEvent)
  vncClient.addEventListener('clipboard', handleClipboardEvent)
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

whenever(
  () => uiStore.hasUi,
  () => {
    if (!vncClient) {
      return
    }
    // the state is changed from false to true for xo-lite to trigger the change
    vncClient.scaleViewport = false
    vncClient.scaleViewport = true
  }
)

// `consoleContainer` is a shallow ref: passing it directly in a multi-source watch forces the callback
// to run each time `url` gets a new (but identical) URL object, which reconnected the console on every VM update
watch(
  [() => consoleContainer.value, () => isConsoleAvailable, () => url.toString()],
  ([container, isAvailable]) => {
    if (container === null || !isAvailable) {
      return
    }

    nConnectionAttempts = 0

    clearVncClient()
    createVncConnection()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  clearVncClient()
})

function typeTextInConsole(text: string, layoutId?: KeyboardLayoutId) {
  const client = vncClient

  if (client === undefined) {
    return
  }

  // not exposed by noVNC and only true when the server announced the QEMU extended key event, which the host console does not
  const isScancodeSupported = '_qemuExtKeyEventSupported' in client && client._qemuExtKeyEventSupported === true

  return typeText(
    (keysym, code, down) => client.sendKey(keysym, code, down),
    text,
    isScancodeSupported && layoutId !== undefined ? getKeyboardLayout(layoutId).getKeyStrokes : getKeysymKeyStrokes,
    () => vncClient !== client
  )
}

defineExpose({
  isConnected: isReady,
  sendCtrlAltDel: () => vncClient?.sendCtrlAltDel(),
  typeText: typeTextInConsole,
})
</script>

<style lang="postcss" scoped>
.vts-remote-console {
  flex: 1;
  min-width: 0;
  min-height: 0;

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
