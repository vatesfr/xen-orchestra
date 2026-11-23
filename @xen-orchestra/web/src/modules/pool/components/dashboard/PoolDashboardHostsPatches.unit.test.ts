import PoolDashboardHostsPatches from '@/modules/pool/components/dashboard/PoolDashboardHostsPatches.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { itShowsDashboardCardStates } from '@/test/dashboard-card.ts'
import { findTableRows } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { PoolDashboardCardProps } from '@/test/pool-dashboard-card.ts'
import { mount } from '@vue/test-utils'

type MissingPatches = NonNullable<NonNullable<XoPoolDashboard['hosts']>['missingPatches']>

function withMissingPatches(missingPatches: MissingPatches): XoPoolDashboard {
  return { hosts: { missingPatches } }
}

function withAuthorizedPatches(patches: { name: string; version: string }[]): XoPoolDashboard {
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
    poolDashboard: withAuthorizedPatches([
      { name: 'XSAPATCH-1', version: '1.0' },
      { name: 'XSAPATCH-2', version: '2.0' },
    ]),
  })

  expect(wrapper.get('.missing-patches-info').text()).toBe(t('n-missing', 2))
})

it('lists one row per missing patch', () => {
  const wrapper = mountPatches({
    poolDashboard: withAuthorizedPatches([
      { name: 'XSAPATCH-1', version: '1.0' },
      { name: 'XSAPATCH-2', version: '2.0' },
    ]),
  })

  expect(findTableRows(wrapper)).toEqual([
    ['XSAPATCH-1', '1.0'],
    ['XSAPATCH-2', '2.0'],
  ])
})

it('reports the pool as up to date when its hosts miss no patch', () => {
  const wrapper = mountPatches({ poolDashboard: withAuthorizedPatches([]) })

  expect(wrapper.get('.vts-state-hero').text()).toContain(t('patches-up-to-date'))
  expect(wrapper.find('.missing-patches-info').exists()).toBe(false)
})

it('reports the pool as up to date when the patches cannot be listed without a licence', () => {
  const wrapper = mountPatches({ poolDashboard: withMissingPatches({ hasAuthorization: false }) })

  expect(wrapper.get('.vts-state-hero').text()).toContain(t('patches-up-to-date'))
  expect(findTableRows(wrapper)).toEqual([])
})
