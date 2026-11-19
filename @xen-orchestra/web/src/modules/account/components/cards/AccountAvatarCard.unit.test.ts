import AccountAvatarCard from '@/modules/account/components/cards/AccountAvatarCard.vue'
import { findTitles } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
import { mount } from '@vue/test-utils'

function mountCard() {
  return mount(AccountAvatarCard, {
    global: createGlobalTestConfig(),
  })
}

it('renders the avatar as the card title', () => {
  expect(findTitles(mountCard())).toEqual([t('avatar')])
})

it('shows the user logo in its medium size', () => {
  expect(mountCard().getComponent(UiUserLogo).props('size')).toBe('medium')
})
