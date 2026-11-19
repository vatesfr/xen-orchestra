import AccountEditPasswordButton from '@/modules/account/components/actions/edit-password/AccountEditPasswordButton.vue'
import AccountPasswordCard from '@/modules/account/components/cards/AccountPasswordCard.vue'
import { createUser } from '@/test/create-user.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { findTitles } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { XoUser } from '@vates/types'
import { mount } from '@vue/test-utils'

function mountCard(user: XoUser = createUser()) {
  return mount(AccountPasswordCard, {
    props: { user },
    global: createGlobalTestConfig({ stubs: { AccountEditPasswordButton: true } }),
  })
}

it('renders the password as the card title', () => {
  expect(findTitles(mountCard())).toEqual([t('password')])
})

it('hides the password behind bullets', () => {
  expect(findLabelledValues(mountCard())).toEqual({ [t('password')]: '••••••••••••' })
})

it('offers to edit the password of a user with no authentication provider', () => {
  expect(mountCard().findComponent(AccountEditPasswordButton).exists()).toBe(true)
})

it('does not offer to edit the password of a user synchronized by an authentication provider', () => {
  const wrapper = mountCard(createUser({ authProviders: { ldap: 'jdoe' } }))

  expect(wrapper.findComponent(AccountEditPasswordButton).exists()).toBe(false)
})
