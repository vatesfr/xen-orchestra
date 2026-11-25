import { findInfoLabels } from '@core-test/find-accented-labels.ts'
import type { VueWrapper } from '@vue/test-utils'

// What a modal asking to type a confirmation text does once that text is submitted: confirmed or not, and its errors
export async function submitConfirmationText(wrapper: VueWrapper, text: string) {
  await wrapper.get('input').setValue(text)
  await wrapper.get('form').trigger('submit')

  return { isConfirmed: wrapper.emitted('confirm') !== undefined, errors: findInfoLabels(wrapper) }
}
