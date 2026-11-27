import type { MissingPatch } from '@/modules/host/remote-resources/use-xo-host-missing-patches-collection.ts'
import PoolDashboardHostsPatches from '@/modules/pool/components/dashboard/PoolDashboardHostsPatches.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { itShowsDashboardCardStates } from '@/test/dashboard-card.ts'
import { findTableRows } from '@/test/find-rendered-values.ts'
import { findCardTitleInfo } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findTablePatches, MISSING_PATCHES } from '@/test/missing-patches.ts'
import type { PoolDashboardCardProps } from '@/test/pool-dashboard-card.ts'
import { findStateHeroTexts } from '@core-test/find-state-hero-types.ts'
import { mount } from '@vue/test-utils'

type MissingPatches = NonNullable<NonNullable<XoPoolDashboard['hosts']>['missingPatches']>

function withMissingPatches(missingPatches: MissingPatches): XoPoolDashboard {
  return { hosts: { missingPatches } }
}

function withAuthorizedPatches(patches: MissingPatch[]): XoPoolDashboard {
  return withMissingPatches({
    hasAuthorization: true,
    missingPatches: patches as unknown as Extract<MissingPatches, { hasAuthorization: true }>['missingPatches'],
  })
}

function mountPatches(props: PoolDashboardCardProps = {}) {
  return mount(PoolDashboardHostsPatches, {
    props: { poolDashboard: withAuthorizedPatches([{ name: 'XSAPATCH-1', version: '1.0' }]), ...props },
    global: createGlobalTestConfig(),
  })
}

itShowsDashboardCardStates(mountPatches, {
  dashboardProp: 'poolDashboard',
  title: [t('patches')],
  missing: { 'the list of missing patches': { hosts: {} } },
  findContent: findTableRows,
  hasErrorState: false,
})

it('counts the missing patches next to the title', () => {
  const wrapper = mountPatches({
    poolDashboard: withAuthorizedPatches(MISSING_PATCHES),
  })

  expect(findCardTitleInfo(wrapper)).toBe(t('n-missing', 2))
})

it('hands each missing patch to the table', () => {
  const wrapper = mountPatches({
    poolDashboard: withAuthorizedPatches(MISSING_PATCHES),
  })

  expect(findTablePatches(wrapper)).toEqual(MISSING_PATCHES)
})

it('reports the pool as up to date when its hosts miss no patch', () => {
  const wrapper = mountPatches({ poolDashboard: withAuthorizedPatches([]) })

  expect(findStateHeroTexts(wrapper)).toEqual([expect.stringContaining(t('patches-up-to-date'))])
  expect(findCardTitleInfo(wrapper)).toBeUndefined()
})

it('reports the pool as up to date when the patches cannot be listed without a licence', () => {
  const wrapper = mountPatches({ poolDashboard: withMissingPatches({ hasAuthorization: false }) })

  expect(findStateHeroTexts(wrapper)).toEqual([expect.stringContaining(t('patches-up-to-date'))])
  expect(findTableRows(wrapper)).toEqual([])
})
