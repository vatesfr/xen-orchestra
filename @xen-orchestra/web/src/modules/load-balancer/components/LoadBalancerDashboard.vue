<template>
  <div class="load-balancer-dashboard">
    <div class="controls">
      <div class="plan-selector">
        <UiButton
          v-for="plan in LOAD_BALANCER_PLANS"
          :key="plan"
          accent="brand"
          size="medium"
          :variant="selectedPlan === plan ? 'primary' : 'secondary'"
          @click="selectedPlan = plan"
        >
          {{ t(PLAN_LABEL_KEYS[plan]) }}
        </UiButton>
      </div>
      <UiButton accent="brand" size="medium" variant="secondary" :busy="isSimulating" @click="simulate">
        {{ t('load-balancer:simulate') }}
      </UiButton>
      <UiButton
        v-if="simulationResult !== undefined"
        accent="brand"
        size="medium"
        variant="primary"
        :busy="isApplying"
        @click="apply"
      >
        {{ t('load-balancer:apply') }}
      </UiButton>
    </div>

    <VtsBanner v-if="simulationError" accent="danger">
      {{ String(simulationError) }}
    </VtsBanner>

    <VtsBanner v-if="applyError" accent="danger">
      {{ String(applyError) }}
    </VtsBanner>

    <div class="hosts-grid">
      <HostLoadCard
        v-for="host in hosts"
        :key="host.id"
        :host
        :vms="vmsByHostForPool.get(host.id) ?? []"
        :incoming-vms="incomingVmsByHost.get(host.id)"
        :simulation-result="simulationResult"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import HostLoadCard from '@/modules/load-balancer/components/HostLoadCard.vue'
import {
  LOAD_BALANCER_PLANS,
  useLoadBalancer,
  type LoadBalancerPlan,
} from '@/modules/load-balancer/composables/use-load-balancer.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsBanner from '@core/components/banner/VtsBanner.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import type { XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const PLAN_LABEL_KEYS: Record<LoadBalancerPlan, string> = {
  'Performance mode': 'load-balancer:plan:performance',
  'Density mode': 'load-balancer:plan:density',
  'Simple mode': 'load-balancer:plan:simple',
}

const { t } = useI18n()

const {
  hosts,
  vms,
  vmsByHostForPool,
  selectedPlan,
  simulationResult,
  simulationError,
  applyError,
  isSimulating,
  isApplying,
  simulate,
  apply,
} = useLoadBalancer(pool.id)

const incomingVmsByHost = computed(() => {
  const result = new Map<string, typeof vms.value>()

  if (simulationResult.value === undefined) {
    return result
  }

  const vmsById = new Map(vms.value.map(vm => [vm.id, vm]))

  for (const [vmId, targetHostId] of Object.entries(simulationResult.value)) {
    const vm = vmsById.get(vmId as XoVm['id'])

    if (vm === undefined) {
      continue
    }

    const list = result.get(targetHostId)

    if (list !== undefined) {
      list.push(vm)
    } else {
      result.set(targetHostId, [vm])
    }
  }

  return result
})
</script>

<style lang="postcss" scoped>
.load-balancer-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  padding: 0.8rem;

  .controls {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .plan-selector {
    display: flex;
    gap: 0.4rem;
  }

  .hosts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(30rem, 1fr));
    gap: 0.8rem;
  }
}
</style>
