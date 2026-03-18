<template>
  <div class="load-balancer" :class="{ mobile: uiStore.isSmall }">
    <div class="row first-row">
      <LoadBalancerDistribution class="distribution" :hosts="poolHosts" :vms="poolVms" :ready="isReady" />
    </div>
    <div class="row second-row">
      <LoadBalancerAffinityGroups class="affinity" :vms="poolVms" :hosts="poolHosts" :ready="isReady" />
      <LoadBalancerMigrationPlan class="migration" :vms="poolVms" :hosts="poolHosts" :ready="isReady" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import LoadBalancerAffinityGroups from '@/modules/load-balancer/components/LoadBalancerAffinityGroups.vue'
import LoadBalancerDistribution from '@/modules/load-balancer/components/LoadBalancerDistribution.vue'
import LoadBalancerMigrationPlan from '@/modules/load-balancer/components/LoadBalancerMigrationPlan.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

const { pool } = defineProps<{ pool: FrontXoPool }>()

const uiStore = useUiStore()

const { areVmsReady, vmsByPool } = useXoVmCollection()
const { areHostsReady, hostsByPool } = useXoHostCollection()

const isReady = logicAnd(areVmsReady, areHostsReady)

const poolVms = computed(() => vmsByPool.value.get(pool.id) ?? [])
const poolHosts = computed(() => hostsByPool.value.get(pool.id) ?? [])
</script>

<style lang="postcss" scoped>
.load-balancer {
  margin: 0.8rem;

  .row {
    display: grid;
    gap: 0.8rem;
  }

  .row + .row {
    margin-top: 0.8rem;
  }

  .first-row {
    grid-template-columns: 1fr;
  }

  .second-row {
    grid-template-columns: repeat(2, minmax(20rem, 1fr));
  }

  &.mobile {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;

    .row {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      margin-top: 0;
    }
  }
}
</style>
