import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { toArray } from '@core/utils/to-array.utils.ts'

export function mergeInputWrapperMessages(...messages: (InputWrapperMessage | undefined)[]): InputWrapperMessage {
  return messages.flatMap(message => toArray(message))
}
