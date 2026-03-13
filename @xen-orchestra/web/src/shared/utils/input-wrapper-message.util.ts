import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'

export function toInputWrapperMessage(
  content: string | undefined,
  accent: InfoAccent
): InputWrapperMessage | undefined {
  return content !== undefined ? { content, accent } : undefined
}
