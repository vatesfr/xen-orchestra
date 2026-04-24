<template>
  <div class="security" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <VtsStateHero v-if="!isReady" format="panel" type="busy" size="medium" />
      <TrafficRulesTable v-else :rules="trafficRules" @select="selectedRule = $event" />
    </UiCard>
    <TrafficRulesSidePanel v-if="selectedRule" :rule="selectedRule" @close="selectedRule = undefined" />
    <UiPanel v-else-if="!uiStore.isSmall">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import TrafficRulesSidePanel from '@/modules/traffic-rules/components/list/panel/TrafficRulesSidePanel.vue'
import TrafficRulesTable from '@/modules/traffic-rules/components/TrafficRulesTable.vue'
import { useTrafficRules } from '@/modules/traffic-rules/composables/traffic-rules.composable'
import type { TrafficRule } from '@/modules/traffic-rules/types.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { logicAnd } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const uiStore = useUiStore()

const { t } = useI18n()

const { vifs, areVifsReady } = useXoVifCollection()

const { networks, areNetworksReady } = useXoNetworkCollection()

const isReady = logicAnd(areVifsReady, areNetworksReady)

const poolVifs = computed(() => vifs.value.filter(vif => vif.$pool === pool.id))

const poolNetworks = computed(() => networks.value.filter(network => network.$pool === pool.id))

const { trafficRules } = useTrafficRules(poolVifs, poolNetworks)

const selectedRule = ref<TrafficRule | undefined>()
</script>

<style scoped lang="postcss">
.security {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
