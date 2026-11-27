import PoolDashboardCpuProvisioning from '@/modules/pool/components/dashboard/PoolDashboardCpuProvisioning.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { itShowsCpuProvisioningShare } from '@/test/cpu-provisioning-card.ts'
import { itShowsDashboardCardStates } from '@/test/dashboard-card.ts'
import { findCardNumbers } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { PoolDashboardCardProps } from '@/test/pool-dashboard-card.ts'
import { mount } from '@vue/test-utils'

type CpuProvisioning = NonNullable<XoPoolDashboard['cpuProvisioning']>

function withCpuProvisioning(overrides: Partial<CpuProvisioning> = {}): XoPoolDashboard {
  return { cpuProvisioning: { assigned: 6, total: 8, percent: 75, ...overrides } }
}

function mountProvisioning(props: PoolDashboardCardProps = {}) {
  return mount(PoolDashboardCpuProvisioning, {
    props: { poolDashboard: withCpuProvisioning(), ...props },
    global: createGlobalTestConfig(),
  })
}

itShowsDashboardCardStates(mountProvisioning, {
  dashboardProp: 'poolDashboard',
  title: t('cpu-provisioning'),
  missing: { 'the provisioning': {} },
  findContent: findCardNumbers,
  hasErrorState: true,
})

it.each<[string, PoolDashboardCardProps, string, string]>([
  ['splits the CPUs of the pool between what is assigned and what it holds', {}, '6', '8'],
  [
    'reports no CPU for a pool provisioning nothing',
    { poolDashboard: withCpuProvisioning({ assigned: 0, total: 0, percent: 0 }) },
    '0',
    '0',
  ],
])('%s', (_, props, assigned, total) => {
  const wrapper = mountProvisioning(props)

  expect(findCardNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), assigned],
    [t('total-cpus'), total],
  ])
})

itShowsCpuProvisioningShare(mountProvisioning, {
  fill: 'fills the progress bar with the share of the CPUs assigned',
  legend: 'labels the progress bar with the share of the CPUs assigned',
})
