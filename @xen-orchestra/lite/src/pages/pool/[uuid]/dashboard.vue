<template>
  <div class="pool-dashboard-view" :class="{ mobile: uiStore.isSmall }">
    <div class="row first-row">
      <PoolDashboardStatus class="status" />
      <PoolDashboardAlarms class="alarms" />
      <PoolDashboardHostsPatches class="patches" />
    </div>

    <div class="row second-row">
      <div class="column first-column">
        <PoolDashboardStorageUsage />
        <PoolDashboardNetworkChart />
      </div>
      <div class="column second-column">
        <PoolDashboardRamUsage />
        <PoolRamUsageChart />
      </div>
      <div class="column third-column">
        <PoolDashboardCpuProvisioning />
        <PoolDashboardCpuUsage />
        <PoolCpuUsageChart />
      </div>
    </div>

    <div class="row third-row">
      <PoolDashboardTasks class="tasks" />
    </div>
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
import PoolRamUsageChart from '@/components/pool/dashboard/ramUsage/PoolRamUsageChart.vue'
import useFetchStats from '@/composables/fetch-stats.composable.ts'
import { GRANULARITY } from '@/libs/xapi-stats.ts'
import type { XenApiHost, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import { IK_HOST_LAST_WEEK_STATS, IK_HOST_STATS, IK_VM_STATS } from '@/types/injection-keys.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { differenceBy } from 'lodash-es'
import { provide, watch } from 'vue'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('dashboard'))

const uiStore = useUiStore()

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
  margin: 0.8rem;

  /* === DESKTOP === */
  .row {
    display: grid;
    gap: 0.8rem;
  }

  .row + .row {
    margin-top: 0.8rem;
  }

  .first-row {
    grid-template-columns: minmax(10rem, 1fr) minmax(20rem, 2fr) minmax(10rem, 1fr);
    grid-template-areas: 'status alarms patches';
  }

  .status {
    grid-area: status;
  }

  .alarms {
    grid-area: alarms;
  }

  .patches {
    grid-area: patches;
  }

  .second-row {
    grid-template-columns: repeat(3, minmax(20rem, 1fr));
    grid-template-areas: 'first-column second-column third-column';
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .first-column {
    grid-area: first-column;
  }

  .second-column {
    grid-area: second-column;
  }

  .third-column {
    grid-area: third-column;
  }

  .third-row {
    grid-template-columns: minmax(20rem, 1fr);
    grid-template-areas: 'tasks';
  }

  .tasks {
    grid-area: tasks;
  }

  /* === MOBILE === */
  &.mobile {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  &.mobile .row {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-top: 0;
  }
}
</style>
