<template>
  <VtsContentSidePanel class="traffic-rules">
    <UiCard class="container">
      <VtsStateHero v-if="!isReady" format="page" type="busy" size="medium" />
      <TrafficRulesTable v-else :rules="trafficRules" :pool :show-xapi-plugin-required-error show-priority>
        <template #title-action>
          <NewTrafficRuleButton :pool-id="pool.id" />
        </template>
      </TrafficRulesTable>
    </UiCard>
    <template #panel>
      <TrafficRulesSidePanel
        :rule="selectedRule"
        :rules="trafficRules"
        show-priority
        @close="selectedRule = undefined"
      />
    </template>
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import NewTrafficRuleButton from '@/modules/traffic-rules/components/actions/new/NewTrafficRuleButton.vue'
import TrafficRulesSidePanel from '@/modules/traffic-rules/components/list/panel/TrafficRulesSidePanel.vue'
import TrafficRulesTable from '@/modules/traffic-rules/components/TrafficRulesTable.vue'
import { useTrafficRules } from '@/modules/traffic-rules/composables/traffic-rules.composable.ts'
import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'
import { isNetworkRuleSupported } from '@/modules/traffic-rules/utils/xo-traffic-rule.util.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { vifs, areVifsReady } = useXoVifCollection()

const { networks, areNetworksReady } = useXoNetworkCollection()

const { areVmsReady } = useXoVmCollection()

const isReady = logicAnd(areVifsReady, areNetworksReady, areVmsReady)

const showXapiPluginRequiredError = computed(() => !isNetworkRuleSupported(pool))

const poolVifs = computed(() => vifs.value.filter(vif => vif.$pool === pool.id))

const poolNetworks = computed(() => networks.value.filter(network => network.$pool === pool.id))

const { trafficRules } = useTrafficRules(poolVifs, poolNetworks)

const selectedRule = useRouteQuery<RankedTrafficRule | undefined>('id', {
  toData: id => trafficRules.value.find(rule => rule.id === id),
  toQuery: rule => rule?.id ?? '',
})
</script>

<style scoped lang="postcss">
.traffic-rules {
  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
