<template>
  <div class="dashboard" :class="{ mobile: uiStore.isMobile }">
    <div class="row first-row">
      <PoolDashboardStatus class="status" :pool-dashboard />
      <PoolDashboardAlarms class="alarms" :pool-dashboard />
      <PoolDashboardHostsPatches class="patches" :pool-dashboard />
    </div>

    <div class="row second-row">
      <div class="column first-column">
        <PoolDashboardStoragesUsage class="storage-usage" :pool-dashboard />
        <PoolDashboardNetworkChart class="network-chart" :data :loading="isFetching" :error />
      </div>
      <div class="column second-column">
        <PoolDashboardRamUsage class="ram-usage" :pool-dashboard />
        <PoolDashboardRamChart class="ram-chart" :data :loading="isFetching" :error />
      </div>
      <div class="column third-column">
        <PoolDashboardCpuProvisioning class="cpu-provisioning" :pool-dashboard />
        <PoolDashboardCpuUsage class="cpu-usage" :pool-dashboard />
        <PoolDashboardCpuChart class="cpu-chart" :data :loading="isFetching" :error />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PoolDashboardAlarms from '@/components/pool/dashboard/alarms/PoolDashboardAlarms.vue'
import PoolDashboardCpuChart from '@/components/pool/dashboard/chart-usage/PoolDashboardCpuChart.vue'
import PoolDashboardNetworkChart from '@/components/pool/dashboard/chart-usage/PoolDashboardNetworkChart.vue'
import PoolDashboardRamChart from '@/components/pool/dashboard/chart-usage/PoolDashboardRamChart.vue'
import PoolDashboardCpuProvisioning from '@/components/pool/dashboard/PoolDashboardCpuProvisioning.vue'
import PoolDashboardCpuUsage from '@/components/pool/dashboard/PoolDashboardCpuUsage.vue'
import PoolDashboardHostsPatches from '@/components/pool/dashboard/PoolDashboardHostsPatches.vue'
import PoolDashboardRamUsage from '@/components/pool/dashboard/PoolDashboardRamUsage.vue'
import PoolDashboardStatus from '@/components/pool/dashboard/PoolDashboardStatus.vue'
import PoolDashboardStoragesUsage from '@/components/pool/dashboard/PoolDashboardStoragesUsage.vue'
import { useFetchStats } from '@/composables/fetch-stats.composable.ts'
import { useXoPoolDashboard } from '@/remote-resources/use-xo-pool-dashboard.ts'
import type { XoPool } from '@/types/xo/pool.type'
import { GRANULARITY } from '@/utils/rest-api-stats.ts'
import { useUiStore } from '@core/stores/ui.store.ts'

const { pool } = defineProps<{ pool: XoPool }>()

const { data, isFetching, error } = useFetchStats('pool', () => pool.id, GRANULARITY.Hours)

const { poolDashboard } = useXoPoolDashboard({}, () => pool.id)

const uiStore = useUiStore()
</script>

<style scoped lang="postcss">
.dashboard {
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
