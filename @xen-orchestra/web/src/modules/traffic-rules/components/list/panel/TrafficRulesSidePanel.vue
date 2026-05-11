<template>
  <VtsStateHero v-if="!isReady" format="panel" type="busy" size="medium" />
  <UiPanel v-else :class="{ 'mobile-drawer': uiStore.isSmall }" closable @close="emit('close')">
    <template #default>
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
  </UiPanel>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import TrafficRuleNetworkInfosCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleNetworkInfosCard.vue'
import TrafficRuleNetworkPifsCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleNetworkPifsCard.vue'
import TrafficRuleSummaryCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleSummaryCard.vue'
import TrafficRuleVifInfosCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleVifInfosCard.vue'
import TrafficRuleVifNetworkInfoCard from '@/modules/traffic-rules/components/list/panel/cards/TrafficRuleVifNetworkInfoCard.vue'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { TrafficRule } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

const { rule } = defineProps<{ rule: TrafficRule }>()

const emit = defineEmits<{
  close: []
}>()

const uiStore = useUiStore()

const { getVifById, areVifsReady } = useXoVifCollection()

const { getNetworkById, areNetworksReady } = useXoNetworkCollection()

const vif = computed(() => (rule.type === 'VIF' ? getVifById(rule.sourceId) : undefined))

const network = computed(() => getNetworkById(rule.networkId))

const isReady = logicAnd(areVifsReady, areNetworksReady)
</script>

<style scoped lang="postcss">
.mobile-drawer {
  position: fixed;
  inset: 0;

  .action-buttons-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
</style>
