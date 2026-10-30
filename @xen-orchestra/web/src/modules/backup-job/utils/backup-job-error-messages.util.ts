import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { toArray } from '@core/utils/to-array.utils.ts'

export function toErrorMessages(error: InputWrapperMessage | undefined): string[] {
  return toArray(error).map(message => (typeof message === 'object' ? message.content : message))
}
