<template>
  <div class="pool-dashboard-view">
    <UiCardGroup>
      <PoolDashboardStatus />
      <PoolDashboardAlarms class="alarms" />
      <PoolDashboardHostsPatches />
    </UiCardGroup>
    <UiCardGroup>
      <UiCardGroup>
        <PoolDashboardStorageUsage />
        <PoolDashboardNetworkChart />
      </UiCardGroup>
      <UiCardGroup>
        <PoolDashboardRamUsage />
        <PoolDashboardRamUsageChart />
      </UiCardGroup>
      <UiCardGroup>
        <PoolDashboardCpuProvisioning />
        <PoolDashboardCpuUsage />
        <PoolCpuUsageChart />
      </UiCardGroup>
    </UiCardGroup>
    <UiCardGroup>
      <PoolDashboardTasks class="tasks" />
    </UiCardGroup>
  </div>
</template>

<script lang="ts" setup>
import PoolCpuUsageChart from '@/components/pool/dashboard/cpuUsage/PoolCpuUsageChart.vue'
import PoolDashboardAlarms from '@/components/pool/dashboard/PoolDashboardAlarms.vue'
import PoolDashboardCpuProvisioning from '@/components/pool/dashboard/PoolDashboardCpuProvisioning.vue'
import PoolDashboardCpuUsage from '@/components/pool/dashboard/PoolDashboardCpuUsage.vue'
import PoolDashboardHostsPatches from '@/components/pool/dashboard/PoolDashboardHostsPatches.vue'
import PoolDashboardNetworkChart from '@/components/pool/dashboard/PoolDashboardNetworkChart.vue'
import PoolDashboardRamUsage from '@/components/pool/dashboard/PoolDashboardRamUsage.vue'
import PoolDashboardStatus from '@/components/pool/dashboard/PoolDashboardStatus.vue'
import PoolDashboardStorageUsage from '@/components/pool/dashboard/PoolDashboardStorageUsage.vue'
import PoolDashboardTasks from '@/components/pool/dashboard/PoolDashboardTasks.vue'
import PoolDashboardRamUsageChart from '@/components/pool/dashboard/ramUsage/PoolRamUsage.vue'
import UiCardGroup from '@/components/ui/UiCardGroup.vue'
import useFetchStats from '@/composables/fetch-stats.composable'
import { GRANULARITY } from '@/libs/xapi-stats'
import type { XenApiHost, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { IK_HOST_LAST_WEEK_STATS, IK_HOST_STATS, IK_VM_STATS } from '@/types/injection-keys'
import { differenceBy } from 'lodash-es'
import { provide, watch } from 'vue'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('dashboard'))

const { getStats: getHostStats, runningHosts } = useHostStore().subscribe()
const { getStats: getVmStats, runningVms } = useVmStore().subscribe()

const {
  register: hostRegister,
  unregister: hostUnregister,
  stats: hostStats,
} = useFetchStats<XenApiHost>(getHostStats, GRANULARITY.Seconds)

const {
  register: vmRegister,
  unregister: vmUnregister,
  stats: vmStats,
} = useFetchStats<XenApiVm>(getVmStats, GRANULARITY.Seconds)

const hostLastWeekStats = useFetchStats<XenApiHost>(getHostStats, GRANULARITY.Hours)

provide(IK_HOST_STATS, hostStats)
provide(IK_VM_STATS, vmStats)
provide(IK_HOST_LAST_WEEK_STATS, hostLastWeekStats)

watch(runningHosts, (hosts, previousHosts) => {
  // turned On
  differenceBy(hosts, previousHosts ?? [], 'uuid').forEach(host => {
    hostRegister(host)
    hostLastWeekStats.register(host)
  })

  // turned Off
  differenceBy(previousHosts, hosts, 'uuid').forEach(host => {
    hostUnregister(host)
    hostLastWeekStats.unregister(host)
  })
})

watch(runningVms, (vms, previousVms) => {
  // turned On
  differenceBy(vms, previousVms ?? [], 'uuid').forEach(vm => vmRegister(vm))

  // turned Off
  differenceBy(previousVms, vms, 'uuid').forEach(vm => vmUnregister(vm))
})

runningHosts.value.forEach(host => {
  hostRegister(host)
  hostLastWeekStats.register(host)
})

runningVms.value.forEach(vm => vmRegister(vm))
</script>

<script lang="ts">
export const N_ITEMS = 5
</script>

<style lang="postcss" scoped>
.pool-dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

@media (min-width: 768px) {
  .pool-dashboard-view {
    column-count: 2;
  }
}

@media (min-width: 1500px) {
  .pool-dashboard-view {
    column-count: 3;
  }
}

.alarms,
.tasks {
  flex: 1;
}
</style>
