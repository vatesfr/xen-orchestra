import AccountEditButton from '@/modules/account/components/actions/edit/AccountEditButton.vue'
import AccountInfoCard from '@/modules/account/components/cards/AccountInfoCard.vue'
import { createUser } from '@/test/create-user.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { findTitles } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { XoUser } from '@vates/types'
import { mount } from '@vue/test-utils'

function mountCard(user: XoUser = createUser()) {
  return mount(AccountInfoCard, {
    props: { user },
    global: createGlobalTestConfig({ stubs: { AccountEditButton: true } }),
  })
}

it('renders the account as the card title', () => {
  expect(findTitles(mountCard())).toEqual([t('account')])
})

it('shows the username, the names and the email address of the user', () => {
  const wrapper = mountCard(
    createUser({ username: 'jdoe', firstname: 'Jane', lastname: 'Doe', email: 'jane.doe@example.org' })
  )

  expect(findLabelledValues(wrapper)).toEqual({
    [t('username')]: 'jdoe',
    [t('first-name')]: 'Jane',
    [t('last-name')]: 'Doe',
    [t('email-address')]: 'jane.doe@example.org',
  })
})

it('falls back to the name when the user has no username', () => {
  const wrapper = mountCard(createUser({ username: undefined, name: 'Jane Doe' }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('username')]: 'Jane Doe' })
})

it('offers to edit the account of a user with no authentication provider', () => {
  const user = createUser()
  const wrapper = mountCard(user)

  expect(wrapper.findComponent(AccountEditButton).props('user')).toEqual(user)
})

it('does not offer to edit the account of a user synchronized by an authentication provider', () => {
  const wrapper = mountCard(createUser({ authProviders: { ldap: 'jdoe' } }))

  expect(wrapper.findComponent(AccountEditButton).exists()).toBe(false)
})
