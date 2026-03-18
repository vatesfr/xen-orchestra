<template>
  <UiCard>
    <UiCardTitle>{{ t('load-balancer:affinity-groups') }}</UiCardTitle>
    <VtsStateHero v-if="!ready" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="groups.length === 0" format="card" type="no-data" size="extra-small" horizontal>
      {{ t('load-balancer:no-affinity-groups') }}
    </VtsStateHero>
    <template v-else>
      <LoadBalancerAffinityGroupItem v-for="group of groups" :key="group.name" :group :hosts />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import LoadBalancerAffinityGroupItem, {
  type AffinityGroup,
} from '@/modules/load-balancer/components/LoadBalancerAffinityGroupItem.vue'
import { getAffinityGroups, getAntiAffinityGroups } from '@/modules/load-balancer/utils/load-balancer-tags.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms, hosts } = defineProps<{
  vms: FrontXoVm[]
  hosts: FrontXoHost[]
  ready: boolean
}>()

const { t } = useI18n()

const groups = computed<AffinityGroup[]>(() => {
  const result: AffinityGroup[] = []
  const affinityMap = new Map<string, FrontXoVm[]>()
  const antiAffinityMap = new Map<string, FrontXoVm[]>()

  for (const vm of vms) {
    for (const group of getAffinityGroups(vm.tags)) {
      const groupVms = affinityMap.get(group) ?? []
      groupVms.push(vm)
      affinityMap.set(group, groupVms)
    }

    for (const group of getAntiAffinityGroups(vm.tags)) {
      const groupVms = antiAffinityMap.get(group) ?? []
      groupVms.push(vm)
      antiAffinityMap.set(group, groupVms)
    }
  }

  for (const [name, groupVms] of affinityMap) {
    result.push({ name, type: 'affinity', vms: groupVms })
  }

  for (const [name, groupVms] of antiAffinityMap) {
    result.push({ name, type: 'anti-affinity', vms: groupVms })
  }

  return result
})
</script>
