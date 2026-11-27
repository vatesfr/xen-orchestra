import ApplianceUpgradeButton from '@/modules/appliance/components/actions/upgrade/ApplianceUpgradeButton.vue'
import ApplianceUpgradeProgress from '@/modules/appliance/components/version/ApplianceUpgradeProgress.vue'
import ApplianceVersionBlock from '@/modules/appliance/components/version/ApplianceVersionBlock.vue'
import ApplianceVersionCard from '@/modules/appliance/components/version/ApplianceVersionCard.vue'
import type { ApplianceUpgrade } from '@/modules/appliance/types/appliance-upgrade.type.ts'
import { XO_LINKS } from '@/shared/constants.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { findStateHeroTypes } from '@/test/find-state-hero-types.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findAccentedInfos, findAccentedTags } from '@core-test/find-accented-labels.ts'
import { findLinks } from '@core-test/find-links.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

type VersionCardProps = {
  channel: string
  checking: boolean
  hasUpdates: boolean
  registered?: boolean
  currentVersion?: string
  nextVersion?: string
  upgrade?: ApplianceUpgrade
}

// A registered appliance with an update to install
const UPDATE_AVAILABLE: VersionCardProps = {
  channel: 'stable',
  checking: false,
  hasUpdates: true,
  registered: true,
  currentVersion: '5.100.0',
  nextVersion: '5.101.0',
}

// The upgrade button runs its own jobs, the progress and the version blocks are covered by their own test
function mountCard(props: Partial<VersionCardProps> = {}) {
  return mount(ApplianceVersionCard, {
    props: { ...UPDATE_AVAILABLE, ...props },
    global: createGlobalTestConfig({
      stubs: { ApplianceUpgradeButton: true, ApplianceUpgradeProgress: true, ApplianceVersionBlock: true },
    }),
  })
}

function findDescription(wrapper: VueWrapper) {
  return wrapper.get('.ui-card-title .description').text()
}

function findVersionBlocks(wrapper: VueWrapper) {
  return wrapper.findAllComponents(ApplianceVersionBlock).map(block => ({
    label: block.props('label'),
    version: block.props('version'),
    detail: block.props('detail'),
    variant: block.props('variant'),
  }))
}

describe('tag', () => {
  it('shows no tag while the updates are being checked', () => {
    expect(findAccentedTags(mountCard({ checking: true }))).toEqual([])
  })

  it('tells an update is being installed, even while checking', () => {
    expect(findAccentedTags(mountCard({ checking: true, upgrade: { phase: 'upgrade' } }))).toEqual([
      { label: t('appliance:installing'), accent: 'info' },
    ])
  })

  it('warns the updates are blocked when the appliance is not registered', () => {
    expect(findAccentedTags(mountCard({ registered: false }))).toEqual([
      { label: t('appliance:updates-blocked'), accent: 'warning' },
    ])
  })

  it('tells the appliance is up to date', () => {
    expect(findAccentedTags(mountCard({ hasUpdates: false }))).toEqual([{ label: t('up-to-date'), accent: 'success' }])
  })

  it('tells an update is available', () => {
    expect(findAccentedTags(mountCard())).toEqual([{ label: t('appliance:update-available'), accent: 'info' }])
  })
})

describe('description', () => {
  it('shows the channel', () => {
    expect(findDescription(mountCard())).toBe(t('appliance:channel', { channel: 'stable' }))
  })

  it('tells the channel is being checked', () => {
    expect(findDescription(mountCard({ checking: true }))).toBe(t('appliance:channel-checking', { channel: 'stable' }))
  })
})

describe('while an update is being installed', () => {
  const UPGRADE: ApplianceUpgrade = { phase: 'upgrade', start: 1_000 }

  it('shows the progress of the upgrade', () => {
    expect(mountCard({ upgrade: UPGRADE }).getComponent(ApplianceUpgradeProgress).props('upgrade')).toEqual(UPGRADE)
  })

  it('shows the install button as busy', () => {
    const button = mountCard({ upgrade: UPGRADE }).getComponent(ApplianceUpgradeButton)

    expect(button.props()).toMatchObject({
      channel: 'stable',
      currentVersion: '5.100.0',
      nextVersion: '5.101.0',
      busy: true,
    })
  })

  it('shows no versions', () => {
    expect(findVersionBlocks(mountCard({ upgrade: UPGRADE }))).toEqual([])
  })
})

describe('while the updates are being checked', () => {
  it('tells the updates are being checked', () => {
    expect(mountCard({ checking: true }).get('[role="status"]').text()).toBe(t('appliance:checking-for-updates'))
  })

  it('offers no install', () => {
    expect(mountCard({ checking: true }).findComponent(ApplianceUpgradeButton).exists()).toBe(false)
  })
})

describe('when up to date', () => {
  it('tells the appliance runs the latest version, and which one', () => {
    const wrapper = mountCard({ hasUpdates: false })

    expect(findStateHeroTypes(wrapper)).toEqual(['all-done'])
    expect(findCardLabelledValues(wrapper)).toEqual({ [t('version')]: '5.100.0' })
  })

  it('offers no install', () => {
    expect(mountCard({ hasUpdates: false }).findComponent(ApplianceUpgradeButton).exists()).toBe(false)
  })
})

describe('when an update is available', () => {
  it('shows the installed version and the next one, on the channel', () => {
    expect(findVersionBlocks(mountCard())).toEqual([
      { label: t('appliance:you-run'), version: '5.100.0', detail: undefined, variant: 'neutral' },
      {
        label: t('appliance:next-version'),
        version: '5.101.0',
        detail: t('appliance:channel', { channel: 'stable' }),
        variant: 'highlighted',
      },
    ])
  })

  it('shows "-" for an unknown installed version, and an unknown next version', () => {
    expect(findVersionBlocks(mountCard({ currentVersion: undefined, nextVersion: undefined }))).toEqual([
      { label: t('appliance:you-run'), version: '-', detail: undefined, variant: 'neutral' },
      { label: t('appliance:next-version'), version: t('unknown'), detail: undefined, variant: 'unknown' },
    ])
  })

  it('links to what is new', () => {
    expect(findLinks(mountCard())).toEqual([
      [t('appliance:blog-post'), XO_LINKS.BLOG],
      [t('appliance:changelog'), XO_LINKS.CHANGELOG],
    ])
  })

  it('offers to install the update, and tells once it is installed', () => {
    const wrapper = mountCard()
    const button = wrapper.getComponent(ApplianceUpgradeButton)

    expect(button.props()).toMatchObject({ channel: 'stable', currentVersion: '5.100.0', nextVersion: '5.101.0' })
    expect(button.props('busy')).toBeFalsy()

    button.vm.$emit('upgraded')

    expect(wrapper.emitted('upgraded')).toHaveLength(1)
  })
})

describe('when not registered', () => {
  it('tells registering is needed to know the next version', () => {
    const [, nextVersionBlock] = findVersionBlocks(mountCard({ registered: false, nextVersion: undefined }))

    expect(nextVersionBlock).toMatchObject({
      version: t('unknown'),
      detail: t('appliance:register-to-check-updates'),
      variant: 'unknown',
    })
  })

  it('warns the updates are blocked, and offers no install', () => {
    const wrapper = mountCard({ registered: false })

    expect(findAccentedInfos(wrapper)).toEqual([
      { label: t('appliance:updates-blocked-until-registered'), accent: 'warning' },
    ])
    expect(wrapper.findComponent(ApplianceUpgradeButton).exists()).toBe(false)
    expect(findLinks(wrapper)).toEqual([])
  })
})
