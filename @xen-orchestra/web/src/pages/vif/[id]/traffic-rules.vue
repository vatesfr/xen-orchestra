<template>
  <div class="traffic-rules" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <TrafficRulesTable :rules="trafficRules" :pool>
        <template #title-action>
          <UiLink :to="{ name: '/traffic-rule/new', query: { vifid: vif.id } }" icon="fa:plus" size="medium">
            {{ t('new') }}
          </UiLink>
        </template>
      </TrafficRulesTable>
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
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import TrafficRulesSidePanel from '@/modules/traffic-rules/components/list/panel/TrafficRulesSidePanel.vue'
import TrafficRulesTable from '@/modules/traffic-rules/components/TrafficRulesTable.vue'
import { useTrafficRules } from '@/modules/traffic-rules/composables/traffic-rules.composable.ts'
import { type FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{ vif: FrontXoVif }>()
const uiStore = useUiStore()

const { t } = useI18n()

const { useGetPoolById } = useXoPoolCollection()
const pool = useGetPoolById(() => vif.$pool)

const { trafficRules } = useTrafficRules(() => [vif], [])

const selectedRule = useRouteQuery<TrafficRule | undefined>('id', {
  toData: id => trafficRules.value.find(rule => rule.id === id),
  toQuery: rule => rule?.id ?? '',
})
</script>

<style scoped lang="postcss">
.traffic-rules {
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
