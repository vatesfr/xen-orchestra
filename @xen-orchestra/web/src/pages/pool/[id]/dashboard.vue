<template>
  <div class="dashboard" :class="{ mobile: uiStore.isMobile }">
    <div class="row first-row">
      <PoolDashboardStatus class="status" :pool="poolDashboard" />
      <PoolDashboardAlarms class="alarms" />
      <PoolDashboardHostsPatches class="patch" />
    </div>

    <div class="row second-row">
      <div class="column first-column">
        <PoolDashboardStorageUsage class="storage-usage" :pool="poolDashboard" />
        <PoolDashboardNetworkChart class="network-chart" :data :loading="isFetching" :error />
      </div>
      <div class="column second-column">
        <PoolDashboardRamUsage class="ram-usage" :pool="poolDashboard" />
        <PoolDashboardRamChart class="ram-chart" :data :loading="isFetching" :error />
      </div>
      <div class="column third-column">
        <PoolDashboardCpuProvisioning
          class="cpu-provisioning"
          :pool="poolDashboard"
          :is-ready="areCpuProvisioningReady"
        />
        <PoolDashboardCpuUsage class="cpu-usage" :pool="poolDashboard" />
        <PoolDashboardCpuChart class="cpu-chart" :data :loading="isFetching" :error />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PoolDashboardAlarms from '@/components/pool/dashboard/alarms/PoolDashboardAlarms.vue'
import PoolDashboardCpuChart from '@/components/pool/dashboard/chartUsage/PoolDashboardCpuChart.vue'
import PoolDashboardNetworkChart from '@/components/pool/dashboard/chartUsage/PoolDashboardNetworkChart.vue'
import PoolDashboardRamChart from '@/components/pool/dashboard/chartUsage/PoolDashboardRamChart.vue'
import PoolDashboardCpuProvisioning from '@/components/pool/dashboard/PoolDashboardCpuProvisioning.vue'
import PoolDashboardCpuUsage from '@/components/pool/dashboard/PoolDashboardCpuUsage.vue'
import PoolDashboardHostsPatches from '@/components/pool/dashboard/PoolDashboardHostsPatches.vue'
import PoolDashboardRamUsage from '@/components/pool/dashboard/PoolDashboardRamUsage.vue'
import PoolDashboardStatus from '@/components/pool/dashboard/PoolDashboardStatus.vue'
import PoolDashboardStorageUsage from '@/components/pool/dashboard/PoolDashboardStorageUsage.vue'
import { useFetchStats } from '@/composables/fetch-stats.composable.ts'
import { usePoolDashboardStore } from '@/stores/xo-rest-api/pool-dashboard.store.ts'
import type { XoPool } from '@/types/xo/pool.type'
import { GRANULARITY } from '@/utils/rest-api-stats.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'

const { pool } = defineProps<{ pool: XoPool }>()

const { record: poolDashboard } = usePoolDashboardStore().subscribe()

const areCpuProvisioningReady = computed(() => poolDashboard.value?.cpuProvisioning !== undefined)

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

  .first-row {
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

  .second-row {
    grid-template-columns: repeat(3, 1fr);
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
    margin-bottom: 0;
  }
}
</style>
