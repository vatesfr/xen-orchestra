<template>
  <UiCard>
    <UiCardTitle>{{ t('hosts-status') }}</UiCardTitle>
    <VtsLoadingHero v-if="!areHostsStatusReady" type="card" />
    <template v-else>
      <VtsDonutChartWithLegend :icon="faServer" :segments />
      <UiCardNumbers :label="t('total')" :value="status?.total" class="total" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoDashboard } from '@/types/xo/dashboard.type.ts'
import type { DonutChartWithLegendProps } from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsDonutChartWithLegend from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { status } = defineProps<{
  status: XoDashboard['hostsStatus'] | undefined
}>()

const { t } = useI18n()

const areHostsStatusReady = computed(() => status !== undefined)

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('hosts-status.running'),
    value: status?.running ?? 0,
    accent: 'success',
  },
  {
    label: t('hosts-status.halted'),
    value: status?.halted ?? 0,
    accent: 'warning',
  },
  {
    label: t('hosts-status.unknown'),
    value: status?.unknown ?? 0,
    accent: 'muted',
    tooltip: t('hosts-status.unknown.tooltip'),
  },
])
</script>

<style lang="postcss" scoped>
.total {
  margin-left: auto;
}
</style>
