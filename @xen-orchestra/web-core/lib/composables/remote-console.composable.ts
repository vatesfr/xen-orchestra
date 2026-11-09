import type { RemoteConsoleExposed } from '@core/components/console/VtsRemoteConsole.vue'
import type { KeyboardLayoutId } from '@core/types/keyboard-layout.type.ts'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

export function useRemoteConsole(remoteConsole: MaybeRefOrGetter<RemoteConsoleExposed | null | undefined>) {
  const clipboardText = ref('')
  const isConsoleConnected = computed(() => toValue(remoteConsole)?.isConnected ?? false)

  const sendCtrlAltDel = () => toValue(remoteConsole)?.sendCtrlAltDel()

  const sendToConsole = (text: string, layoutId?: KeyboardLayoutId) => toValue(remoteConsole)?.typeText(text, layoutId)

  return { clipboardText, isConsoleConnected, sendCtrlAltDel, sendToConsole }
}
