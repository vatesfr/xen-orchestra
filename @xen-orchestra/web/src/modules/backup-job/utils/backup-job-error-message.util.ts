import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { toArray } from '@core/utils/to-array.utils.ts'

export function formatErrorMessage(error: InputWrapperMessage | undefined): string | undefined {
  const [message] = toArray(error)

  return typeof message === 'object' ? message.content : message
}
