import VtsTypeToConfirmModal from '@core/components/modal/VtsTypeToConfirmModal.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { submitConfirmationText } from '@core-test/submit-confirmation-text.ts'
import { mount } from '@vue/test-utils'

function mountTypeToConfirmModal() {
  return mount(VtsTypeToConfirmModal, {
    global: createGlobalTestConfig(),
    props: { accent: 'danger', title: 'Delete VMs', confirmationText: '2 VMs', confirmLabel: 'Delete 2 VMs' },
  })
}

it('keeps the confirm button enabled', () => {
  expect(mountTypeToConfirmModal().get('button[type="submit"]').attributes('disabled')).toBeUndefined()
})

it.each([
  { text: '', isConfirmed: false },
  { text: '2 VM', isConfirmed: false },
  { text: '2 VMs', isConfirmed: true },
])('confirms only once the confirmation text is typed: "$text" → $isConfirmed', async ({ text, isConfirmed }) => {
  expect(await submitConfirmationText(mountTypeToConfirmModal(), text)).toBe(isConfirmed)
})
