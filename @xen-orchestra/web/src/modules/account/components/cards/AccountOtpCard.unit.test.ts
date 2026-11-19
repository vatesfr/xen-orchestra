import AccountOtpToggleButton from '@/modules/account/components/actions/otp/AccountOtpToggleButton.vue'
import AccountOtpCard from '@/modules/account/components/cards/AccountOtpCard.vue'
import { createUser } from '@/test/create-user.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { findTitles } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { XoUser } from '@vates/types'
import { mount } from '@vue/test-utils'

function mountCard(user: XoUser = createUser()) {
  return mount(AccountOtpCard, {
    props: { user },
    global: createGlobalTestConfig({ stubs: { AccountOtpToggleButton: true } }),
  })
}

it('renders the OTP authentication as the card title', () => {
  expect(findTitles(mountCard())).toEqual([t('otp-authentication')])
})

it('shows the OTP as disabled when the user has no OTP secret', () => {
  expect(findLabelledValues(mountCard())).toEqual({ [t('status')]: t('disabled') })
})

it('shows the OTP as enabled when the user has an OTP secret', () => {
  const wrapper = mountCard(createUser({ preferences: { otp: 'SECRET' } }))

  expect(findLabelledValues(wrapper)).toEqual({ [t('status')]: t('enabled') })
})

it('offers to toggle the OTP of the user', () => {
  const user = createUser()
  const wrapper = mountCard(user)

  expect(wrapper.findComponent(AccountOtpToggleButton).props('user')).toEqual(user)
})
