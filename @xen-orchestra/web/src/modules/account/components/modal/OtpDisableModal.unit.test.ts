import OtpDisableModal from '@/modules/account/components/modal/OtpDisableModal.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import { mount } from '@vue/test-utils'

function mountModal() {
  return mount(OtpDisableModal, {
    global: createGlobalTestConfig(),
  })
}

it('asks to confirm the deactivation of the OTP authentication', () => {
  const wrapper = mountModal()

  expect(wrapper.get('.ui-modal .main .typo-h4').text()).toBe(t('modal:otp-disable-title'))
  expect(wrapper.get('.ui-modal .main .content').text()).toBe(t('modal:otp-disable-message'))
})

it('offers to go back or to disable', () => {
  const buttons = mountModal()
    .findAll('.ui-modal .buttons button')
    .map(button => button.text())

  expect(buttons).toEqual([t('action:go-back'), t('action:disable')])
})

it('cancels from the go back button', async () => {
  const wrapper = mountModal()

  await wrapper.getComponent(VtsOverlayCancelButton).trigger('click')

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('confirms when it is submitted', async () => {
  const wrapper = mountModal()

  await wrapper.get('form').trigger('submit')

  expect(wrapper.emitted('confirm')).toHaveLength(1)
  expect(wrapper.emitted('cancel')).toBeUndefined()
})
