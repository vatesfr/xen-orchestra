import type { VueWrapper } from '@vue/test-utils'

// Types and submits the confirmation text of a modal, returns whether the modal confirmed; the error it shows belongs to
// `VtsTypeToConfirmInput`, tested on its own
export async function submitConfirmationText(wrapper: VueWrapper, text: string) {
  await wrapper.get('input').setValue(text)
  await wrapper.get('form').trigger('submit')

  return wrapper.emitted('confirm') !== undefined
}
