import type { KeyboardLayoutId } from '@core/types/keyboard-layout.type.ts'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

type RemoteConsole = {
  isConnected: boolean
  sendCtrlAltDel: () => void
  typeText: (text: string, layoutId?: KeyboardLayoutId) => Promise<string[]> | undefined
}

export function useRemoteConsole(remoteConsole: MaybeRefOrGetter<RemoteConsole | null | undefined>) {
  const clipboardText = ref('')
  const isConsoleConnected = computed(() => toValue(remoteConsole)?.isConnected ?? false)

  const sendCtrlAltDel = () => toValue(remoteConsole)?.sendCtrlAltDel()

  const sendToConsole = (text: string, layoutId?: KeyboardLayoutId) => toValue(remoteConsole)?.typeText(text, layoutId)

  return { clipboardText, isConsoleConnected, sendCtrlAltDel, sendToConsole }
}
