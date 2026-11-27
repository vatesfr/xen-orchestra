import PoolDashboardCpuUsage from '@/modules/pool/components/dashboard/PoolDashboardCpuUsage.vue'
import {
  createHostTopFiveUsage,
  createPoolTopFiveDashboard,
  createVmTopFiveUsage,
} from '@/test/create-pool-dashboard.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { itShowsPoolTopFiveUsage, type PoolDashboardCardProps } from '@/test/pool-dashboard-card.ts'
import { findProgressBarAccents } from '@core-test/find-progress-bars.ts'
import { mount } from '@vue/test-utils'

const POOL_DASHBOARD = createPoolTopFiveDashboard('cpu')

function mountCpuUsage(props: PoolDashboardCardProps = {}) {
  return mount(PoolDashboardCpuUsage, {
    props: { poolDashboard: POOL_DASHBOARD, ...props },
    global: createGlobalTestConfig(),
  })
}

itShowsPoolTopFiveUsage(mountCpuUsage, {
  title: t('cpu-usage'),
  metric: 'cpu',
  legends: { host: ['Host 1', '30%'], vm: ['VM 1', '70%'] },
})

it('measures both sections against the CPU thresholds, which a full CPU has yet to reach', () => {
  const wrapper = mountCpuUsage({
    poolDashboard: createPoolTopFiveDashboard(
      'cpu',
      [createHostTopFiveUsage('cpu', { percent: 85 })],
      [createVmTopFiveUsage('cpu', { percent: 85 })]
    ),
  })

  expect(findProgressBarAccents(wrapper)).toEqual(['info', 'info'])
})
