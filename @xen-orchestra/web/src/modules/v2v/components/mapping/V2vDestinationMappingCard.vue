<template>
  <UiPanelCard class="v2v-destination-mapping-card">
    <UiPanelCardTitle size="medium" :label="t('destination')" />
    <VtsCardRowKeyValue>
      <template #key>{{ t('pool') }}</template>
      <template #value>{{ poolName }}</template>
    </VtsCardRowKeyValue>
    <template v-if="loading">
      <VtsDivider type="stretch" />
      <VtsStateHero format="card" type="busy" size="extra-small" horizontal />
    </template>
    <template v-else>
      <V2vMappingCardSection :label="t('disks')" :rows="diskRows">
        <template #key="{ row }">{{ row.label }}</template>
        <template #value="{ row }">
          <V2vTargetValue :target="row.sr" :options="srOptions" />
        </template>
      </V2vMappingCardSection>
      <V2vMappingCardSection :label="t('network-adapters')" :rows="nicRows">
        <template #key="{ row }">{{ row.label }}</template>
        <template #value="{ row }">
          <V2vTargetValue :target="row.network" :options="networkOptions" />
        </template>
      </V2vMappingCardSection>
    </template>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import V2vMappingCardSection from '@/modules/v2v/components/mapping/V2vMappingCardSection.vue'
import V2vTargetValue from '@/modules/v2v/components/mapping/V2vTargetValue.vue'
import type { V2vDiskMappingRow, V2vNicMappingRow, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

// The mapping of a VM as the side panel shows it: the settings drawer edits it. Until the pool offers load, a target
// could only be named by its id
defineProps<{
  poolName: string
  diskRows: V2vDiskMappingRow[]
  nicRows: V2vNicMappingRow[]
  srOptions: V2vTargetOption<FrontXoSr['id']>[]
  networkOptions: V2vTargetOption<FrontXoNetwork['id']>[]
  loading: boolean
}>()

const { t } = useI18n()
</script>
