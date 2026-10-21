import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'

/**
 * Merges the info, warning and error messages of a form input into a single input wrapper message
 */
export function mergeInputMessages(...messages: (InputWrapperMessage | undefined)[]): InputWrapperMessage {
  return messages.filter(message => message !== undefined).flat()
}
