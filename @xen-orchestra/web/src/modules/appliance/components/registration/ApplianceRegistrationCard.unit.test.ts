import ApplianceChangeAccountButton from '@/modules/appliance/components/actions/change-account/ApplianceChangeAccountButton.vue'
import ApplianceRegisterButton from '@/modules/appliance/components/actions/register/ApplianceRegisterButton.vue'
import ApplianceRegistrationCard from '@/modules/appliance/components/registration/ApplianceRegistrationCard.vue'
import { XO_LINKS } from '@/shared/constants.ts'
import { findCardTitleLabel } from '@/test/find-card-title.ts'
import { findLabelledValues, findRowLabels } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { formatDate } from '@core/utils/time.util.ts'
import { findAccentedInfos } from '@core-test/find-accented-labels.ts'
import { findLinks } from '@core-test/find-links.ts'
import { mount } from '@vue/test-utils'

mockXoRoutes()

const REGISTERED_SINCE = Date.UTC(2025, 2, 14)

type RegistrationCardProps = {
  registered?: boolean
  account?: string
  registeredSince?: number
}

// The register and change account buttons run their own job, covered by their own test
function mountCard(props: RegistrationCardProps = {}) {
  return mount(ApplianceRegistrationCard, {
    props,
    global: createGlobalTestConfig({ stubs: { ApplianceRegisterButton: true, ApplianceChangeAccountButton: true } }),
  })
}

it('shows its title', () => {
  expect(findCardTitleLabel(mountCard())).toBe(t('appliance:registration'))
})

describe('while the registration is unknown', () => {
  it('shows the status row alone, without state', () => {
    const wrapper = mountCard()

    expect(findRowLabels(wrapper)).toEqual([t('status')])
    expect(findAccentedInfos(wrapper)).toEqual([])
  })

  it('offers no action', () => {
    const wrapper = mountCard()

    expect(wrapper.findComponent(ApplianceChangeAccountButton).exists()).toBe(false)
    expect(wrapper.findComponent(ApplianceRegisterButton).exists()).toBe(false)
  })
})

describe('when registered', () => {
  const REGISTERED = { registered: true, account: 'admin@example.org', registeredSince: REGISTERED_SINCE }

  it('tells the appliance is registered', () => {
    expect(findAccentedInfos(mountCard(REGISTERED))).toEqual([{ label: t('appliance:registered'), accent: 'success' }])
  })

  it('shows the account, since when, and where to manage the licenses', () => {
    const wrapper = mountCard(REGISTERED)

    expect(findLabelledValues(wrapper)).toMatchObject({
      [t('account')]: 'admin@example.org',
      [t('appliance:since')]: formatDate(REGISTERED_SINCE),
      [t('appliance:licenses')]: t('appliance:manage-in-xo-5'),
    })
    expect(findLinks(wrapper)).toEqual([[t('appliance:manage-in-xo-5'), 'https://xo5.example.com/#/xoa/licenses']])
  })

  it('offers to change the account, not to register', () => {
    const wrapper = mountCard(REGISTERED)

    expect(wrapper.findComponent(ApplianceChangeAccountButton).exists()).toBe(true)
    expect(wrapper.findComponent(ApplianceRegisterButton).exists()).toBe(false)
  })
})

describe('when not registered', () => {
  it('warns the appliance is not registered', () => {
    expect(findAccentedInfos(mountCard({ registered: false }))).toEqual([
      { label: t('appliance:not-registered'), accent: 'warning' },
    ])
  })

  it('shows the status row alone', () => {
    expect(findRowLabels(mountCard({ registered: false }))).toEqual([t('status')])
  })

  it('offers to register, or to create an account', () => {
    const wrapper = mountCard({ registered: false })

    expect(wrapper.get('.hint').text()).toBe(t('appliance:registration-hint'))
    expect(wrapper.findComponent(ApplianceRegisterButton).exists()).toBe(true)
    expect(wrapper.findComponent(ApplianceChangeAccountButton).exists()).toBe(false)
    expect(findLinks(wrapper)).toEqual([[t('appliance:create-account'), XO_LINKS.VATES_ACCOUNT]])
  })
})
