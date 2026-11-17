<template>
  <VtsSidePanel :has-selection="!!rule" @close="emit('close')">
    <template v-if="rule" #actions>
      <TrafficRuleActions :rule />
    </template>

    <template v-if="rule" #default>
      <VtsStateHero v-if="!isReady" format="panel" size="medium" type="busy" />
      <template v-else>
        <TrafficRuleSummaryCard :rule />

        <template v-if="vif">
          <TrafficRuleVifInfosCard :rule :vif />
          <TrafficRuleVifNetworkInfoCard :rule :vif />
        </template>

        <template v-else-if="network">
          <TrafficRuleNetworkInfosCard :network :rule />
          <TrafficRuleNetworkPifsCard :network :rule />
        </template>

        <TrafficRulePriorityCard v-if="showPriority && network" :network :rule :rules />
      </template>
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import TrafficRuleActions from '@/modules/traffic-rules/components/actions/TrafficRuleActions.vue'
import TrafficRuleNetworkInfosCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleNetworkInfosCard.vue'
import TrafficRuleNetworkPifsCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleNetworkPifsCard.vue'
import TrafficRulePriorityCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRulePriorityCard.vue'
import TrafficRuleSummaryCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleSummaryCard.vue'
import TrafficRuleVifInfosCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleVifInfosCard.vue'
import TrafficRuleVifNetworkInfoCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleVifNetworkInfoCard.vue'
import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

const { rule, rules, showPriority } = defineProps<{
  rule?: RankedTrafficRule
  rules: RankedTrafficRule[]
  showPriority?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { getVifById, areVifsReady } = useXoVifCollection()
const { getNetworkById, areNetworksReady } = useXoNetworkCollection()

const vif = computed(() => (rule?.type === 'VIF' ? getVifById(rule.sourceId) : undefined))

const network = computed(() => (rule !== undefined ? getNetworkById(rule.networkId) : undefined))

const isReady = logicAnd(areVifsReady, areNetworksReady)
</script>
