import VtsActionModal from '@core/components/modal/VtsActionModal.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { t } from '@core-test/i18n.ts'
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

describe('VtsActionModal', () => {
  it('confirms directly when no confirmation text is asked', async () => {
    const wrapper = mountActionModal()

    expect(wrapper.find('input').exists()).toBe(false)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('does not confirm with a wrong text and shows the error', async () => {
    const wrapper = mountActionModal('2 VMs')

    expect(await submitConfirmationText(wrapper, '2 VM')).toEqual({
      isConfirmed: false,
      errors: [t('form:error:must-match', { text: '2 VMs' })],
    })
  })

  it('confirms with the confirmation text', async () => {
    const wrapper = mountActionModal('2 VMs')

    expect(await submitConfirmationText(wrapper, '2 VMs')).toEqual({ isConfirmed: true, errors: [] })
  })
})
