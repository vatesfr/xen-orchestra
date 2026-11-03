<template>
  <UiPanelCard class="v2v-active-mapping-card">
    <UiPanelCardTitle size="medium" icon="fa:lock" :label="t('active-mapping')" />
    <UiInfo accent="info" wrap>{{ t('v2v:locked-since-first-sync') }}</UiInfo>
    <VtsCardRowKeyValue>
      <template #key>{{ t('pool') }}</template>
      <template #value>{{ poolName }}</template>
    </VtsCardRowKeyValue>
    <template v-if="loading">
      <VtsDivider type="stretch" />
      <VtsStateHero format="card" type="busy" size="extra-small" horizontal />
    </template>
    <template v-else>
      <V2vMappingCardSection
        v-for="section of sections"
        :key="section.label"
        :label="section.label"
        :rows="section.rows"
      >
        <template #key="{ row }">
          <InlineParts>
            <span v-for="part of row.sourceParts" :key="part">{{ part }}</span>
          </InlineParts>
        </template>
        <template #value="{ row }">{{ row.destination }}</template>
      </V2vMappingCardSection>
    </template>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import V2vMappingCardSection from '@/modules/v2v/components/mapping/V2vMappingCardSection.vue'
import type { V2vActiveMappingRow } from '@/modules/v2v/types/v2v-mapping.type.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// A resumed VM has no drawer: the source details of its devices are shown here, beside their locked destination
const { diskRows, nicRows } = defineProps<{
  poolName: string
  diskRows: V2vActiveMappingRow[]
  nicRows: V2vActiveMappingRow[]
  loading: boolean
}>()

const { t } = useI18n()

const sections = computed(() => [
  { label: t('disks'), rows: diskRows },
  { label: t('network-adapters'), rows: nicRows },
])
</script>
