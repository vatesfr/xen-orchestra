import AppliancePackagesCard from '@/modules/appliance/components/packages/AppliancePackagesCard.vue'
import type { AppliancePackage } from '@/modules/appliance/types/appliance-package.type.ts'
import { findTitleLabel } from '@/test/find-card-title.ts'
import { findTableRows, findTags } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { collapseOnOverflowMock, mockCollapseOnOverflow } from '@/test/mock-collapse-on-overflow.ts'
import { findAccentedTags } from '@core-test/find-accented-labels.ts'
import { mount } from '@vue/test-utils'

// No layout in a unit test: every status tag stays visible
mockCollapseOnOverflow()

beforeEach(() => {
  collapseOnOverflowMock.reset()
})

const PACKAGES: AppliancePackage[] = [
  { name: 'xo-server', installedVersion: '5.100.0', availableVersion: '5.101.0', status: 'update' },
  { name: 'xo-web', installedVersion: undefined, availableVersion: '5.101.0', status: 'new' },
  { name: 'xo-legacy', installedVersion: '1.0.0', availableVersion: undefined, status: 'removed' },
  { name: 'xoa', installedVersion: '2.0.0', availableVersion: '2.0.0', status: 'unchanged' },
]

function mountCard(packages: AppliancePackage[] = PACKAGES) {
  return mount(AppliancePackagesCard, { props: { packages }, global: createGlobalTestConfig() })
}

it('shows its title', () => {
  expect(findTitleLabel(mountCard())).toBe(t('appliance:packages'))
})

it('lists each package with its versions and its status, without version as "-"', () => {
  expect(findTableRows(mountCard())).toEqual([
    ['xo-server', '5.100.0', '5.101.0', t('appliance:package-status:update')],
    ['xo-web', '-', '5.101.0', t('appliance:package-status:new')],
    ['xo-legacy', '1.0.0', '-', t('appliance:package-status:removed')],
    ['xoa', '2.0.0', '2.0.0', t('appliance:package-status:unchanged')],
  ])
})

it('accents each status', () => {
  expect(findAccentedTags(mountCard())).toEqual([
    { label: t('appliance:package-status:update'), accent: 'info' },
    { label: t('appliance:package-status:new'), accent: 'success' },
    { label: t('appliance:package-status:removed'), accent: 'danger' },
    { label: t('appliance:package-status:unchanged'), accent: 'neutral' },
  ])
})

it('tells there is no package', () => {
  const wrapper = mountCard([])

  expect(findTags(wrapper)).toEqual([])
  expect(wrapper.text()).toContain(t('no-data'))
})
