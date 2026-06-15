<template>
  <VtsSidePanel :selected="!!rule" :closable="!!rule" @close="emit('close')">
    <template v-if="rule" #actions>
      <TrafficRuleActions :rule class="delete-button" />
    </template>

    <template #default>
      <VtsStateHero v-if="!rule" format="panel" type="no-selection" size="medium" />
      <VtsStateHero v-else-if="!isReady" format="panel" type="busy" size="medium" />
      <template v-else>
        <TrafficRuleSummaryCard :rule />

        <template v-if="vif">
          <TrafficRuleVifInfosCard :rule :vif />
          <TrafficRuleVifNetworkInfoCard :rule :vif />
        </template>

        <template v-else-if="network">
          <TrafficRuleNetworkInfosCard :rule :network />
          <TrafficRuleNetworkPifsCard :rule :network />
        </template>
      </template>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import TrafficRuleActions from '@/modules/traffic-rules/components/actions/TrafficRuleActions.vue'
import TrafficRuleNetworkInfosCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleNetworkInfosCard.vue'
import TrafficRuleNetworkPifsCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleNetworkPifsCard.vue'
import TrafficRuleSummaryCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleSummaryCard.vue'
import TrafficRuleVifInfosCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleVifInfosCard.vue'
import TrafficRuleVifNetworkInfoCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleVifNetworkInfoCard.vue'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import type { TrafficRule } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

const { rule } = defineProps<{ rule?: TrafficRule }>()

const emit = defineEmits<{
  close: []
}>()

const { getVifById, areVifsReady } = useXoVifCollection()
const { getNetworkById, areNetworksReady } = useXoNetworkCollection()

const vif = computed(() => (rule?.type === 'VIF' ? getVifById(rule.sourceId) : undefined))

const network = computed(() => (rule !== undefined ? getNetworkById(rule.networkId) : undefined))

const isReady = logicAnd(areVifsReady, areNetworksReady)
</script>
