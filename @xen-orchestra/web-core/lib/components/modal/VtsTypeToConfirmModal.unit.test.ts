import VtsTypeToConfirmModal from '@core/components/modal/VtsTypeToConfirmModal.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { t } from '@core-test/i18n.ts'
import { submitConfirmationText } from '@core-test/submit-confirmation-text.ts'
import { mount } from '@vue/test-utils'

function mountTypeToConfirmModal() {
  return mount(VtsTypeToConfirmModal, {
    global: createGlobalTestConfig(),
    props: { accent: 'danger', title: 'Delete VMs', confirmationText: '2 VMs', confirmLabel: 'Delete 2 VMs' },
  })
}

describe('VtsTypeToConfirmModal', () => {
  it('keeps the confirm button enabled', () => {
    expect(mountTypeToConfirmModal().get('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it.each([
    { label: 'an empty text', text: '' },
    { label: 'a wrong text', text: '2 VM' },
  ])('does not confirm with $label and shows the error', async ({ text }) => {
    const wrapper = mountTypeToConfirmModal()

    expect(await submitConfirmationText(wrapper, text)).toEqual({
      isConfirmed: false,
      errors: [t('form:error:must-match', { text: '2 VMs' })],
    })
  })

  it('confirms with the confirmation text', async () => {
    const wrapper = mountTypeToConfirmModal()

    expect(await submitConfirmationText(wrapper, '2 VMs')).toEqual({ isConfirmed: true, errors: [] })
  })
})
