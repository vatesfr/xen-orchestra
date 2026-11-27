import VtsActionModal from '@core/components/modal/VtsActionModal.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { submitConfirmationText } from '@core-test/submit-confirmation-text.ts'
import { mount } from '@vue/test-utils'

function mountActionModal(confirmationText?: string) {
  return mount(VtsActionModal, {
    global: createGlobalTestConfig(),
    props: {
      object: 'vm',
      action: 'shutdown',
      vmCount: 2,
      accent: 'danger',
      icon: 'status:danger-circle',
      confirmationText,
    },
  })
}

it('confirms directly when no confirmation text is asked', async () => {
  const wrapper = mountActionModal()

  expect(wrapper.find('input').exists()).toBe(false)

  await wrapper.get('form').trigger('submit')

  expect(wrapper.emitted('confirm')).toHaveLength(1)
})

it.each([
  { text: '2 VM', isConfirmed: false },
  { text: '2 VMs', isConfirmed: true },
])('confirms only once the confirmation text is typed: "$text" → $isConfirmed', async ({ text, isConfirmed }) => {
  expect(await submitConfirmationText(mountActionModal('2 VMs'), text)).toBe(isConfirmed)
})
