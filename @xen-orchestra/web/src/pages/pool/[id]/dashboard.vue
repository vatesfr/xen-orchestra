<template>
  <div class="dashboard" :class="{ mobile: uiStore.isMobile }">
    <div class="row row-top">
      <PoolDashboardStatus class="status" :pool />
      <PoolDashboardAlarms class="alarms" />
      <PoolDashboardHostsPatches class="patch" />
    </div>

    <div class="row row-mid">
      <div class="first-column">
        <PoolDashboardStorageUsage class="storage-usage" :pool-id="pool.id" />
        <PoolDashboardNetworkChart class="network-chart" :data :loading="isFetching" :error />
      </div>
      <div class="second-column">
        <PoolDashboardRamUsage class="ram-usage" :pool />
        <PoolDashboardRamChart class="ram-chart" :data :loading="isFetching" :error />
      </div>
      <div class="third-column">
        <PoolDashboardCpuProvisioning class="cpu-provisioning" :pool />
        <PoolDashboardCpuUsage class="cpu-usage" :pool />
        <PoolDashboardCpuChart class="cpu-chart" :data :loading="isFetching" :error />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PoolDashboardCpuChart from '@/components/pool/dashboard/chartUsage/PoolDashboardCpuChart.vue'
import PoolDashboardNetworkChart from '@/components/pool/dashboard/chartUsage/PoolDashboardNetworkChart.vue'
import PoolDashboardRamChart from '@/components/pool/dashboard/chartUsage/PoolDashboardRamChart.vue'
import PoolDashboardAlarms from '@/components/pool/dashboard/PoolDashboardAlarms.vue'
import PoolDashboardCpuProvisioning from '@/components/pool/dashboard/PoolDashboardCpuProvisioning.vue'
import PoolDashboardCpuUsage from '@/components/pool/dashboard/PoolDashboardCpuUsage.vue'
import PoolDashboardHostsPatches from '@/components/pool/dashboard/PoolDashboardHostsPatches.vue'
import PoolDashboardRamUsage from '@/components/pool/dashboard/PoolDashboardRamUsage.vue'
import PoolDashboardStatus from '@/components/pool/dashboard/PoolDashboardStatus.vue'
import PoolDashboardStorageUsage from '@/components/pool/dashboard/PoolDashboardStorageUsage.vue'
import { useFetchStats } from '@/composables/fetch-stats.composable.ts'
import type { XoPool } from '@/types/xo/pool.type'
import { GRANULARITY } from '@/utils/rest-api-stats.ts'
import { useUiStore } from '@core/stores/ui.store.ts'

const { pool } = defineProps<{ pool: XoPool }>()

const { data, isFetching, error } = useFetchStats('pool', () => pool.id, GRANULARITY.Hours)

const uiStore = useUiStore()
</script>

<style scoped lang="postcss">
.dashboard {
  margin: 0.8rem;

  /* === DESKTOP === */
  .row {
    display: grid;
    gap: 0.8rem;
    margin-bottom: 0.8rem;
  }

  .row-top {
    grid-template-columns: 2fr 4fr 2fr;
    grid-template-areas: 'status alarms patch';
  }

  .status {
    grid-area: status;
  }

  .alarms {
    grid-area: alarms;
  }

  .patch {
    grid-area: patch;
  }

  .row-mid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-areas: 'first-column second-column third-column';
  }

  .first-column {
    grid-area: first-column;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .second-column {
    grid-area: second-column;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .third-column {
    grid-area: third-column;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
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
    margin-bottom: 0;
  }
}
</style>
