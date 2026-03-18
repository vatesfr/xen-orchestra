<template>
  <UiCard class="load-balancer-distribution">
    <UiCardTitle>{{ t('load-balancer:vm-distribution') }}</UiCardTitle>
    <VtsStateHero v-if="!ready" format="card" type="busy" size="medium" />
    <template v-else>
      <VtsQueryBuilder v-model="filter" :schema />
      <LoadBalancerDistributionHost v-for="host of hosts" :key="host.id" :host :vms="filteredVms" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import LoadBalancerDistributionHost from '@/modules/load-balancer/components/LoadBalancerDistributionHost.vue'
import {
  getAffinityGroups,
  getAntiAffinityGroups,
  isLoadBalancerIgnored,
} from '@/modules/load-balancer/utils/load-balancer-tags.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema'
import { VM_POWER_STATE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms, hosts } = defineProps<{
  hosts: FrontXoHost[]
  vms: FrontXoVm[]
  ready: boolean
}>()

const { t } = useI18n()

interface FilterableVm extends FrontXoVm {
  ramSize: number
  affinityGroups: string
  antiAffinityGroups: string
  ignored: string
}

const filterableVms = computed<FilterableVm[]>(() =>
  vms.map(vm => ({
    ...vm,
    ramSize: vm.memory.size,
    affinityGroups: getAffinityGroups(vm.tags).join(', '),
    antiAffinityGroups: getAntiAffinityGroups(vm.tags).join(', '),
    ignored: isLoadBalancerIgnored(vm.tags) ? 'yes' : '',
  }))
)

const { items: filteredVms, filter } = useQueryBuilderFilter('lb-distribution', () => filterableVms.value)

const schema = useQueryBuilderSchema<FilterableVm>({
  '': useStringSchema(t('any-property')),
  name_label: useStringSchema(t('name')),
  power_state: useStringSchema(t('power-state'), {
    [VM_POWER_STATE.RUNNING]: t('status:running'),
    [VM_POWER_STATE.HALTED]: t('status:halted'),
    [VM_POWER_STATE.SUSPENDED]: t('status:suspended'),
    [VM_POWER_STATE.PAUSED]: t('status:paused'),
  }),
  'CPUs:number': useNumberSchema(t('vcpus')),
  ramSize: useNumberSchema(t('ram'), {
    [ONE_GB]: t('n-gb', { n: 1 }),
    [8 * ONE_GB]: t('n-gb', { n: 8 }),
    [16 * ONE_GB]: t('n-gb', { n: 16 }),
    [32 * ONE_GB]: t('n-gb', { n: 32 }),
    [64 * ONE_GB]: t('n-gb', { n: 64 }),
    [128 * ONE_GB]: t('n-gb', { n: 128 }),
  }),
  tags: useStringSchema(t('tags')),
  affinityGroups: useStringSchema(t('load-balancer:affinity')),
  antiAffinityGroups: useStringSchema(t('load-balancer:anti-affinity')),
  ignored: useStringSchema(t('load-balancer:ignore')),
})
</script>

<style lang="postcss" scoped>
.load-balancer-distribution {
  gap: 1.6rem;
}
</style>
