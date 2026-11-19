import AccountSsoCard from '@/modules/account/components/cards/AccountSsoCard.vue'
import { createUser } from '@/test/create-user.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { findTitles } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { XoUser } from '@vates/types'
import { mount } from '@vue/test-utils'

function mountCard(user: XoUser = createUser()) {
  return mount(AccountSsoCard, {
    props: { user },
    global: createGlobalTestConfig(),
  })
}

function findAuthenticatorApps(wrapper: ReturnType<typeof mountCard>) {
  return wrapper.findAll('.authenticator-apps span').map(app => app.text())
}

it('renders the SSO authentication as the card title', () => {
  expect(findTitles(mountCard())).toEqual([t('sso-authentication')])
})

it('labels the authenticator apps row', () => {
  expect(Object.keys(findLabelledValues(mountCard()))).toEqual([t('authenticator-apps')])
})

it('lists the authentication providers of the user as authenticator apps', () => {
  const wrapper = mountCard(createUser({ authProviders: { ldap: 'jdoe', github: '42' } }))

  expect(findAuthenticatorApps(wrapper)).toEqual(['ldap', 'github'])
})

it('lists no authenticator app for a user with no authentication provider', () => {
  const wrapper = mountCard()

  expect(findAuthenticatorApps(wrapper)).toEqual([])
  expect(findLabelledValues(wrapper)).toEqual({ [t('authenticator-apps')]: '' })
})
