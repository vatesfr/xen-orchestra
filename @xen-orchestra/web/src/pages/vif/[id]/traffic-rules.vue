<template>
  <VtsContentSidePanel class="traffic-rules">
    <UiCard class="container">
      <TrafficRulesTable :rules="trafficRules">
        <template #title-action>
          <UiLink :to="{ name: '/traffic-rule/new', query: { vifid: vif.id } }" icon="fa:plus" size="medium">
            {{ t('new') }}
          </UiLink>
        </template>
      </TrafficRulesTable>
    </UiCard>
    <TrafficRulesSidePanel :rule="selectedRule" @close="selectedRule = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import TrafficRulesSidePanel from '@/modules/traffic-rules/components/list/panel/TrafficRulesSidePanel.vue'
import TrafficRulesTable from '@/modules/traffic-rules/components/TrafficRulesTable.vue'
import { useTrafficRules } from '@/modules/traffic-rules/composables/traffic-rules.composable.ts'
import { type FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{ vif: FrontXoVif }>()

const { t } = useI18n()

const { trafficRules } = useTrafficRules(() => [vif], [])

const selectedRule = useRouteQuery<TrafficRule | undefined>('id', {
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
