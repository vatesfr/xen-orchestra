<template>
  <VtsStateHero v-if="busy" format="card" type="busy" size="medium" />
  <VtsStateHero v-else-if="hasError" format="card" type="error" size="medium">
    {{ t('error-no-data') }}
  </VtsStateHero>
  <VtsStateHero v-else-if="items.length === 0" format="card" type="no-data" size="medium">
    {{ t('no-data-to-calculate') }}
  </VtsStateHero>
  <template v-else>
    <VtsProgressBarGroup :items :legend-type :thresholds />
    <slot />
  </template>
</template>

<script lang="ts" setup>
import type {
  ProgressBarLegendType,
  ProgressBarThresholdConfig,
} from '@core/components/progress-bar/VtsProgressBar.vue'
import VtsProgressBarGroup, {
  type ProgressBarGroupItem,
} from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  items: ProgressBarGroupItem[]
  legendType: ProgressBarLegendType
  busy?: boolean
  hasError?: boolean
  thresholds?: ProgressBarThresholdConfig
}>()

defineSlots<{
  default?(): any
}>()

const { t } = useI18n()
</script>
