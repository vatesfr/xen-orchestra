<template>
  <VtsContentSidePanel class="security">
    <UiCard class="container">
      <VtsStateHero v-if="!isReady" format="page" type="busy" size="medium" />
      <TrafficRulesTable v-else :rules="trafficRules" :pool>
        <template #title-action>
          <UiLink :to="{ name: '/traffic-rule/new', query: { poolid: pool.id } }" icon="fa:plus" size="medium">
            {{ t('new') }}
          </UiLink>
        </template>
      </TrafficRulesTable>
    </UiCard>
    <TrafficRulesSidePanel :rule="selectedRule" @close="selectedRule = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import TrafficRulesSidePanel from '@/modules/traffic-rules/components/list/panel/TrafficRulesSidePanel.vue'
import TrafficRulesTable from '@/modules/traffic-rules/components/TrafficRulesTable.vue'
import { useTrafficRules } from '@/modules/traffic-rules/composables/traffic-rules.composable'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import type { TrafficRule } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { vifs, areVifsReady } = useXoVifCollection()
const { networks, areNetworksReady } = useXoNetworkCollection()
const { areVmsReady } = useXoVmCollection()

const isReady = logicAnd(areVifsReady, areNetworksReady, areVmsReady)

const poolVifs = computed(() => vifs.value.filter(vif => vif.$pool === pool.id))

const poolNetworks = computed(() => networks.value.filter(network => network.$pool === pool.id))

const { trafficRules } = useTrafficRules(poolVifs, poolNetworks)

const selectedRule = useRouteQuery<TrafficRule | undefined>('id', {
  toData: id => trafficRules.value.find(rule => rule.id === id),
  toQuery: rule => rule?.id ?? '',
})
</script>

<style scoped lang="postcss">
.security {
  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
