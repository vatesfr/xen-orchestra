<template>
  <div class="dashboard" :class="{ mobile: uiStore.isMobile }">
    <div class="row first-row">
      <PoolDashboardStatus class="status" :pool-dashboard :has-error />
      <DashboardAlarms :class="alarmHero ? 'alarms-hero' : 'alarms'" :alarms :is-ready :has-error />
      <PoolDashboardHostsPatches class="patches" :pool-dashboard :has-error />
    </div>

    <div class="row second-row">
      <div class="column first-column">
        <PoolDashboardStoragesUsage class="storage-usage" :pool-dashboard :has-error />
        <PoolDashboardNetworkChart class="network-chart" :data :loading="isFetching" :error />
      </div>
      <div class="column second-column">
        <PoolDashboardRamUsage class="ram-usage" :pool-dashboard :has-error />
        <PoolDashboardRamChart class="ram-chart" :data :loading="isFetching" :error />
      </div>
      <div class="column third-column">
        <PoolDashboardCpuProvisioning class="cpu-provisioning" :pool-dashboard :has-error />
        <PoolDashboardCpuUsage class="cpu-usage" :pool-dashboard :has-error />
        <PoolDashboardCpuChart class="cpu-chart" :data :loading="isFetching" :error />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardAlarms from '@/modules/alarm/components/DashboardAlarms.vue'
import { useXoAlarmCollection } from '@/modules/alarm/remote-resources/use-xo-alarm-collection.ts'
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import PoolDashboardCpuChart from '@/modules/pool/components/dashboard/chart-usage/PoolDashboardCpuChart.vue'
import PoolDashboardNetworkChart from '@/modules/pool/components/dashboard/chart-usage/PoolDashboardNetworkChart.vue'
import PoolDashboardRamChart from '@/modules/pool/components/dashboard/chart-usage/PoolDashboardRamChart.vue'
import PoolDashboardCpuProvisioning from '@/modules/pool/components/dashboard/PoolDashboardCpuProvisioning.vue'
import PoolDashboardCpuUsage from '@/modules/pool/components/dashboard/PoolDashboardCpuUsage.vue'
import PoolDashboardHostsPatches from '@/modules/pool/components/dashboard/PoolDashboardHostsPatches.vue'
import PoolDashboardRamUsage from '@/modules/pool/components/dashboard/PoolDashboardRamUsage.vue'
import PoolDashboardStatus from '@/modules/pool/components/dashboard/PoolDashboardStatus.vue'
import PoolDashboardStoragesUsage from '@/modules/pool/components/dashboard/PoolDashboardStoragesUsage.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoPoolDashboard } from '@/modules/pool/remote-resources/use-xo-pool-dashboard.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmControllerCollection } from '@/modules/vm/remote-resources/use-xo-vm-controller-collection.ts'
import { useFetchStats } from '@/shared/composables/fetch-stats.composable.ts'
import { GRANULARITY } from '@/shared/utils/rest-api-stats.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

const { pool } = defineProps<{ pool: FrontXoPool }>()

const { data, isFetching, error } = useFetchStats('pool', () => pool.id, GRANULARITY.Hours)

const { poolDashboard, hasError } = useXoPoolDashboard({}, () => pool.id)

const { useGetAlarmsByIds, areAlarmsReady, hasAlarmFetchError } = useXoAlarmCollection()
const { areHostsReady } = useXoHostCollection()
const { areVmsReady } = useXoVmCollection()
const { areVmControllersReady } = useXoVmControllerCollection()
const { areSrsReady } = useXoSrCollection()

const isReady = logicAnd(areAlarmsReady, areHostsReady, areVmsReady, areVmControllersReady, areSrsReady)

const alarms = useGetAlarmsByIds(() => poolDashboard.value?.alarms ?? [])

const alarmHero = computed(() => !isReady.value || hasAlarmFetchError.value || alarms.value.length === 0)

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
    height: 46.2rem;
  }

  .alarms,
  .alarms-hero {
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
