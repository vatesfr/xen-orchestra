import PoolDashboardRamUsage from '@/modules/pool/components/dashboard/PoolDashboardRamUsage.vue'
import { createPoolTopFiveDashboard } from '@/test/create-pool-dashboard.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { itShowsPoolTopFiveUsage, type PoolDashboardCardProps } from '@/test/pool-dashboard-card.ts'
import { mount } from '@vue/test-utils'

const POOL_DASHBOARD = createPoolTopFiveDashboard('ram')

function mountRamUsage(props: PoolDashboardCardProps = {}) {
  return mount(PoolDashboardRamUsage, {
    props: { poolDashboard: POOL_DASHBOARD, ...props },
    global: createGlobalTestConfig(),
  })
}

itShowsPoolTopFiveUsage(mountRamUsage, {
  title: t('ram-usage'),
  metric: 'ram',
  legends: { host: ['Host 1', '1 GiB / 4 GiB'], vm: ['VM 1', '3 GiB / 4 GiB'] },
})
